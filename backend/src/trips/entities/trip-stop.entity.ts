import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Trip } from './trip.entity';

@Entity('trip_stops')
export class TripStop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trip_id' })
  tripId: string;

  @ManyToOne(() => Trip, (trip) => trip.stops, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ name: 'stop_order' })
  stopOrder: number;

  @Column()
  address: string;

  @Column({ name: 'arrived_at', type: 'timestamp with time zone', nullable: true })
  arrivedAt: Date | null;

  @Column({ name: 'departed_at', type: 'timestamp with time zone', nullable: true })
  departedAt: Date | null;

  @Column({ name: 'wait_time_seconds', default: 0 })
  waitTimeSeconds: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
