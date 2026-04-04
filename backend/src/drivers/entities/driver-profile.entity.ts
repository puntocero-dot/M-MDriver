import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('driver_profiles')
export class DriverProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'license_number', length: 50 })
  licenseNumber: string;

  @Column({ name: 'license_expiry', type: 'date' })
  licenseExpiry: Date;

  @Index()
  @Column({ name: 'is_available', default: false })
  isAvailable: boolean;

  @Column({
    name: 'rating_avg',
    type: 'numeric',
    precision: 3,
    scale: 2,
    default: 0,
  })
  ratingAvg: number;

  @Column({ name: 'total_trips', default: 0 })
  totalTrips: number;

  @Column({
    name: 'current_latitude',
    type: 'numeric',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  currentLatitude: number | null;

  @Column({
    name: 'current_longitude',
    type: 'numeric',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  currentLongitude: number | null;

  @Column({ name: 'last_location_update', nullable: true })
  lastLocationUpdate: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
