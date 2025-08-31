import { IsISO8601, IsOptional, IsString } from 'class-validator';
export class AdminRescheduleDto {
  @IsISO8601() scheduledAt: string;
  @IsOptional() @IsString() location?: string;
}
