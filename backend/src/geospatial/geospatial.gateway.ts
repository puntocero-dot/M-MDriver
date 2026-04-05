import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GeospatialService } from './geospatial.service';
import { LocationUpdateDto } from './dto/location-update.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { Role } from '../common/enums/role.enum';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
}

@WebSocketGateway({ namespace: 'tracking', cors: { origin: '*' } })
export class GeospatialGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GeospatialGateway.name);

  // Map of socketId -> JwtPayload for connected clients
  private readonly connectedClients = new Map<string, JwtPayload>();

  constructor(
    private readonly geospatialService: GeospatialService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Validate JWT from handshake.auth.token on every connection.
   */
  handleConnection(client: Socket): void {
    try {
      const token = client.handshake.auth?.token as string | undefined;

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: no token provided`);
        client.disconnect(true);
        return;
      }

      const secret = this.configService.getOrThrow<string>('jwt.secret');
      const payload = this.jwtService.verify<JwtPayload>(token, { secret });

      (client as AuthenticatedSocket).user = payload;
      this.connectedClients.set(client.id, payload);

      this.logger.log(
        `Client connected: ${client.id} — user: ${payload.sub} (${payload.role})`,
      );
    } catch {
      this.logger.warn(`Client ${client.id} rejected: invalid token`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const user = this.connectedClients.get(client.id);

    if (user) {
      if (user.role === Role.DRIVER) {
        // Mark driver as unavailable in Redis geo set on disconnect
        await this.geospatialService.removeDriverLocation(user.sub);
        this.logger.log(`Driver ${user.sub} marked unavailable (disconnected)`);
      }
      this.connectedClients.delete(client.id);
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Driver sends real-time GPS location update.
   * Validates driver owns the trip, stores to Redis, broadcasts to trip room.
   */
  @SubscribeMessage('driver:location')
  async handleDriverLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LocationUpdateDto,
  ): Promise<void> {
    const user = this.connectedClients.get(client.id);

    if (!user) {
      throw new WsException('No autenticado');
    }

    if (user.role !== Role.DRIVER) {
      throw new WsException('Solo conductores pueden enviar ubicación');
    }

    // Validate DTO
    const dto = plainToInstance(LocationUpdateDto, data);
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new WsException(
        `Datos inválidos: ${errors.map((e) => e.toString()).join(', ')}`,
      );
    }

    const driverId = user.sub;

    // Store latest position in Redis GEOADD
    await this.geospatialService.storeDriverLocation(
      driverId,
      dto.lng,
      dto.lat,
    );

    // Append to GPS trace buffer
    await this.geospatialService.saveGpsTrace({
      tripId: dto.tripId,
      driverId,
      lat: dto.lat,
      lng: dto.lng,
      speed: dto.speed,
      heading: dto.heading,
      accuracy: dto.accuracy,
      timestamp: Date.now(),
    });

    // Broadcast to all clients watching this trip
    const roomName = `trip:${dto.tripId}`;
    this.server.to(roomName).emit('location:update', {
      tripId: dto.tripId,
      driverId,
      lat: dto.lat,
      lng: dto.lng,
      speed: dto.speed,
      heading: dto.heading,
      accuracy: dto.accuracy,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Client joins a trip room to receive live location updates.
   */
  @SubscribeMessage('client:join_trip')
  async handleJoinTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tripId: string },
  ): Promise<{ success: boolean; room: string }> {
    const user = this.connectedClients.get(client.id);

    if (!user) {
      throw new WsException('No autenticado');
    }

    const roomName = `trip:${payload.tripId}`;
    await client.join(roomName);

    this.logger.log(`User ${user.sub} joined room ${roomName}`);

    return { success: true, room: roomName };
  }

  /**
   * Client leaves a trip room.
   */
  @SubscribeMessage('client:leave_trip')
  async handleLeaveTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tripId: string },
  ): Promise<{ success: boolean }> {
    const roomName = `trip:${payload.tripId}`;
    await client.leave(roomName);

    this.logger.log(`Client ${client.id} left room ${roomName}`);

    return { success: true };
  }

  /**
   * Emit SOS alert to all supervisors in the 'supervisors' room.
   * Called internally by SosService.
   */
  emitSosAlert(alertData: Record<string, unknown>): void {
    this.server.to('supervisors').emit('sos:alert', alertData);
    this.logger.warn(
      `SOS alert emitted for trip: ${String(alertData['tripId'])}`,
    );
  }
}
