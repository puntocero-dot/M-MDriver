import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAvailabilityDto {
  @ApiProperty({ description: 'true = disponible, false = no disponible' })
  @IsBoolean()
  isAvailable: boolean;
}
