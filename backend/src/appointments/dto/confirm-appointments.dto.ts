import { IsDateString } from 'class-validator';

export class ConfirmAppointmentDto {
  @IsDateString() scheduledAt: string;
}
