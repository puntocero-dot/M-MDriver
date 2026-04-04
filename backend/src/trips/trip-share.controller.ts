import {
  Controller,
  Get,
  Param,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from './entities/trip.entity';
import { GeospatialService } from '../geospatial/geospatial.service';
import { TripStop } from './entities/trip-stop.entity';

interface ShareTrackingResponse {
  tripId: string;
  status: string;
  driverFirstName?: string;
  currentLat?: number;
  currentLng?: number;
  stops: Array<{
    stopOrder: number;
    address: string;
    arrivedAt: Date | null;
    departedAt: Date | null;
  }>;
  estimatedArrival?: string | null;
}

/**
 * TripShareController — PUBLIC endpoint for live trip tracking via share token.
 *
 * No authentication required. The share token is a time-limited secret generated
 * by the client and stored on the trip. Sensitive client PII is not exposed:
 * only the driver's first name, current GPS location, stops, and ETA are returned.
 */
@Controller('share')
export class TripShareController {
  constructor(
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
    private readonly geospatialService: GeospatialService,
  ) {}

  /**
   * GET /share/:token
   * Return trip tracking snapshot for public consumption.
   * Only works if trip.isSharedLive = true and shareToken matches.
   */
  @Get(':token')
  async getByShareToken(
    @Param('token') token: string,
  ): Promise<ShareTrackingResponse> {
    const trip = await this.tripsRepository.findOne({
      where: { shareToken: token },
      relations: ['driver', 'stops'],
      order: { stops: { stopOrder: 'ASC' } },
    });

    if (!trip) {
      throw new NotFoundException('Token de seguimiento no válido');
    }

    if (!trip.isSharedLive) {
      throw new ForbiddenException('El seguimiento en vivo no está activo para este viaje');
    }

    // Fetch live driver location from Redis (if trip is active)
    let currentLat: number | undefined;
    let currentLng: number | undefined;

    if (trip.driverId) {
      const location = await this.geospatialService.getDriverLocation(trip.driverId);
      if (location) {
        currentLat = location.lat;
        currentLng = location.lng;
      }
    }

    return {
      tripId: trip.id,
      status: trip.status,
      // Only expose first name — no email, phone, or other PII
      driverFirstName: trip.driver?.firstName,
      currentLat,
      currentLng,
      stops: (trip.stops ?? []).map((stop: TripStop) => ({
        stopOrder: stop.stopOrder,
        address: stop.address,
        arrivedAt: stop.arrivedAt,
        departedAt: stop.departedAt,
      })),
      // estimatedArrival could be populated by a separate ETA service in the future
      estimatedArrival: trip.scheduledAt?.toISOString() ?? null,
    };
  }
}
