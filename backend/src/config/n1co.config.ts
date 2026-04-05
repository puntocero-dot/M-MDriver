import { registerAs } from '@nestjs/config';

export default registerAs('n1co', () => ({
  apiUrl: process.env.N1CO_API_URL ?? 'https://api.n1co.com',
  apiKey: process.env.N1CO_API_KEY ?? '',
  merchantId: process.env.N1CO_MERCHANT_ID ?? '',
}));
