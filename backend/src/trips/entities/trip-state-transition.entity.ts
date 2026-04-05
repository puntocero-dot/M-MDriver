import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TripStatus } from '../../common/enums/trip-status.enum';
import { Trip } from './trip.entity';

@Entity('trip_state_transitions')
export class TripStateTransition {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'trip_id' })
  tripId: string;

  @ManyToOne(() => Trip, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({
    name: 'from_status',
    type: 'enum',
    enum: TripStatus,
    nullable: true,
  })
  fromStatus: TripStatus | null;

  @Column({ name: 'to_status', type: 'enum', enum: TripStatus })
  toStatus: TripStatus;

  @Column({ name: 'triggered_by' })
  triggeredBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
