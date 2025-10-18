import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { AppointmentStatus } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointments.dto';
import { ConfirmAppointmentDto } from './dto/confirm-appointments.dto';
import { AppointmentCrudService } from './services/appointment-crud.service';
import { AppointmentValidationService } from './services/appointment-validation.service';
import { AppointmentReminderService } from './services/appointment-reminder.service';
import { AppointmentAdminService } from './services/appointment-admin.service';

/**
 * Service principal de gestion des rendez-vous
 * Orchestre les différents services spécialisés
 */
@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly mail: MailService,
    private readonly crud: AppointmentCrudService,
    private readonly validation: AppointmentValidationService,
    private readonly reminder: AppointmentReminderService,
    private readonly admin: AppointmentAdminService,
  ) {}

  /**
   * Crée une nouvelle demande de rendez-vous
   * @param dto Données de la demande
   * @returns Rendez-vous créé avec contact
   */
  async create(dto: CreateAppointmentDto) {
    const { email, firstName, lastName, phone, requestedAt, consent } = dto;

    try {
      const contact = await this.crud.upsertContact({
        email,
        firstName,
        lastName,
        phone,
        consent,
      });

      const tokens = this.validation.generateSecurityTokens();
      const processedRequestedAt =
        this.validation.processRequestedDate(requestedAt);

      const appointment = await this.crud.create(
        dto,
        contact.id,
        tokens,
        processedRequestedAt,
      );

      await this.mail.sendAppointmentRequest(appointment.contact, appointment);
      await this.mail.sendAppointmentNotificationEmail(
        appointment.contact,
        appointment,
      );

      return appointment;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création du rendez-vous: ${error.message}`,
      );
      throw error;
    }
  }

  async confirm(id: string, dto: ConfirmAppointmentDto) {
    const { scheduledAt } = dto;
    const appointment = await this.crud.findByIdAdmin(id);

    this.validation.validateConfirmation(appointment);

    const updated = await this.crud.updateStatus(id, {
      status: AppointmentStatus.CONFIRMED,
      scheduledAt: new Date(scheduledAt),
      confirmedAt: new Date(),
    });

    // Créer le rappel
    await this.reminder.createReminder(updated.id, updated.scheduledAt);

    await this.mail.sendAppointmentConfirmation(updated);
    return updated;
  }

  async confirmByToken(id: string, token: string) {
    const appt = await this.crud.findByIdWithContact(id);
    if (!appt || appt.confirmationToken !== token)
      throw new BadRequestException('Invalid token');
    if (!appt.scheduledAt)
      throw new BadRequestException('No scheduled date set.');
    return this.confirm(id, { scheduledAt: appt.scheduledAt.toISOString() });
  }

  /**
   * Vérifie si un rendez-vous peut être annulé (minimum 24h à l'avance)
   * @param appointment Rendez-vous à vérifier
   * @returns true si annulation possible
   */
  canCancelAppointment(appointment: any): boolean {
    return this.validation.canCancelAppointment(appointment);
  }

  /**
   * Vérifie si un rendez-vous peut être annulé avec validation du token
   * @param id Identifiant du rendez-vous
   * @param token Token d'annulation
   * @returns Informations sur la possibilité d'annulation
   */
  async canCancelCheck(id: string, token: string) {
    const appointment = await this.crud.findByIdWithContact(id);

    if (!appointment) {
      throw new BadRequestException("Token d'annulation invalide");
    }

    return this.validation.canCancelCheck(appointment, token);
  }

  async cancel(id: string, token: string) {
    const appt = await this.crud.findByIdWithContact(id);
    if (!appt) throw new BadRequestException('Invalid token');

    this.validation.validateCancellation(appt, token);

    // Annuler le rappel associé
    await this.reminder.deleteReminder(id);

    const updated = await this.crud.updateStatus(id, {
      status: AppointmentStatus.CANCELLED,
      cancelledAt: new Date(),
    });

    await this.mail.sendAppointmentCancelled(updated);
    return updated;
  }

  // Méthodes administratives - Délégation vers le service admin
  async findAllAdmin(status?: AppointmentStatus) {
    return this.crud.findAllWithStatus(status);
  }

  async findOneAdmin(id: string) {
    return this.crud.findByIdAdmin(id);
  }

  async updateStatusAdmin(
    id: string,
    data: {
      status: AppointmentStatus;
      scheduledAt?: string;
    },
  ) {
    return this.admin.updateStatus(id, data);
  }

  async cancelAppointmentAdmin(id: string) {
    return this.admin.cancelAppointment(id);
  }

  async rescheduleAdmin(id: string, data: { scheduledAt: string }) {
    return this.admin.reschedule(id, data);
  }

  async deleteAdmin(id: string) {
    return this.admin.delete(id);
  }

  async sendReminderAdmin(id: string) {
    return this.admin.sendReminder(id);
  }

  async proposeRescheduleAdmin(id: string, newScheduledAt: string) {
    return this.admin.proposeReschedule(id, newScheduledAt);
  }

  async getUpcomingAdmin(days: number = 7) {
    return this.admin.getUpcoming(days);
  }

  async getStatsAdmin() {
    return this.admin.getStats();
  }

  /**
   * Accepte une demande de reprogrammation
   * @param id ID du rendez-vous
   * @param token Token de confirmation
   */
  async acceptReschedule(id: string, token: string) {
    const appointment = await this.crud.findByIdWithContact(id);

    if (!appointment) {
      throw new BadRequestException('Rendez-vous introuvable');
    }

    if (appointment.confirmationToken !== token) {
      throw new BadRequestException('Token de confirmation invalide');
    }

    if (appointment.status !== AppointmentStatus.RESCHEDULED) {
      throw new BadRequestException(
        "Ce rendez-vous n'est pas en attente de reprogrammation",
      );
    }

    // Confirmer la nouvelle date
    const updated = await this.crud.updateStatus(id, {
      status: AppointmentStatus.CONFIRMED,
      confirmedAt: new Date(),
    });

    // Mettre à jour le rappel avec la nouvelle date
    await this.reminder.updateReminder(updated.id, updated.scheduledAt);

    // Envoyer un email de confirmation
    await this.mail.sendAppointmentConfirmation(updated);

    return updated;
  }

  /**
   * Refuse une demande de reprogrammation et annule le rendez-vous
   * @param id ID du rendez-vous
   * @param token Token d'annulation
   */
  async rejectReschedule(id: string, token: string) {
    const appointment = await this.crud.findByIdWithContact(id);

    if (!appointment) {
      throw new BadRequestException('Rendez-vous introuvable');
    }

    if (appointment.cancellationToken !== token) {
      throw new BadRequestException("Token d'annulation invalide");
    }

    if (appointment.status !== AppointmentStatus.RESCHEDULED) {
      throw new BadRequestException(
        "Ce rendez-vous n'est pas en attente de reprogrammation",
      );
    }

    // Supprimer le rappel
    await this.reminder.deleteReminder(id);

    // Annuler le rendez-vous
    const updated = await this.crud.updateStatus(id, {
      status: AppointmentStatus.CANCELLED,
      cancelledAt: new Date(),
    });

    // Envoyer un email d'annulation
    await this.mail.sendAppointmentCancelled(updated);

    return updated;
  }
}
