import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsNotEmpty,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { AppointmentReason } from '@prisma/client';
import { IsValidBookingDate } from '../validators/booking-date.validator';

export class CreateAppointmentDto {
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;

  @IsOptional() @IsEnum(AppointmentReason) reason?: AppointmentReason;
  @IsOptional() @IsString() reasonOther?: string;
  @IsOptional() @IsString() message?: string;

  @IsDateString()
  @IsValidBookingDate()
  requestedAt: string;
  @IsOptional()
  @IsInt({ message: 'requestedDurationMin must be an integer number' })
  @Min(15, { message: 'requestedDurationMin must not be less than 15' })
  requestedDurationMin?: number;

  @IsBoolean() consent: boolean;
}
