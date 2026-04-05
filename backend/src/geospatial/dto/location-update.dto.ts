import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationUpdateDto {
  @ApiProperty({ description: 'ID del viaje activo' })
  @IsString()
  tripId: string;

  @ApiProperty({ description: 'Latitud (-90 a 90)', minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    description: 'Longitud (-180 a 180)',
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiPropertyOptional({ description: 'Velocidad en km/h' })
  @IsOptional()
  @IsNumber()
  speed?: number;

  @ApiPropertyOptional({ description: 'Rumbo en grados (0-360)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiPropertyOptional({ description: 'Precisión del GPS en metros' })
  @IsOptional()
  @IsNumber()
  accuracy?: number;
}
