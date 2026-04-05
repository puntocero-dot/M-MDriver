import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => {
  const url = process.env.REDIS_PRIVATE_URL ?? process.env.REDIS_URL;
  // If url is a Railway template that wasn't resolved, or is empty, we treat it as null
  const resolvedUrl = (url && url.includes('${{')) ? undefined : url;

  return {
    url: resolvedUrl,
    host: process.env.REDISHOST ?? process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDISPORT ?? process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDISPASSWORD ?? process.env.REDIS_PASSWORD,
  };
});
