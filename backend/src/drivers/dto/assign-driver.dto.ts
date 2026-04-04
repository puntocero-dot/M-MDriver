import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignDriverDto {
  @ApiProperty({ description: 'UUID del conductor a asignar' })
  @IsUUID()
  driverId: string;
}
