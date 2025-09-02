import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AppointmentsService } from '../appointments/appointments.service';
import { AppointmentStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('backoffice')
@UseGuards(JwtAuthGuard, AdminGuard)
export class BackofficeController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('appointments')
  async getAppointments(@Query('status') status?: AppointmentStatus) {
    return this.appointmentsService.findAllAdmin(status);
  }

  @Get('appointments/pending')
  async getPendingAppointments() {
    return this.appointmentsService.findAllAdmin('PENDING');
  }

  @Get('appointments/upcoming')
  async getUpcomingAppointments(@Query('days') days?: string) {
    const daysNumber = days ? parseInt(days, 10) : 7;
    return this.appointmentsService.getUpcomingAdmin(daysNumber);
  }

  @Get('appointments/stats')
  async getStats() {
    return this.appointmentsService.getStatsAdmin();
  }

  @Get('appointments/:id')
  async getAppointment(@Param('id') id: string) {
    return this.appointmentsService.findOneAdmin(id);
  }

  @Put('appointments/:id/status')
  async updateAppointmentStatus(
    @Param('id') id: string,
    @Body()
    data: {
      status: AppointmentStatus;
      scheduledAt?: string;
    },
  ) {
    return this.appointmentsService.updateStatusAdmin(id, data);
  }

  @Put('appointments/:id/reschedule')
  async rescheduleAppointment(
    @Param('id') id: string,
    @Body() data: { scheduledAt: string },
  ) {
    return this.appointmentsService.rescheduleAdmin(id, data);
  }

  @Delete('appointments/:id')
  async deleteAppointment(@Param('id') id: string) {
    await this.appointmentsService.deleteAdmin(id);
    return { message: 'Rendez-vous supprimé avec succès' };
  }

  @Post('appointments/:id/reminder')
  async sendReminder(@Param('id') id: string) {
    return this.appointmentsService.sendReminderAdmin(id);
  }

  @Get('profile')
  async getProfile(@Request() req) {
    return {
      id: req.user.sub,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
    };
  }
}
