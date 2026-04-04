import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpsertMedicalProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  bloodType?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  medicalConditions?: string;

  @IsOptional()
  @IsString()
  medications?: string;

  @IsOptional()
  @IsString()
  emergencyInstructions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  doctorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  doctorPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  insuranceProvider?: string;
}
