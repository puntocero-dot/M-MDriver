import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    host:
      process.env.DB_HOST ??
      process.env.PGHOST ??
      process.env.RAILWAY_TCP_PROXY_HOST ??
      'localhost',
    port: parseInt(
      process.env.DB_PORT ??
        process.env.PGPORT ??
        process.env.RAILWAY_TCP_PROXY_PORT ??
        '5432',
      10,
    ),
    database: process.env.DB_NAME ?? process.env.PGDATABASE ?? 'mmdriver',
    username: process.env.DB_USER ?? process.env.PGUSER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? process.env.PGPASSWORD ?? '',
    ssl:
      process.env.DB_SSL === 'true' ||
      process.env.PGSSL === 'true' ||
      process.env.NODE_ENV === 'production' ||
      !!process.env.RAILWAY_ENVIRONMENT
        ? { rejectUnauthorized: false }
        : false,
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    migrationsRun: false,
  }),
);
