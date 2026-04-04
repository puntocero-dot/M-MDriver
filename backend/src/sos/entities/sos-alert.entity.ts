import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Trip } from '../../trips/entities/trip.entity';

export enum SosAlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
}

@Entity('sos_alerts')
export class SosAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'trip_id' })
  tripId: string;

  @ManyToOne(() => Trip)
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Index()
  @Column({ name: 'triggered_by' })
  triggeredBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'triggered_by' })
  triggeredByUser: User;

  @Column({ name: 'latitude', type: 'numeric', precision: 10, scale: 7 })
  latitude: number;

  @Column({ name: 'longitude', type: 'numeric', precision: 10, scale: 7 })
  longitude: number;

  @Column({
    type: 'enum',
    enum: SosAlertStatus,
    default: SosAlertStatus.ACTIVE,
  })
  status: SosAlertStatus;

  @Column({ name: 'acknowledged_by', type: 'uuid', nullable: true })
  acknowledgedBy: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'acknowledged_by' })
  acknowledgedByUser: User | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
