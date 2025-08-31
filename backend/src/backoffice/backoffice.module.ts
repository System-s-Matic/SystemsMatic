import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BackofficeController } from './backoffice.controller';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [HttpModule, AppointmentsModule],
  controllers: [BackofficeController],
})
export class BackofficeModule {}
