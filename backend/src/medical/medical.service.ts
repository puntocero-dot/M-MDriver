import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { MedicalProfile } from './entities/medical-profile.entity';
import { UpsertMedicalProfileDto } from './dto/upsert-medical-profile.dto';

// Fields that require AES-256-GCM encryption at application layer
const ENCRYPTED_FIELDS = [
  'allergies',
  'medicalConditions',
  'medications',
  'emergencyInstructions',
] as const;

type EncryptedField = (typeof ENCRYPTED_FIELDS)[number];

@Injectable()
export class MedicalService {
  private readonly logger = new Logger(MedicalService.name);
  private readonly encryptionKey: Buffer;

  constructor(
    @InjectRepository(MedicalProfile)
    private readonly profileRepository: Repository<MedicalProfile>,
    private readonly configService: ConfigService,
  ) {
    const rawKey = this.configService.get<string>('MEDICAL_ENCRYPTION_KEY');
    if (!rawKey) {
      this.logger.warn(
        'MEDICAL_ENCRYPTION_KEY not set — sensitive medical data will NOT be encrypted',
      );
      // Fallback zero key for development (32 bytes for AES-256)
      this.encryptionKey = Buffer.alloc(32, 0);
    } else {
      // Derive a 32-byte key from whatever the env var contains
      this.encryptionKey = crypto.createHash('sha256').update(rawKey).digest();
    }
  }

  // ─── Encryption Helpers (AES-256-GCM) ──────────────────────────────────────
  // Stored format: iv(24 hex chars) + ':' + authTag(32 hex chars) + ':' + ciphertext(hex)

  private encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12); // 12 bytes = 96 bits for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag(); // 16 bytes
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new InternalServerErrorException('Invalid encrypted field format');
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      iv,
    );
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  }

  private encryptProfile(
    dto: Partial<UpsertMedicalProfileDto>,
  ): Partial<MedicalProfile> {
    const result: Partial<MedicalProfile> = {
      ...dto,
    } as Partial<MedicalProfile>;
    for (const field of ENCRYPTED_FIELDS as readonly EncryptedField[]) {
      const value = (dto as Record<string, string | undefined>)[field];
      if (value !== undefined && value !== null) {
        (result as Record<string, string>)[field] = this.encrypt(value);
      }
    }
    return result;
  }

  private decryptProfile(
    profile: MedicalProfile,
  ): MedicalProfile & Record<string, unknown> {
    const decrypted = { ...profile } as MedicalProfile &
      Record<string, unknown>;
    for (const field of ENCRYPTED_FIELDS) {
      const value = (profile as unknown as Record<string, string | null>)[
        field
      ];
      if (value) {
        try {
          (decrypted as Record<string, unknown>)[field] = this.decrypt(value);
        } catch {
          this.logger.error(
            `Failed to decrypt field '${field}' for profile ${profile.id}`,
          );
          (decrypted as Record<string, unknown>)[field] = null;
        }
      }
    }
    return decrypted;
  }

  // ─── CRUD Operations ──────────────────────────────────────────────────────

  async upsert(
    userId: string,
    dto: UpsertMedicalProfileDto,
  ): Promise<MedicalProfile> {
    const encryptedData = this.encryptProfile(dto);

    let profile = await this.profileRepository.findOne({ where: { userId } });

    if (profile) {
      // Update existing
      Object.assign(profile, encryptedData);
      const saved = await this.profileRepository.save(profile);
      return this.decryptProfile(saved) as MedicalProfile;
    }

    // Create new
    profile = this.profileRepository.create({ userId, ...encryptedData });
    const saved = await this.profileRepository.save(profile);
    return this.decryptProfile(saved) as MedicalProfile;
  }

  async findByUserId(userId: string): Promise<MedicalProfile> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException(
        `Perfil médico no encontrado para el usuario ${userId}`,
      );
    }
    return this.decryptProfile(profile) as MedicalProfile;
  }

  /**
   * findForSOS — returns decrypted profile for supervisor use in SOS context.
   * Returns null (not throws) if the client hasn't set up a medical profile.
   */
  async findForSOS(
    userId: string,
  ): Promise<(MedicalProfile & Record<string, unknown>) | null> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) return null;
    return this.decryptProfile(profile);
  }

  /**
   * delete — GDPR right to erasure.
   */
  async delete(userId: string): Promise<void> {
    const result = await this.profileRepository.delete({ userId });
    if (result.affected === 0) {
      throw new NotFoundException(
        `Perfil médico no encontrado para el usuario ${userId}`,
      );
    }
    this.logger.log(
      `Medical profile deleted (GDPR erasure) for user ${userId}`,
    );
  }
}
