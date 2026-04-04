import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Like, ILike } from 'typeorm';
import { Trip } from '../trips/entities/trip.entity';
import { DriverProfile } from '../drivers/entities/driver-profile.entity';
import { SosAlert, SosAlertStatus } from '../sos/entities/sos-alert.entity';
import { User } from '../users/entities/user.entity';
import { PricingConfig } from '../quoter/entities/pricing-config.entity';
import { TripStatus } from '../common/enums/trip-status.enum';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
    @InjectRepository(DriverProfile)
    private readonly driverProfilesRepository: Repository<DriverProfile>,
    @InjectRepository(SosAlert)
    private readonly sosAlertsRepository: Repository<SosAlert>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(PricingConfig)
    private readonly pricingConfigRepository: Repository<PricingConfig>,
  ) {}

  // ─── DASHBOARD ───────────────────────────────────────────────────────────────

  async getStats() {
    const activeTrips = await this.tripsRepository.count({
      where: {
        status: In([
          TripStatus.DRIVER_ASSIGNED,
          TripStatus.EN_ROUTE_TO_PICKUP,
          TripStatus.AT_PICKUP,
          TripStatus.IN_TRANSIT,
        ]),
      },
    });

    const availableDrivers = await this.driverProfilesRepository.count({
      where: { isAvailable: true },
    });

    const sosAlerts = await this.sosAlertsRepository.count({
      where: { status: SosAlertStatus.ACTIVE },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const completedToday = await this.tripsRepository.find({
      where: {
        status: TripStatus.COMPLETED,
        updatedAt: Between(today, tomorrow),
      },
    });

    const revenue = completedToday.reduce((sum, trip) => sum + (trip.quotedPrice || 0), 0);

    return {
      activeTrips,
      availableDrivers,
      sosAlerts,
      dailyRevenue: `$${revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    };
  }

  async getRecentActivity() {
    const recentTrips = await this.tripsRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return recentTrips.map((trip) => {
      let action = 'Evento desconocido';
      let color = 'text-slate-400';

      switch (trip.status) {
        case TripStatus.COMPLETED:
          action = 'Viaje completado';
          color = 'text-green-400';
          break;
        case TripStatus.SOS_ACTIVE:
          action = 'SOS activado';
          color = 'text-red-400';
          break;
        case TripStatus.DRIVER_ASSIGNED:
          action = 'Chofer asignado';
          color = 'text-blue-400';
          break;
        case TripStatus.QUOTED:
          action = 'Nuevo viaje cotizado';
          color = 'text-amber-400';
          break;
        case TripStatus.CANCELLED:
          action = 'Viaje cancelado';
          color = 'text-slate-400';
          break;
        default:
          action = `Estado: ${trip.status}`;
      }

      return {
        id: trip.id.substring(0, 8).toUpperCase(),
        action,
        time: this.formatRelativeTime(trip.createdAt),
        color,
      };
    });
  }

  // ─── TRIPS ────────────────────────────────────────────────────────────────────

  async getTrips(
    page = 1,
    limit = 10,
    status?: TripStatus,
    search?: string,
  ) {
    const where: any[] = [];

    if (search) {
      const likeSearch = ILike(`%${search}%`);
      if (status) {
        where.push({ status, pickupAddress: likeSearch });
        where.push({ status, dropoffAddress: likeSearch });
      } else {
        where.push({ pickupAddress: likeSearch });
        where.push({ dropoffAddress: likeSearch });
      }
    } else if (status) {
      where.push({ status });
    }

    const [trips, total] = await this.tripsRepository.findAndCount({
      where: where.length > 0 ? where : undefined,
      relations: ['client', 'driver'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: trips.map((trip) => ({
        id: trip.id,
        shortId: trip.id.substring(0, 8).toUpperCase(),
        status: trip.status,
        pickupAddress: trip.pickupAddress,
        dropoffAddress: trip.dropoffAddress,
        quotedPrice: trip.quotedPrice,
        finalPrice: trip.finalPrice,
        scheduledAt: trip.scheduledAt,
        createdAt: trip.createdAt,
        client: trip.client
          ? {
              id: trip.client.id,
              name: `${trip.client.firstName} ${trip.client.lastName}`,
              phone: trip.client.phone,
            }
          : null,
        driver: trip.driver
          ? {
              id: trip.driver.id,
              name: `${trip.driver.firstName} ${trip.driver.lastName}`,
              phone: trip.driver.phone,
            }
          : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── DRIVERS ──────────────────────────────────────────────────────────────────

  async getDrivers(page = 1, limit = 10, available?: boolean, search?: string) {
    const qb = this.driverProfilesRepository
      .createQueryBuilder('dp')
      .leftJoinAndSelect('dp.user', 'user')
      .orderBy('dp.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (available !== undefined) {
      qb.andWhere('dp.isAvailable = :available', { available });
    }

    if (search) {
      qb.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR dp.licenseNumber ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [drivers, total] = await qb.getManyAndCount();

    return {
      data: drivers.map((dp) => ({
        id: dp.id,
        userId: dp.userId,
        isAvailable: dp.isAvailable,
        licenseNumber: dp.licenseNumber,
        licenseExpiry: dp.licenseExpiry,
        ratingAvg: dp.ratingAvg,
        totalTrips: dp.totalTrips,
        currentLatitude: dp.currentLatitude,
        currentLongitude: dp.currentLongitude,
        lastLocationUpdate: dp.lastLocationUpdate,
        createdAt: dp.createdAt,
        user: dp.user
          ? {
              id: dp.user.id,
              name: `${dp.user.firstName} ${dp.user.lastName}`,
              email: dp.user.email,
              phone: dp.user.phone,
              isActive: dp.user.isActive,
            }
          : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── CLIENTS ──────────────────────────────────────────────────────────────────

  async getClients(page = 1, limit = 10, search?: string) {
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: Role.CLIENT })
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [users, total] = await qb.getManyAndCount();

    // Count trips per client
    const clientIds = users.map((u) => u.id);
    const tripCounts =
      clientIds.length > 0
        ? await this.tripsRepository
            .createQueryBuilder('trip')
            .select('trip.clientId', 'clientId')
            .addSelect('COUNT(trip.id)', 'count')
            .where('trip.clientId IN (:...clientIds)', { clientIds })
            .groupBy('trip.clientId')
            .getRawMany()
        : [];

    const tripCountMap: Record<string, number> = {};
    for (const row of tripCounts) {
      tripCountMap[row.clientId] = parseInt(row.count, 10);
    }

    return {
      data: users.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        totalTrips: tripCountMap[user.id] ?? 0,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── PRICING CONFIG ───────────────────────────────────────────────────────────

  async getPricingConfig() {
    const configs = await this.pricingConfigRepository.find({
      order: { createdAt: 'DESC' },
    });
    return configs;
  }

  async updatePricingConfig(id: string, data: Partial<PricingConfig>) {
    await this.pricingConfigRepository.update(id, data);
    return this.pricingConfigRepository.findOne({ where: { id } });
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────────

  private formatRelativeTime(date: Date): string {
    const diffMs = new Date().getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'hace un momento';
    if (diffMins < 60) return `hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `hace ${diffHours} h`;
    return date.toLocaleDateString();
  }
}
