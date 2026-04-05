import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface GpsTraceEntry {
  tripId: string;
  driverId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: number;
}

@Injectable()
export class GeospatialService implements OnModuleDestroy {
  private readonly logger = new Logger(GeospatialService.name);
  private readonly redis: Redis;

  private static readonly DRIVER_LOCATIONS_KEY = 'driver_locations';
  private static readonly GPS_TRACE_KEY_PREFIX = 'gps_trace:trip:';
  private static readonly GPS_TRACE_MAX_ENTRIES = 500;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('redis.host') ?? 'localhost',
      port: this.configService.get<number>('redis.port') ?? 6379,
      password: this.configService.get<string>('redis.password'),
    });

    this.redis.on('error', (err) => {
      this.logger.error('Redis connection error', err.message);
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected');
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  /**
   * Store driver's latest GPS position using Redis GEOADD.
   * Key: 'driver_locations', member: driverId
   */
  async storeDriverLocation(
    driverId: string,
    lng: number,
    lat: number,
  ): Promise<void> {
    try {
      await this.redis.geoadd(
        GeospatialService.DRIVER_LOCATIONS_KEY,
        lng,
        lat,
        driverId,
      );
    } catch (err) {
      this.logger.error(`Error storing location for driver ${driverId}`, err);
    }
  }

  /**
   * Get driver's current position using Redis GEOPOS.
   * Returns [lng, lat] or null if not found.
   */
  async getDriverLocation(
    driverId: string,
  ): Promise<{ lat: number; lng: number } | null> {
    try {
      const positions = await this.redis.geopos(
        GeospatialService.DRIVER_LOCATIONS_KEY,
        driverId,
      );

      if (!positions || !positions[0] || !positions[0][0] || !positions[0][1]) {
        return null;
      }

      return {
        lng: parseFloat(positions[0][0]),
        lat: parseFloat(positions[0][1]),
      };
    } catch (err) {
      this.logger.error(`Error fetching location for driver ${driverId}`, err);
      return null;
    }
  }

  /**
   * Find nearby available drivers using Redis GEORADIUS.
   * Returns array of { driverId, distanceKm }.
   */
  async getNearbyDrivers(
    lat: number,
    lng: number,
    radiusKm: number,
  ): Promise<Array<{ driverId: string; distanceKm: number }>> {
    try {
      // GEORADIUSBYMEMBER is deprecated — use GEOSEARCH (Redis 6.2+) or GEORADIUS
      const results = await this.redis.georadius(
        GeospatialService.DRIVER_LOCATIONS_KEY,
        lng,
        lat,
        radiusKm,
        'km',
        'WITHCOORD',
        'WITHDIST',
        'ASC',
      );

      return (results as [string, string, [string, string]][]).map((entry) => ({
        driverId: entry[0],
        distanceKm: parseFloat(entry[1]),
      }));
    } catch (err) {
      this.logger.error('Error fetching nearby drivers', err);
      return [];
    }
  }

  /**
   * Append a GPS trace entry to the trip's trace buffer in Redis.
   * Keeps the last GPS_TRACE_MAX_ENTRIES entries (LPUSH + LTRIM).
   * These will be flushed to the DB by a background job.
   */
  async saveGpsTrace(data: GpsTraceEntry): Promise<void> {
    try {
      const key = `${GeospatialService.GPS_TRACE_KEY_PREFIX}${data.tripId}`;
      const entry = JSON.stringify({ ...data, timestamp: Date.now() });

      await this.redis.lpush(key, entry);
      await this.redis.ltrim(
        key,
        0,
        GeospatialService.GPS_TRACE_MAX_ENTRIES - 1,
      );
    } catch (err) {
      this.logger.error(`Error saving GPS trace for trip ${data.tripId}`, err);
    }
  }

  /**
   * Remove driver from the Redis geo set (called on disconnect).
   */
  async removeDriverLocation(driverId: string): Promise<void> {
    try {
      await this.redis.zrem(GeospatialService.DRIVER_LOCATIONS_KEY, driverId);
    } catch (err) {
      this.logger.error(
        `Error removing driver ${driverId} from location set`,
        err,
      );
    }
  }
}
