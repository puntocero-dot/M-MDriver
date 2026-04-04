import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('pricing_config')
export class PricingConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'base_fare', type: 'numeric', precision: 10, scale: 2 })
  baseFare: number;

  @Column({ name: 'per_km_rate', type: 'numeric', precision: 10, scale: 2 })
  perKmRate: number;

  @Column({ name: 'per_minute_rate', type: 'numeric', precision: 10, scale: 2 })
  perMinuteRate: number;

  @Column({ name: 'per_stop_surcharge', type: 'numeric', precision: 10, scale: 2 })
  perStopSurcharge: number;

  @Column({ name: 'wait_time_per_minute', type: 'numeric', precision: 10, scale: 2 })
  waitTimePerMinute: number;

  @Column({ name: 'minimum_fare', type: 'numeric', precision: 10, scale: 2 })
  minimumFare: number;

  @Column({ name: 'fuel_factor', type: 'numeric', precision: 5, scale: 3 })
  fuelFactor: number;

  @Column({ name: 'company_vehicle_surcharge', type: 'numeric', precision: 10, scale: 2, default: 0 })
  companyVehicleSurcharge: number;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  @Column({ name: 'effective_from', type: 'timestamp with time zone', nullable: true })
  effectiveFrom: Date | null;

  @Column({ name: 'effective_until', type: 'timestamp with time zone', nullable: true })
  effectiveUntil: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
