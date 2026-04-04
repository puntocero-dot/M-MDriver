import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverProfile } from './entities/driver-profile.entity';
import { TripStateMachineService } from '../trips/trip-state-machine.service';
import { TripsService } from '../trips/trips.service';
import { TripStatus } from '../common/enums/trip-status.enum';
import { Trip } from '../trips/entities/trip.entity';

export interface NearbyDriver {
  profile: DriverProfile;
  distanceKm: number;
}

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name);

  constructor(
    @InjectRepository(DriverProfile)
    private readonly driverProfilesRepository: Repository<DriverProfile>,
    private readonly tripStateMachine: TripStateMachineService,
    private readonly tripsService: TripsService,
  ) {}

  /**
   * Toggle a driver's availability status.
   */
  async updateAvailability(
    driverId: string,
    isAvailable: boolean,
  ): Promise<DriverProfile> {
    const profile = await this.findByUserId(driverId);
    profile.isAvailable = isAvailable;

    const updated = await this.driverProfilesRepository.save(profile);
    this.logger.log(`Driver ${driverId} availability set to ${isAvailable}`);
    return updated;
  }

  /**
   * Update the driver's current GPS coordinates and timestamp.
   */
  async updateLocation(
    driverId: string,
    lat: number,
    lng: number,
  ): Promise<DriverProfile> {
    const profile = await this.findByUserId(driverId);

    profile.currentLatitude = lat;
    profile.currentLongitude = lng;
    profile.lastLocationUpdate = new Date();

    return this.driverProfilesRepository.save(profile);
  }

  /**
   * Find available drivers within radiusKm using Haversine formula in raw SQL.
   * Returns drivers sorted by distance ascending.
   */
  async findNearbyAvailable(
    lat: number,
    lng: number,
    radiusKm = 10,
  ): Promise<NearbyDriver[]> {
    const results = await this.driverProfilesRepository
      .createQueryBuilder('dp')
      .leftJoinAndSelect('dp.user', 'user')
      .where('dp.is_available = true')
      .andWhere('dp.current_latitude IS NOT NULL')
      .andWhere('dp.current_longitude IS NOT NULL')
      .andWhere(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(CAST(dp.current_latitude AS float)))
            * cos(radians(CAST(dp.current_longitude AS float)) - radians(:lng))
            + sin(radians(:lat)) * sin(radians(CAST(dp.current_latitude AS float)))
          )
        ) <= :radiusKm`,
        { lat, lng, radiusKm },
      )
      .addSelect(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(CAST(dp.current_latitude AS float)))
            * cos(radians(CAST(dp.current_longitude AS float)) - radians(:lng))
            + sin(radians(:lat)) * sin(radians(CAST(dp.current_latitude AS float)))
          )
        )`,
        'distance_km',
      )
      .orderBy('distance_km', 'ASC')
      .getRawAndEntities();

    return results.entities.map((profile, index) => {
      const raw = results.raw[index] as Record<string, string> | undefined;
      return { profile, distanceKm: parseFloat(raw?.['distance_km'] ?? '0') };
    });
  }

  /**
   * Assign a driver to a trip.
   * - Updates trip.driver_id
   * - Transitions trip to DRIVER_ASSIGNED
   * - Marks driver as unavailable
   */
  async assignDriverToTrip(
    tripId: string,
    driverId: string,
    assignedBy: string,
  ): Promise<Trip> {
    // Verify driver profile exists and is available
    const profile = await this.findByUserId(driverId);

    if (!profile.isAvailable) {
      throw new BadRequestException(
        `El conductor ${driverId} no está disponible`,
      );
    }

    // Transition trip to DRIVER_ASSIGNED via state machine
    const trip = await this.tripStateMachine.transition(
      tripId,
      TripStatus.DRIVER_ASSIGNED,
      assignedBy,
      { assignedDriverId: driverId },
    );

    // Update the trip's driverId using raw repository
    await this.tripsService.setDriverId(tripId, driverId);

    // Mark driver as unavailable
    profile.isAvailable = false;
    await this.driverProfilesRepository.save(profile);

    this.logger.log(
      `Driver ${driverId} assigned to trip ${tripId} by ${assignedBy}`,
    );

    return trip;
  }

  /**
   * Get full driver profile with user information.
   */
  async getDriverProfile(driverId: string): Promise<DriverProfile> {
    const profile = await this.driverProfilesRepository.findOne({
      where: { userId: driverId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException(
        `Perfil de conductor ${driverId} no encontrado`,
      );
    }

    return profile;
  }

  async findByUserId(userId: string): Promise<DriverProfile> {
    const profile = await this.driverProfilesRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(
        `Perfil de conductor para usuario ${userId} no encontrado`,
      );
    }

    return profile;
  }
}
