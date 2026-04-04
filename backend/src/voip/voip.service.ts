import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as plivo from 'plivo';
import { ConfigService } from '@nestjs/config';
import { VoipCall, VoipCallStatus } from './entities/voip-call.entity';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

/**
 * VoIP service using Plivo Number Masking API.
 *
 * Plivo Number Masking — ensure PLIVO_PHONE_NUMBER is a Plivo-provisioned
 * number in El Salvador (+503). Both caller and receiver see only the masked
 * Plivo number; neither party's real phone number is exposed during the call.
 *
 * Docs: https://www.plivo.com/docs/voice/api/call/
 */
@Injectable()
export class VoipService {
  private readonly logger = new Logger(VoipService.name);
  private readonly plivoClient: plivo.Client;
  private readonly maskedNumber: string;

  constructor(
    @InjectRepository(VoipCall)
    private readonly voipCallRepository: Repository<VoipCall>,
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    const authId = this.configService.get<string>('PLIVO_AUTH_ID', '');
    const authToken = this.configService.get<string>('PLIVO_AUTH_TOKEN', '');
    this.maskedNumber = this.configService.get<string>('PLIVO_PHONE_NUMBER', '');

    this.plivoClient = new plivo.Client(authId, authToken);
  }

  /**
   * maskCall — initiate a masked proxy call between two trip participants.
   * The Plivo platform places a call from the masked number to each party;
   * neither participant sees the other's real phone number.
   */
  async maskCall(
    requestingUser: JwtPayload,
    tripId: string,
  ): Promise<VoipCall> {
    const trip = await this.tripsRepository.findOne({
      where: { id: tripId },
      relations: ['client', 'driver'],
    });

    if (!trip) {
      throw new NotFoundException(`Viaje ${tripId} no encontrado`);
    }

    // Only the client or the assigned driver of this trip may initiate
    const isClient = requestingUser.sub === trip.clientId;
    const isDriver = requestingUser.sub === trip.driverId;
    if (!isClient && !isDriver) {
      throw new ForbiddenException('Solo el cliente o conductor del viaje puede iniciar la llamada');
    }

    if (!trip.client || !trip.driver) {
      throw new BadRequestException('El viaje debe tener cliente y conductor asignado para iniciar una llamada');
    }

    const callerUserId = requestingUser.sub;
    const receiverUserId = isClient ? (trip.driverId as string) : trip.clientId;

    const callerUser = await this.usersRepository.findOne({ where: { id: callerUserId } });
    const receiverUser = await this.usersRepository.findOne({ where: { id: receiverUserId } });

    if (!callerUser || !receiverUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Create a call log record first
    const voipCall = this.voipCallRepository.create({
      tripId,
      callerUserId,
      receiverUserId,
      status: VoipCallStatus.INITIATED,
    });
    const savedCall = await this.voipCallRepository.save(voipCall);

    try {
      /**
       * Plivo masked call:
       * - from: our Plivo provisioned number (El Salvador +503)
       * - to: receiver's real number
       * - answer_url: Plivo fetches XML to bridge the caller in when receiver answers
       *
       * For full number masking: use Plivo's multiparty call / proxy API, or
       * implement an answer_url that bridges to the caller's number.
       * Here we create an outbound call to the receiver; the answer_url XML
       * should use <Dial> to connect to the caller's number through Plivo.
       */
      const response = await this.plivoClient.calls.create(
        this.maskedNumber,
        receiverUser.phone,
        `${this.configService.get<string>('APP_BASE_URL', 'https://api.mym-driver.com')}/voip/answer/${savedCall.id}`,
        {
          answerMethod: 'GET',
        },
      );

      savedCall.plivoCallUuid = (response as unknown as { requestUuid: string }).requestUuid ?? null;
      savedCall.status = VoipCallStatus.INITIATED;
      await this.voipCallRepository.save(savedCall);

      this.logger.log(
        `Masked call initiated — callId: ${savedCall.id}, tripId: ${tripId}, plivoUuid: ${savedCall.plivoCallUuid ?? 'pending'}`,
      );
    } catch (err) {
      savedCall.status = VoipCallStatus.FAILED;
      await this.voipCallRepository.save(savedCall);
      this.logger.error(`Plivo call failed for trip ${tripId}: ${(err as Error).message}`);
      throw new BadRequestException(`No se pudo iniciar la llamada: ${(err as Error).message}`);
    }

    return savedCall;
  }

  /**
   * getCallStatus — fetch real-time call status from Plivo.
   */
  async getCallStatus(callUuid: string): Promise<Record<string, unknown>> {
    if (!callUuid) {
      throw new BadRequestException('callUuid requerido');
    }

    try {
      const callInfo = await this.plivoClient.calls.get(callUuid);
      return callInfo as unknown as Record<string, unknown>;
    } catch (err) {
      throw new NotFoundException(`Llamada ${callUuid} no encontrada en Plivo: ${(err as Error).message}`);
    }
  }

  async findCallById(id: string): Promise<VoipCall> {
    const call = await this.voipCallRepository.findOne({ where: { id } });
    if (!call) {
      throw new NotFoundException(`Registro de llamada ${id} no encontrado`);
    }
    return call;
  }

  async getCallsForTrip(tripId: string): Promise<VoipCall[]> {
    return this.voipCallRepository.find({
      where: { tripId },
      order: { createdAt: 'DESC' },
    });
  }
}
