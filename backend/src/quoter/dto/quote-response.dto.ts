import { ApiProperty } from '@nestjs/swagger';

export class QuoteBreakdownDto {
  @ApiProperty({ description: 'Tarifa base en USD' })
  base: number;

  @ApiProperty({ description: 'Costo por distancia' })
  distance: number;

  @ApiProperty({ description: 'Costo por tiempo estimado' })
  time: number;

  @ApiProperty({ description: 'Recargo por paradas adicionales' })
  stops: number;

  @ApiProperty({ description: 'Factor de combustible aplicado' })
  fuel: number;

  @ApiProperty({
    description:
      'Recargo por vehículo de empresa (0 si es vehiculo del cliente)',
  })
  vehicleSurcharge: number;
}

export class QuoteResponseDto {
  @ApiProperty({ description: 'Precio estimado total en USD' })
  estimatedPrice: number;

  @ApiProperty({ description: 'Distancia estimada en metros' })
  estimatedDistanceMeters: number;

  @ApiProperty({ description: 'Duración estimada en segundos' })
  estimatedDurationSeconds: number;

  @ApiProperty({ type: QuoteBreakdownDto })
  breakdown: QuoteBreakdownDto;

  @ApiProperty({ description: 'Cotización válida hasta (15 min)' })
  expiresAt: string;

  @ApiProperty({ description: 'Moneda' })
  currency: string;
}
