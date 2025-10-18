import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from '../appointments/dto/create-appointments.dto';
import { ConfirmAppointmentDto } from '../appointments/dto/confirm-appointments.dto';

@ApiTags('Rendez-vous')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau rendez-vous' })
  @ApiResponse({ status: 201, description: 'Rendez-vous créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiBody({ type: CreateAppointmentDto })
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Patch(':id/confirm')
  @ApiOperation({
    summary: 'Confirmer un rendez-vous avec une date programmée',
  })
  @ApiParam({ name: 'id', description: 'ID du rendez-vous' })
  @ApiResponse({ status: 200, description: 'Rendez-vous confirmé avec succès' })
  @ApiResponse({ status: 404, description: 'Rendez-vous non trouvé' })
  @ApiBody({ type: ConfirmAppointmentDto })
  confirm(@Param('id') id: string, @Body() dto: ConfirmAppointmentDto) {
    return this.appointmentsService.confirm(id, dto);
  }

  @Get(':id/confirm')
  @ApiOperation({ summary: 'Confirmer un rendez-vous via token (lien email)' })
  @ApiParam({ name: 'id', description: 'ID du rendez-vous' })
  @ApiQuery({ name: 'token', description: 'Token de confirmation' })
  @ApiResponse({ status: 200, description: 'Rendez-vous confirmé avec succès' })
  @ApiResponse({ status: 400, description: 'Token invalide ou expiré' })
  confirmByToken(@Param('id') id: string, @Query('token') token: string) {
    return this.appointmentsService.confirmByToken(id, token);
  }

  @Get(':id/cancel')
  @ApiOperation({ summary: 'Annuler un rendez-vous via token' })
  @ApiParam({ name: 'id', description: 'ID du rendez-vous' })
  @ApiQuery({ name: 'token', description: "Token d'annulation" })
  @ApiResponse({ status: 200, description: 'Rendez-vous annulé avec succès' })
  @ApiResponse({
    status: 400,
    description: 'Token invalide ou rendez-vous non annulable',
  })
  cancel(@Param('id') id: string, @Query('token') token: string) {
    return this.appointmentsService.cancel(id, token);
  }

  @Get(':id/can-cancel')
  @ApiOperation({ summary: 'Vérifier si un rendez-vous peut être annulé' })
  @ApiParam({ name: 'id', description: 'ID du rendez-vous' })
  @ApiQuery({ name: 'token', description: 'Token de vérification' })
  @ApiResponse({ status: 200, description: "Statut d'annulation vérifié" })
  canCancel(@Param('id') id: string, @Query('token') token: string) {
    return this.appointmentsService.canCancelCheck(id, token);
  }

  @Get(':id/accept-reschedule')
  @ApiOperation({ summary: 'Accepter une reprogrammation de rendez-vous' })
  @ApiParam({ name: 'id', description: 'ID du rendez-vous' })
  @ApiQuery({ name: 'token', description: "Token d'acceptation" })
  @ApiResponse({
    status: 200,
    description: 'Reprogrammation acceptée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Token invalide ou reprogrammation non disponible',
  })
  acceptReschedule(@Param('id') id: string, @Query('token') token: string) {
    return this.appointmentsService.acceptReschedule(id, token);
  }

  @Get(':id/reject-reschedule')
  @ApiOperation({ summary: 'Refuser une reprogrammation de rendez-vous' })
  @ApiParam({ name: 'id', description: 'ID du rendez-vous' })
  @ApiQuery({ name: 'token', description: 'Token de refus' })
  @ApiResponse({
    status: 200,
    description: 'Reprogrammation refusée avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Token invalide ou reprogrammation non disponible',
  })
  rejectReschedule(@Param('id') id: string, @Query('token') token: string) {
    return this.appointmentsService.rejectReschedule(id, token);
  }
}
