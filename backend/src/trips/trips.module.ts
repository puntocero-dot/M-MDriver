import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { TripStateMachineService } from './trip-state-machine.service';
import { Trip } from './entities/trip.entity';
import { TripStop } from './entities/trip-stop.entity';
import { TripStateTransition } from './entities/trip-state-transition.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, TripStop, TripStateTransition])],
  controllers: [TripsController],
  providers: [TripsService, TripStateMachineService],
  exports: [TripsService, TripStateMachineService],
})
export class TripsModule {}
