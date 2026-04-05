import { registerAs } from '@nestjs/config';

export default registerAs('plivo', () => ({
  authId: process.env.PLIVO_AUTH_ID,
  authToken: process.env.PLIVO_AUTH_TOKEN,
  phoneNumber: process.env.PLIVO_PHONE_NUMBER,
}));
