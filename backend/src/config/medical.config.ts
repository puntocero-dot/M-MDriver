import { registerAs } from '@nestjs/config';

export default registerAs('medical', () => ({
  encryptionKey: process.env.MEDICAL_ENCRYPTION_KEY,
}));
