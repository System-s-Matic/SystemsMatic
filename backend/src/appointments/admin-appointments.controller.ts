import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard';
import { AppointmentStatus } from '@prisma/client';
import { AdminUpdateStatusDto } from './dto/admin-update-status.dto';
import { AdminRescheduleDto } from './dto/admin-reschedule.dto';

@ApiTags('Admin - Rendez-vous')
@Controller('admin/appointments')
@UseGuards(AdminApiKeyGuard)
@ApiSecurity('admin-api-key')
export class AdminAppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les rendez-vous' })
  @ApiResponse({ status: 200, description: 'Liste de tous les rendez-vous' })
  async findAll(@Query('status') status?: AppointmentStatus) {
    return this.appointmentsService.findAllAdmin(status);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Récupérer les statistiques des rendez-vous' })
  @ApiResponse({ status: 200, description: 'Statistiques des rendez-vous' })
  async getStats() {
    return this.appointmentsService.getStatsAdmin();
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Récupérer les rendez-vous à venir' })
  @ApiResponse({ status: 200, description: 'Rendez-vous à venir' })
  async getUpcoming(@Query('days') days: string = '7') {
    return this.appointmentsService.getUpcomingAdmin(parseInt(days));
  }

  @Get('pending')
  @ApiOperation({ summary: 'Récupérer les rendez-vous en attente' })
  @ApiResponse({ status: 200, description: 'Rendez-vous en attente' })
  async getPending() {
    return this.appointmentsService.findAllAdmin('PENDING');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un rendez-vous par ID' })
  @ApiResponse({ status: 200, description: 'Rendez-vous trouvé' })
  @ApiResponse({ status: 404, description: 'Rendez-vous non trouvé' })
  async findOne(@Param('id') id: string) {
    return this.appointmentsService.findOneAdmin(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: "Mettre à jour le statut d'un rendez-vous" })
  @ApiResponse({ status: 200, description: 'Statut mis à jour' })
  @ApiResponse({ status: 404, description: 'Rendez-vous non trouvé' })
  async updateStatus(
    @Param('id') id: string,
    @Body()
    data: AdminUpdateStatusDto,
  ) {
    return this.appointmentsService.updateStatusAdmin(id, data);
  }

  @Put(':id/reschedule')
  @ApiOperation({ summary: 'Reprogrammer un rendez-vous' })
  @ApiResponse({ status: 200, description: 'Rendez-vous reprogrammé' })
  @ApiResponse({ status: 404, description: 'Rendez-vous non trouvé' })
  async reschedule(@Param('id') id: string, @Body() data: AdminRescheduleDto) {
    return this.appointmentsService.rescheduleAdmin(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un rendez-vous' })
  @ApiResponse({ status: 200, description: 'Rendez-vous supprimé' })
  @ApiResponse({ status: 404, description: 'Rendez-vous non trouvé' })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.appointmentsService.deleteAdmin(id);
    return { message: 'Rendez-vous supprimé avec succès' };
  }

  @Post(':id/send-reminder')
  @ApiOperation({ summary: 'Envoyer un rappel manuel' })
  @ApiResponse({ status: 200, description: 'Rappel envoyé' })
  @ApiResponse({ status: 404, description: 'Rendez-vous non trouvé' })
  async sendReminder(@Param('id') id: string) {
    return this.appointmentsService.sendReminderAdmin(id);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Annuler un rendez-vous (admin)' })
  @ApiResponse({ status: 200, description: 'Rendez-vous annulé' })
  @ApiResponse({ status: 404, description: 'Rendez-vous non trouvé' })
  async cancelAppointment(@Param('id') id: string) {
    return this.appointmentsService.cancelAppointmentAdmin(id);
  }

  @Put(':id/propose-reschedule')
  @ApiOperation({ summary: 'Proposer une reprogrammation de rendez-vous' })
  @ApiResponse({ status: 200, description: 'Proposition envoyée' })
  @ApiResponse({ status: 404, description: 'Rendez-vous non trouvé' })
  async proposeReschedule(
    @Param('id') id: string,
    @Body() data: AdminRescheduleDto,
  ) {
    return this.appointmentsService.proposeRescheduleAdmin(id, data);
  }
}
