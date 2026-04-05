import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriversController, TripAssignController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { DriverProfile } from './entities/driver-profile.entity';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [TypeOrmModule.forFeature([DriverProfile]), TripsModule],
  controllers: [DriversController, TripAssignController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}
