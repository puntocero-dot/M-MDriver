import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  url: process.env.REDIS_PRIVATE_URL ?? process.env.REDIS_URL,
  host: process.env.REDISHOST ?? process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDISPORT ?? process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDISPASSWORD ?? process.env.REDIS_PASSWORD,
}));
