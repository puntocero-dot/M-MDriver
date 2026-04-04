import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripStatus } from '../common/enums/trip-status.enum';
import { Trip } from './entities/trip.entity';
import { TripStateTransition } from './entities/trip-state-transition.entity';

/**
 * Maquina de estados para el ciclo de vida de un viaje.
 * Define las transiciones validas y registra cada cambio en audit trail.
 */
const VALID_TRANSITIONS = new Map<TripStatus, TripStatus[]>([
  [TripStatus.QUOTED,              [TripStatus.CONFIRMED, TripStatus.CANCELLED]],
  [TripStatus.CONFIRMED,           [TripStatus.DRIVER_ASSIGNED, TripStatus.CANCELLED]],
  [TripStatus.DRIVER_ASSIGNED,     [TripStatus.EN_ROUTE_TO_PICKUP, TripStatus.CANCELLED]],
  [TripStatus.EN_ROUTE_TO_PICKUP,  [TripStatus.AT_PICKUP, TripStatus.CANCELLED]],
  [TripStatus.AT_PICKUP,           [TripStatus.IN_TRANSIT, TripStatus.CANCELLED]],
  [TripStatus.IN_TRANSIT,          [TripStatus.AT_STOP, TripStatus.COMPLETED, TripStatus.SOS_ACTIVE]],
  [TripStatus.AT_STOP,             [TripStatus.WAITING_AT_STOP, TripStatus.IN_TRANSIT, TripStatus.COMPLETED]],
  [TripStatus.WAITING_AT_STOP,     [TripStatus.IN_TRANSIT, TripStatus.COMPLETED, TripStatus.SOS_ACTIVE]],
  [TripStatus.SOS_ACTIVE,          [TripStatus.IN_TRANSIT, TripStatus.COMPLETED, TripStatus.CANCELLED]],
  [TripStatus.COMPLETED,           []],
  [TripStatus.CANCELLED,           []],
]);

@Injectable()
export class TripStateMachineService {
  private readonly logger = new Logger(TripStateMachineService.name);

  constructor(
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
    @InjectRepository(TripStateTransition)
    private readonly transitionsRepository: Repository<TripStateTransition>,
  ) {}

  canTransition(from: TripStatus, to: TripStatus): boolean {
    return VALID_TRANSITIONS.get(from)?.includes(to) ?? false;
  }

  async transition(
    tripId: string,
    toStatus: TripStatus,
    triggeredBy: string,
    metadata?: Record<string, unknown>,
  ): Promise<Trip> {
    const trip = await this.tripsRepository.findOne({ where: { id: tripId } });

    if (!trip) {
      throw new BadRequestException(`Viaje ${tripId} no encontrado`);
    }

    const fromStatus = trip.status;

    if (!this.canTransition(fromStatus, toStatus)) {
      throw new BadRequestException(
        `Transición inválida: ${fromStatus} → ${toStatus}`,
      );
    }

    // Update trip status and timestamps
    trip.status = toStatus;
    this.applyStatusSideEffects(trip, toStatus);

    await this.tripsRepository.save(trip);

    // Record audit trail
    const transition = this.transitionsRepository.create({
      tripId,
      fromStatus,
      toStatus,
      triggeredBy,
      metadata: metadata ?? null,
    });
    await this.transitionsRepository.save(transition);

    this.logger.log(
      `Viaje ${tripId}: ${fromStatus} → ${toStatus} (por: ${triggeredBy})`,
    );

    return trip;
  }

  private applyStatusSideEffects(trip: Trip, status: TripStatus): void {
    const now = new Date();

    switch (status) {
      case TripStatus.IN_TRANSIT:
        if (!trip.startedAt) {
          trip.startedAt = now;
        }
        break;
      case TripStatus.COMPLETED:
        trip.completedAt = now;
        break;
      case TripStatus.CANCELLED:
        trip.cancelledAt = now;
        break;
    }
  }
}
