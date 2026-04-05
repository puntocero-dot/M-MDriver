import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { Trip } from '../trips/entities/trip.entity';
import { DriverProfile } from '../drivers/entities/driver-profile.entity';
import { SosAlert } from '../sos/entities/sos-alert.entity';
import { User } from '../users/entities/user.entity';
import { PricingConfig } from '../quoter/entities/pricing-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trip,
      DriverProfile,
      SosAlert,
      User,
      PricingConfig,
    ]),
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
