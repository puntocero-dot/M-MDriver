import { IsUUID } from 'class-validator';

export class InitiateCallDto {
  @IsUUID()
  tripId: string;
}
