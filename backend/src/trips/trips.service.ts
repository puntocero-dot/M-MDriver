import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Trip } from './entities/trip.entity';
import { TripStop } from './entities/trip-stop.entity';
import { TripStateMachineService } from './trip-state-machine.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { TripStatus } from '../common/enums/trip-status.enum';
import { Role } from '../common/enums/role.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
    @InjectRepository(TripStop)
    private readonly stopsRepository: Repository<TripStop>,
    private readonly stateMachine: TripStateMachineService,
  ) {}

  async create(dto: CreateTripDto, requestingUser: JwtPayload): Promise<Trip> {
    const trip = this.tripsRepository.create({
      clientId: requestingUser.sub,
      pickupAddress: dto.pickupAddress,
      dropoffAddress: dto.dropoffAddress,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      quotedPrice: dto.quotedPrice,
      status: TripStatus.QUOTED,
    });

    const savedTrip: Trip = await this.tripsRepository.save(trip);

    if (dto.stops && dto.stops.length > 0) {
      const stops = dto.stops.map((stop, index) =>
        this.stopsRepository.create({
          tripId: savedTrip.id,
          stopOrder: index + 1,
          address: stop.address,
          notes: stop.notes ?? null,
        }),
      );
      await this.stopsRepository.save(stops);
    }

    return this.findById(savedTrip.id);
  }

  async findById(id: string): Promise<Trip> {
    const trip = await this.tripsRepository.findOne({
      where: { id },
      relations: ['stops', 'client', 'driver'],
      order: { stops: { stopOrder: 'ASC' } },
    });

    if (!trip) {
      throw new NotFoundException('Viaje no encontrado');
    }

    return trip;
  }

  async findByClientId(
    clientId: string,
    page = 1,
    limit = 20,
  ): Promise<[Trip[], number]> {
    return this.tripsRepository.findAndCount({
      where: { clientId },
      relations: ['stops'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async updateStatus(
    tripId: string,
    toStatus: TripStatus,
    requestingUser: JwtPayload,
    metadata?: Record<string, unknown>,
  ): Promise<Trip> {
    const trip = await this.findById(tripId);
    this.assertCanModify(trip, requestingUser);

    return this.stateMachine.transition(
      tripId,
      toStatus,
      requestingUser.sub,
      metadata,
    );
  }

  async generateShareToken(tripId: string, clientId: string): Promise<string> {
    const trip = await this.findById(tripId);

    if (trip.clientId !== clientId) {
      throw new ForbiddenException(
        'No tienes permiso para compartir este viaje',
      );
    }

    const token = uuidv4();
    trip.shareToken = token;
    trip.isSharedLive = true;
    await this.tripsRepository.save(trip);

    return token;
  }

  /**
   * Set the driver on a trip (called by DriversService during assignment).
   */
  async setDriverId(tripId: string, driverId: string): Promise<void> {
    await this.tripsRepository.update(tripId, { driverId });
  }

  private assertCanModify(trip: Trip, user: JwtPayload): void {
    const isClient = trip.clientId === user.sub;
    const isDriver = trip.driverId === user.sub;
    const isPrivileged = [Role.SUPERVISOR, Role.SUPERADMIN].includes(user.role);

    if (!isClient && !isDriver && !isPrivileged) {
      throw new ForbiddenException(
        'No tienes permiso para modificar este viaje',
      );
    }
  }
}
