import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DrivingEvent, DrivingEventType } from './entities/driving-event.entity';
import { DriverProfile } from '../drivers/entities/driver-profile.entity';
import { DrivingEventDto } from './dto/driving-event.dto';
import { GeospatialGateway } from '../geospatial/geospatial.gateway';

/** Penalty points deducted per driving event type */
const EVENT_PENALTIES: Record<DrivingEventType, number> = {
  [DrivingEventType.HARD_BRAKE]: 3,
  [DrivingEventType.HARD_ACCELERATION]: 2,
  [DrivingEventType.SHARP_TURN]: 2,
  [DrivingEventType.SPEEDING]: 5,
};

/** Severity threshold above which a supervisor WS alert is emitted */
const HIGH_SEVERITY_THRESHOLD = 8;

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(
    @InjectRepository(DrivingEvent)
    private readonly eventRepository: Repository<DrivingEvent>,
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepository: Repository<DriverProfile>,
    private readonly geospatialGateway: GeospatialGateway,
  ) {}

  /**
   * recordEvent — persist a single driving event.
   * If severity >= 8 (HIGH_SEVERITY_THRESHOLD), emit a WS alert to SUPERVISOR room.
   */
  async recordEvent(driverId: string, dto: DrivingEventDto): Promise<DrivingEvent> {
    const event = this.eventRepository.create({
      tripId: dto.tripId,
      driverId,
      eventType: dto.eventType,
      severity: dto.severity,
      lat: dto.lat,
      lng: dto.lng,
      speedKmh: dto.speedKmh,
      recordedAt: new Date(dto.recordedAt),
    });

    const saved = await this.eventRepository.save(event);

    if (dto.severity >= HIGH_SEVERITY_THRESHOLD) {
      this.geospatialGateway.emitSosAlert({
        type: 'TELEMETRY_HIGH_SEVERITY',
        eventId: String(saved.id),
        tripId: dto.tripId,
        driverId,
        eventType: dto.eventType,
        severity: dto.severity,
        lat: dto.lat,
        lng: dto.lng,
        speedKmh: dto.speedKmh,
        timestamp: saved.recordedAt.toISOString(),
      });

      this.logger.warn(
        `High-severity driving event (${dto.eventType}, severity ${dto.severity}) for driver ${driverId}, trip ${dto.tripId}`,
      );
    }

    return saved;
  }

  /**
   * recordBatch — persist multiple driving events from a single driver batch upload.
   */
  async recordBatch(driverId: string, events: DrivingEventDto[]): Promise<DrivingEvent[]> {
    const results: DrivingEvent[] = [];
    for (const dto of events) {
      // ensure each event is attributed to the authenticated driver
      results.push(await this.recordEvent(driverId, { ...dto }));
    }
    return results;
  }

  /**
   * getDriverScore — calculate a 0–100 driving safety score for a driver
   * over the given date range.
   *
   * Score = 100 − (sum of weighted penalties per event)
   * Penalties: HARD_BRAKE −3, HARD_ACCELERATION −2, SHARP_TURN −2, SPEEDING −5
   * Minimum score: 0
   */
  async getDriverScore(
    driverId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<{ driverId: string; score: number; eventCount: number; fromDate: Date; toDate: Date }> {
    const events = await this.eventRepository.find({
      where: {
        driverId,
        recordedAt: Between(fromDate, toDate),
      },
    });

    let penalty = 0;
    for (const event of events) {
      penalty += EVENT_PENALTIES[event.eventType] ?? 0;
    }

    const score = Math.max(0, 100 - penalty);

    return { driverId, score, eventCount: events.length, fromDate, toDate };
  }

  /**
   * getTripEvents — return all driving events for a given trip.
   */
  async getTripEvents(tripId: string): Promise<DrivingEvent[]> {
    return this.eventRepository.find({
      where: { tripId },
      order: { recordedAt: 'ASC' },
    });
  }

  /**
   * updateDriverRating — recalculate driver safety score from the last 30 days
   * and persist it to the driver_profiles.rating_avg column.
   *
   * Note: rating_avg is also influenced by passenger ratings (handled elsewhere).
   * This method updates only the telemetry-based safety component.
   */
  async updateDriverRating(driverId: string): Promise<void> {
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const { score } = await this.getDriverScore(driverId, fromDate, toDate);

    // Normalize score to 0–5 rating scale (score / 20 gives 0–5)
    const ratingFromTelemetry = +(score / 20).toFixed(2);

    await this.driverProfileRepository.update(
      { userId: driverId },
      { ratingAvg: ratingFromTelemetry },
    );

    this.logger.log(
      `Updated driver ${driverId} telemetry rating: ${ratingFromTelemetry} (score: ${score})`,
    );
  }
}
