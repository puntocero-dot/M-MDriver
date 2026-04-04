import { IsUUID, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TriggerSosDto {
  @ApiProperty({ description: 'UUID del viaje activo' })
  @IsUUID()
  tripId: string;

  @ApiProperty({ description: 'Latitud de la alerta (-90 a 90)', minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ description: 'Longitud de la alerta (-180 a 180)', minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}
