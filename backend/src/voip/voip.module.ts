import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoipController } from './voip.controller';
import { VoipService } from './voip.service';
import { VoipCall } from './entities/voip-call.entity';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VoipCall, Trip, User])],
  controllers: [VoipController],
  providers: [VoipService],
  exports: [VoipService],
})
export class VoipModule {}
