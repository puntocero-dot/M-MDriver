import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SosAlert, SosAlertStatus } from './entities/sos-alert.entity';
import { TripStateMachineService } from '../trips/trip-state-machine.service';
import { TripStatus } from '../common/enums/trip-status.enum';
import { GeospatialGateway } from '../geospatial/geospatial.gateway';
import { MedicalService } from '../medical/medical.service';

@Injectable()
export class SosService {
  private readonly logger = new Logger(SosService.name);

  constructor(
    @InjectRepository(SosAlert)
    private readonly sosAlertsRepository: Repository<SosAlert>,
    private readonly tripStateMachine: TripStateMachineService,
    private readonly geospatialGateway: GeospatialGateway,
    private readonly medicalService: MedicalService,
  ) {}

  /**
   * Trigger an SOS alert for a trip.
   * Transitions trip to SOS_ACTIVE and notifies supervisors via WebSocket.
   */
  async trigger(
    tripId: string,
    userId: string,
    lat: number,
    lng: number,
  ): Promise<SosAlert> {
    // Create SOS alert record
    const alert = this.sosAlertsRepository.create({
      tripId,
      triggeredBy: userId,
      latitude: lat,
      longitude: lng,
      status: SosAlertStatus.ACTIVE,
    });

    const saved = await this.sosAlertsRepository.save(alert);

    // Transition trip to SOS_ACTIVE via state machine
    try {
      await this.tripStateMachine.transition(
        tripId,
        TripStatus.SOS_ACTIVE,
        userId,
        { sosAlertId: saved.id, lat, lng },
      );
    } catch (err) {
      this.logger.warn(
        `Could not transition trip ${tripId} to SOS_ACTIVE: ${(err as Error).message}`,
      );
      // Do not block SOS creation even if transition fails
    }

    // Fetch client's medical profile (may be null if not set up)
    const medicalProfile = await this.medicalService
      .findForSOS(userId)
      .catch(() => null);

    // Emit WebSocket event to supervisors room — includes decrypted medical profile
    // for immediate triage by supervisors without requiring a separate API call.
    this.geospatialGateway.emitSosAlert({
      alertId: saved.id,
      tripId,
      triggeredBy: userId,
      lat,
      lng,
      status: SosAlertStatus.ACTIVE,
      timestamp: new Date().toISOString(),
      medicalProfile: medicalProfile ?? null,
    });

    this.logger.warn(
      `SOS triggered — alertId: ${saved.id}, trip: ${tripId}, user: ${userId}`,
    );

    return saved;
  }

  /**
   * Supervisor acknowledges an active SOS alert.
   */
  async acknowledge(alertId: string, supervisorId: string): Promise<SosAlert> {
    const alert = await this.findById(alertId);

    if (alert.status !== SosAlertStatus.ACTIVE) {
      throw new BadRequestException(
        `La alerta ${alertId} no está ACTIVE (actual: ${alert.status})`,
      );
    }

    alert.status = SosAlertStatus.ACKNOWLEDGED;
    alert.acknowledgedBy = supervisorId;

    const updated = await this.sosAlertsRepository.save(alert);
    this.logger.log(
      `SOS acknowledged — alertId: ${alertId} by supervisor: ${supervisorId}`,
    );
    return updated;
  }

  /**
   * Supervisor resolves an SOS alert and transitions trip back to IN_TRANSIT.
   */
  async resolve(
    alertId: string,
    supervisorId: string,
    notes?: string,
  ): Promise<SosAlert> {
    const alert = await this.findById(alertId);

    if (alert.status === SosAlertStatus.RESOLVED) {
      throw new BadRequestException(`La alerta ${alertId} ya está resuelta`);
    }

    alert.status = SosAlertStatus.RESOLVED;
    alert.acknowledgedBy = alert.acknowledgedBy ?? supervisorId;
    alert.resolvedAt = new Date();
    alert.notes = notes ?? null;

    const updated = await this.sosAlertsRepository.save(alert);

    // Transition trip back to IN_TRANSIT
    try {
      await this.tripStateMachine.transition(
        alert.tripId,
        TripStatus.IN_TRANSIT,
        supervisorId,
        { sosAlertId: alertId, resolvedBy: supervisorId },
      );
    } catch (err) {
      this.logger.warn(
        `Could not transition trip ${alert.tripId} back to IN_TRANSIT: ${(err as Error).message}`,
      );
    }

    this.logger.log(
      `SOS resolved — alertId: ${alertId} by supervisor: ${supervisorId}`,
    );
    return updated;
  }

  /**
   * Return all ACTIVE and ACKNOWLEDGED alerts with related trip and user info.
   */
  async getActiveAlerts(): Promise<SosAlert[]> {
    return this.sosAlertsRepository.find({
      where: {
        status: In([SosAlertStatus.ACTIVE, SosAlertStatus.ACKNOWLEDGED]),
      },
      relations: ['trip', 'triggeredByUser', 'acknowledgedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(alertId: string): Promise<SosAlert> {
    const alert = await this.sosAlertsRepository.findOne({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException(`Alerta SOS ${alertId} no encontrada`);
    }

    return alert;
  }
}
