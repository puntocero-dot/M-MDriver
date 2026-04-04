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

export enum VoipCallStatus {
  INITIATED = 'INITIATED',
  CONNECTED = 'CONNECTED',
  ENDED = 'ENDED',
  FAILED = 'FAILED',
}

@Entity('voip_calls')
export class VoipCall {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'trip_id' })
  tripId: string;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ name: 'caller_user_id' })
  callerUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'caller_user_id' })
  caller: User;

  @Column({ name: 'receiver_user_id' })
  receiverUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiver_user_id' })
  receiver: User;

  @Column({ name: 'plivo_call_uuid', length: 100, nullable: true })
  plivoCallUuid: string | null;

  @Column({
    type: 'enum',
    enum: VoipCallStatus,
    default: VoipCallStatus.INITIATED,
  })
  status: VoipCallStatus;

  @Column({ name: 'duration_seconds', type: 'int', nullable: true })
  durationSeconds: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'ended_at', nullable: true })
  endedAt: Date | null;
}
