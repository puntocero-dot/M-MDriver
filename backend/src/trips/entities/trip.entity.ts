import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { TripStatus } from '../../common/enums/trip-status.enum';
import { User } from '../../users/entities/user.entity';
import { TripStop } from './trip-stop.entity';

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'client_id' })
  clientId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Index()
  @Column({ name: 'driver_id', type: 'uuid', nullable: true })
  driverId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver: User | null;

  @Column({ name: 'vehicle_id', type: 'uuid', nullable: true })
  vehicleId: string | null;

  @Index()
  @Column({ type: 'enum', enum: TripStatus, default: TripStatus.QUOTED })
  status: TripStatus;

  @Column({ name: 'pickup_address' })
  pickupAddress: string;

  @Column({ name: 'dropoff_address' })
  dropoffAddress: string;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt: Date;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @Column({ name: 'quoted_price', type: 'numeric', precision: 10, scale: 2 })
  quotedPrice: number;

  @Column({
    name: 'final_price',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  finalPrice: number | null;

  @Column({ default: 'USD', length: 3 })
  currency: string;

  @Column({ name: 'distance_meters', type: 'int', nullable: true })
  distanceMeters: number | null;

  @Column({ name: 'duration_seconds', type: 'int', nullable: true })
  durationSeconds: number | null;

  @Column({ name: 'wait_time_seconds', default: 0 })
  waitTimeSeconds: number;

  @Column({ name: 'payment_hold_id', type: 'text', nullable: true })
  paymentHoldId: string | null;

  @Column({ name: 'payment_capture_id', type: 'text', nullable: true })
  paymentCaptureId: string | null;

  @Column({ name: 'is_shared_live', default: false })
  isSharedLive: boolean;

  @Column({ name: 'share_token', type: 'text', unique: true, nullable: true })
  shareToken: string | null;

  @OneToMany(() => TripStop, (stop) => stop.trip, { cascade: true })
  stops: TripStop[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
