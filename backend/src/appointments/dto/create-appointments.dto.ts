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
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentReason } from '@prisma/client';
import { IsValidBookingDate } from '../validators/booking-date.validator';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Prénom du client', example: 'Jean' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Nom du client', example: 'Dupont' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Email du client',
    example: 'jean.dupont@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Numéro de téléphone (optionnel)',
    example: '+33123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Raison du rendez-vous',
    enum: AppointmentReason,
    required: false,
  })
  @IsOptional()
  @IsEnum(AppointmentReason)
  reason?: AppointmentReason;

  @ApiProperty({
    description: 'Autre raison (si reason est OTHER)',
    required: false,
  })
  @IsOptional()
  @IsString()
  reasonOther?: string;

  @ApiProperty({ description: 'Message additionnel', required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({
    description: 'Date et heure souhaitée',
    example: '2024-01-15T14:30:00Z',
  })
  @IsDateString()
  @IsValidBookingDate()
  requestedAt: string;

  @ApiProperty({ description: 'Fuseau horaire', example: 'Europe/Paris' })
  @IsString()
  @IsNotEmpty()
  timezone: string;

  @ApiProperty({
    description: 'Durée souhaitée en minutes (minimum 15)',
    example: 30,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'requestedDurationMin must be an integer number' })
  @Min(15, { message: 'requestedDurationMin must not be less than 15' })
  requestedDurationMin?: number;

  @ApiProperty({
    description: 'Consentement aux conditions générales',
    example: true,
  })
  @IsBoolean()
  consent: boolean;
}
