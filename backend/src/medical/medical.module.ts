import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalController } from './medical.controller';
import { MedicalService } from './medical.service';
import { MedicalProfile } from './entities/medical-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalProfile])],
  controllers: [MedicalController],
  providers: [MedicalService],
  exports: [MedicalService],
})
export class MedicalModule {}
