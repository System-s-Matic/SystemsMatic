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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AppointmentsService } from '../appointments/appointments.service';
import { QuotesService } from '../quotes/quotes.service';
import { QueueMonitorService } from '../queue/queue-monitor.service';
import { AppointmentStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UpdateQuoteDto } from '../quotes/dto/update-quote.dto';

@ApiTags('Backoffice (Admin)')
@Controller('backoffice')
@UseGuards(JwtAuthGuard, AdminGuard)
export class BackofficeController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly quotesService: QuotesService,
    private readonly queueMonitorService: QueueMonitorService,
  ) {}

  @Get('appointments')
  @ApiOperation({ summary: 'Récupérer tous les rendez-vous (Admin)' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrer par statut',
  })
  @ApiResponse({ status: 200, description: 'Liste des rendez-vous récupérée' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin requis' })
  @ApiBearerAuth()
  async getAppointments(@Query('status') status?: AppointmentStatus) {
    return this.appointmentsService.findAllAdmin(status);
  }

  @Get('appointments/pending')
  @ApiOperation({ summary: 'Récupérer les rendez-vous en attente (Admin)' })
  @ApiResponse({ status: 200, description: 'Liste des rendez-vous en attente' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin requis' })
  @ApiBearerAuth()
  async getPendingAppointments() {
    return this.appointmentsService.findAllAdmin('PENDING');
  }

  @Get('appointments/upcoming')
  @ApiOperation({ summary: 'Récupérer les rendez-vous à venir (Admin)' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Nombre de jours à venir (défaut: 7)',
  })
  @ApiResponse({ status: 200, description: 'Liste des rendez-vous à venir' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin requis' })
  @ApiBearerAuth()
  async getUpcomingAppointments(@Query('days') days?: string) {
    const daysNumber = days ? parseInt(days, 10) : 7;
    return this.appointmentsService.getUpcomingAdmin(daysNumber);
  }

  @Get('appointments/stats')
  @ApiOperation({
    summary: 'Récupérer les statistiques des rendez-vous (Admin)',
  })
  @ApiResponse({ status: 200, description: 'Statistiques des rendez-vous' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin requis' })
  @ApiBearerAuth()
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

  @Post('appointments/:id/reschedule')
  async proposeReschedule(
    @Param('id') id: string,
    @Body() data: { newScheduledAt: string },
  ) {
    return this.appointmentsService.proposeRescheduleAdmin(
      id,
      data.newScheduledAt,
    );
  }

  // === GESTION DES DEVIS ===

  @Get('quotes')
  async getQuotes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = parseInt(page || '1');
    const limitNum = parseInt(limit || '10');

    return this.quotesService.findAllWithFilters(pageNum, limitNum, {
      status,
      search,
    });
  }

  @Get('quotes/stats')
  async getQuotesStats() {
    return this.quotesService.getStats();
  }

  @Get('quotes/:id')
  async getQuote(@Param('id') id: string) {
    return this.quotesService.findOne(id);
  }

  @Put('quotes/:id')
  async updateQuote(
    @Param('id') id: string,
    @Body() updateQuoteDto: UpdateQuoteDto,
  ) {
    return this.quotesService.updateQuote(id, updateQuoteDto);
  }

  @Put('quotes/:id/status')
  async updateQuoteStatus(
    @Param('id') id: string,
    @Body() data: { status: string; data?: any },
  ) {
    return this.quotesService.updateStatus(id, data.status, data.data);
  }

  @Put('quotes/:id/accept')
  async acceptQuote(
    @Param('id') id: string,
    @Body() body: { document?: string; validUntil?: string },
  ) {
    return this.quotesService.acceptQuote(id, body);
  }

  @Put('quotes/:id/reject')
  async rejectQuote(
    @Param('id') id: string,
    @Body() body: { rejectionReason: string },
  ) {
    return this.quotesService.rejectQuote(id, body.rejectionReason);
  }

  // === DASHBOARD GLOBAL ===

  @Get('dashboard')
  async getDashboard() {
    const [appointmentStats, quoteStats] = await Promise.all([
      this.appointmentsService.getStatsAdmin(),
      this.quotesService.getStats(),
    ]);

    return {
      appointments: appointmentStats,
      quotes: quoteStats,
    };
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
  @Get('queue/stats')
  async getQueueStats() {
    return this.queueMonitorService.getQueueStats();
  }

  @Get('queue/health')
  async getQueueHealth() {
    return this.queueMonitorService.getQueueHealth();
  }
}
