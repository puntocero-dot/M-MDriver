import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SosController } from './sos.controller';
import { SosService } from './sos.service';
import { SosAlert } from './entities/sos-alert.entity';
import { TripsModule } from '../trips/trips.module';
import { GeospatialModule } from '../geospatial/geospatial.module';
import { MedicalModule } from '../medical/medical.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SosAlert]),
    TripsModule,
    GeospatialModule,
    MedicalModule,
  ],
  controllers: [SosController],
  providers: [SosService],
  exports: [SosService],
})
export class SosModule {}
