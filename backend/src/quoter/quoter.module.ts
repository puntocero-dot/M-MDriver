import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoterService } from './quoter.service';
import { QuoterController } from './quoter.controller';
import { PricingConfig } from './entities/pricing-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PricingConfig])],
  controllers: [QuoterController],
  providers: [QuoterService],
  exports: [QuoterService],
})
export class QuoterModule {}
