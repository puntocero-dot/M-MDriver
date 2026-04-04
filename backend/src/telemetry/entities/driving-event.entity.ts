import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';
import { User } from '../../users/entities/user.entity';

export enum DrivingEventType {
  HARD_BRAKE = 'HARD_BRAKE',
  HARD_ACCELERATION = 'HARD_ACCELERATION',
  SHARP_TURN = 'SHARP_TURN',
  SPEEDING = 'SPEEDING',
}

@Entity('driving_events')
export class DrivingEvent {
  /** BIGINT auto-increment for high-volume telemetry */
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Index()
  @Column({ name: 'trip_id' })
  tripId: string;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Index()
  @Column({ name: 'driver_id' })
  driverId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: DrivingEventType,
  })
  eventType: DrivingEventType;

  /** Severity score from 1 (mild) to 10 (severe) */
  @Column({ type: 'numeric', precision: 4, scale: 1 })
  severity: number;

  @Column({ type: 'numeric', precision: 10, scale: 7 })
  lat: number;

  @Column({ type: 'numeric', precision: 10, scale: 7 })
  lng: number;

  @Column({ name: 'speed_kmh', type: 'numeric', precision: 6, scale: 2 })
  speedKmh: number;

  @Column({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
