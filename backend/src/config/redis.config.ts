import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  url: process.env.REDIS_URL,
  host: process.env.REDIS_HOST ?? process.env.REDISHOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? process.env.REDISPORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD ?? process.env.REDISPASSWORD,
}));
