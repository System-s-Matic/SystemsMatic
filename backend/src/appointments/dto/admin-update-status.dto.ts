import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class AdminUpdateStatusDto {
  @IsEnum(AppointmentStatus) status: AppointmentStatus;
  @IsOptional() @IsISO8601() scheduledAt?: string;
  @IsOptional() @IsString() location?: string;
}
