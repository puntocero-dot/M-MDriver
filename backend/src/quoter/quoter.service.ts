import {
  Injectable,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, IsNull, Or } from 'typeorm';
import { PricingConfig } from './entities/pricing-config.entity';
import { QuoteRequestDto, VehicleType } from './dto/quote-request.dto';
import { QuoteResponseDto } from './dto/quote-response.dto';

const QUOTE_VALIDITY_MINUTES = 15;
const METERS_PER_KM = 1000;
const SECONDS_PER_MINUTE = 60;

@Injectable()
export class QuoterService {
  private readonly logger = new Logger(QuoterService.name);

  constructor(
    @InjectRepository(PricingConfig)
    private readonly pricingConfigRepository: Repository<PricingConfig>,
  ) {}

  async calculateQuote(dto: QuoteRequestDto): Promise<QuoteResponseDto> {
    const config = await this.getActivePricingConfig();

    // Estimate distance and duration using a simplified linear model.
    // In production, replace with Google Maps Directions API call.
    const distanceMeters = this.estimateDistance(
      dto.pickupLat,
      dto.pickupLng,
      dto.dropoffLat,
      dto.dropoffLng,
    );
    const estimatedMinutes = this.estimateDuration(distanceMeters);

    const distanceKm = distanceMeters / METERS_PER_KM;
    const stopsCount = dto.stops?.length ?? 0;
    const isCompanyVehicle = dto.vehicleType === VehicleType.COMPANY;

    const baseCost = Number(config.baseFare);
    const distanceCost = distanceKm * Number(config.perKmRate);
    const timeCost = estimatedMinutes * Number(config.perMinuteRate);
    const stopsCost = stopsCount * Number(config.perStopSurcharge);
    const vehicleSurcharge = isCompanyVehicle
      ? Number(config.companyVehicleSurcharge)
      : 0;

    const subtotal =
      baseCost + distanceCost + timeCost + stopsCost + vehicleSurcharge;
    const fuelAdjusted = subtotal * Number(config.fuelFactor);
    const finalPrice = Math.max(fuelAdjusted, Number(config.minimumFare));
    const fuelCost = fuelAdjusted - subtotal;

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + QUOTE_VALIDITY_MINUTES);

    return {
      estimatedPrice: Math.round(finalPrice * 100) / 100,
      estimatedDistanceMeters: Math.round(distanceMeters),
      estimatedDurationSeconds: Math.round(
        estimatedMinutes * SECONDS_PER_MINUTE,
      ),
      breakdown: {
        base: Math.round(baseCost * 100) / 100,
        distance: Math.round(distanceCost * 100) / 100,
        time: Math.round(timeCost * 100) / 100,
        stops: Math.round(stopsCost * 100) / 100,
        fuel: Math.round(fuelCost * 100) / 100,
        vehicleSurcharge: Math.round(vehicleSurcharge * 100) / 100,
      },
      expiresAt: expiresAt.toISOString(),
      currency: 'USD',
    };
  }

  private async getActivePricingConfig(): Promise<PricingConfig> {
    const now = new Date();
    const config = await this.pricingConfigRepository.findOne({
      where: {
        isActive: true,
        effectiveFrom: Or(IsNull(), LessThanOrEqual(now)),
      },
      order: { effectiveFrom: 'DESC' },
    });

    if (!config) {
      this.logger.error('No hay configuracion de precios activa');
      throw new ServiceUnavailableException(
        'El servicio de cotización no está disponible. Contacte al administrador.',
      );
    }

    return config;
  }

  /**
   * Haversine formula para distancia entre dos puntos geograficos.
   */
  private estimateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // metros
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const dPhi = ((lat2 - lat1) * Math.PI) / 180;
    const dLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dPhi / 2) ** 2 +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Estimacion simple de duracion (promedio 30 km/h en ciudad).
   * Reemplazar con Google Maps Directions API para precision real.
   */
  private estimateDuration(distanceMeters: number): number {
    const avgSpeedKmh = 30;
    return (distanceMeters / METERS_PER_KM / avgSpeedKmh) * 60;
  }
}
