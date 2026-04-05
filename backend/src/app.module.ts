import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TripsModule } from './trips/trips.module';
import { QuoterModule } from './quoter/quoter.module';
import { GeospatialModule } from './geospatial/geospatial.module';
import { PaymentsModule } from './payments/payments.module';
import { SosModule } from './sos/sos.module';
import { DriversModule } from './drivers/drivers.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MedicalModule } from './medical/medical.module';
import { VoipModule } from './voip/voip.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { AdminModule } from './admin/admin.module';
import { HealthController } from './health/health.controller';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import n1coConfig from './config/n1co.config';
import firebaseConfig from './config/firebase.config';
import plivoConfig from './config/plivo.config';
import redisConfig from './config/redis.config';
import medicalConfig from './config/medical.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        jwtConfig,
        n1coConfig,
        firebaseConfig,
        plivoConfig,
        redisConfig,
        medicalConfig,
      ],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database') as object,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    UsersModule,
    TripsModule,
    QuoterModule,
    GeospatialModule,
    PaymentsModule,
    SosModule,
    DriversModule,
    NotificationsModule,
    MedicalModule,
    VoipModule,
    TelemetryModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
