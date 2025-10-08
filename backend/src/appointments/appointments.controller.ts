import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from '../appointments/dto/create-appointments.dto';
import { ConfirmAppointmentDto } from '../appointments/dto/confirm-appointments.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() dto: CreateAppointmentDto, @Req() req: Request) {
    return this.appointmentsService.create(dto);
  }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string, @Body() dto: ConfirmAppointmentDto) {
    return this.appointmentsService.confirm(id, dto);
  }

  @Get(':id/confirm')
  confirmByToken(@Param('id') id: string, @Query('token') token: string) {
    return this.appointmentsService.confirmByToken(id, token);
  }

  @Get(':id/cancel')
  cancel(@Param('id') id: string, @Query('token') token: string) {
    return this.appointmentsService.cancel(id, token);
  }

  @Get(':id/can-cancel')
  canCancel(@Param('id') id: string, @Query('token') token: string) {
    return this.appointmentsService.canCancelCheck(id, token);
  }

  @Get(':id/accept-reschedule')
  acceptReschedule(@Param('id') id: string, @Query('token') token: string) {
    return this.appointmentsService.acceptReschedule(id, token);
  }

  @Get(':id/reject-reschedule')
  rejectReschedule(@Param('id') id: string, @Query('token') token: string) {
    return this.appointmentsService.rejectReschedule(id, token);
  }
}
