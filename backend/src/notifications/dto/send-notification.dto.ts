import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { DeviceType } from '../entities/fcm-token.entity';

export class RegisterFcmTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsEnum(DeviceType)
  deviceType: DeviceType;
}
