import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';
import { DrivingEvent } from './entities/driving-event.entity';
import { DriverProfile } from '../drivers/entities/driver-profile.entity';
import { GeospatialModule } from '../geospatial/geospatial.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DrivingEvent, DriverProfile]),
    GeospatialModule,
  ],
  controllers: [TelemetryController],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
