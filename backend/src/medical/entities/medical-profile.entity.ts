import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Medical Profile entity.
 *
 * Sensitive fields (allergies, medicalConditions, medications, emergencyInstructions)
 * are stored AES-256-GCM encrypted at the application layer using MEDICAL_ENCRYPTION_KEY.
 * The encrypted format is: iv(24 hex) + ':' + authTag(32 hex) + ':' + ciphertext(hex).
 *
 * Non-sensitive fields (bloodType, doctorName, doctorPhone, insuranceProvider)
 * are stored as plain text — still protected by DB access controls.
 *
 * For additional DB-level encryption (pgcrypto), consider wrapping column reads/writes
 * with pgp_sym_encrypt/pgp_sym_decrypt in raw SQL queries.
 */
@Entity('medical_profiles')
export class MedicalProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'blood_type', length: 10, nullable: true })
  bloodType: string | null;

  /** AES-256-GCM encrypted */
  @Column({ type: 'text', nullable: true })
  allergies: string | null;

  /** AES-256-GCM encrypted */
  @Column({ name: 'medical_conditions', type: 'text', nullable: true })
  medicalConditions: string | null;

  /** AES-256-GCM encrypted */
  @Column({ type: 'text', nullable: true })
  medications: string | null;

  /** AES-256-GCM encrypted */
  @Column({ name: 'emergency_instructions', type: 'text', nullable: true })
  emergencyInstructions: string | null;

  @Column({ name: 'doctor_name', length: 200, nullable: true })
  doctorName: string | null;

  @Column({ name: 'doctor_phone', length: 30, nullable: true })
  doctorPhone: string | null;

  @Column({ name: 'insurance_provider', length: 200, nullable: true })
  insuranceProvider: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
