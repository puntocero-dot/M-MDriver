import { IsUUID, IsNumber, IsString, IsPositive, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'UUID del viaje asociado' })
  @IsUUID()
  tripId: string;

  @ApiProperty({ description: 'UUID del cliente' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ description: 'Monto a cobrar', minimum: 0.01 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: 'Método de pago (ej: N1CO_CARD)' })
  @IsString()
  method: string;

  @ApiPropertyOptional({ description: 'Moneda ISO 4217', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;
}
