import {
  IsEnum,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  Min,
  IsISO8601,
  IsArray,
  ValidateNested,
  ArrayNotEmpty,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DrivingEventType } from '../entities/driving-event.entity';

export class DrivingEventDto {
  @IsUUID()
  tripId: string;

  @IsEnum(DrivingEventType)
  eventType: DrivingEventType;

  @IsNumber()
  @Min(1)
  @Max(10)
  severity: number;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsNumber()
  @Min(0)
  speedKmh: number;

  @IsISO8601()
  recordedAt: string;
}

export class BatchDrivingEventsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => DrivingEventDto)
  events: DrivingEventDto[];
}
