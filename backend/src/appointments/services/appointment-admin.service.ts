import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { AppointmentCrudService } from './appointment-crud.service';
import { AppointmentValidationService } from './appointment-validation.service';
import { AppointmentReminderService } from './appointment-reminder.service';
import { AppointmentStatus } from '@prisma/client';

/**
 * Service pour les opérations administratives des rendez-vous
 */
@Injectable()
export class AppointmentAdminService {
  private readonly logger = new Logger(AppointmentAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly crud: AppointmentCrudService,
    private readonly validation: AppointmentValidationService,
    private readonly reminder: AppointmentReminderService,
  ) {}

  /**
   * Met à jour le statut d'un rendez-vous (admin)
   */
  async updateStatus(
    id: string,
    data: {
      status: AppointmentStatus;
      scheduledAt?: string;
    },
  ) {
    const appointment = await this.crud.findByIdAdmin(id);

    const updateData: any = { status: data.status };

    // Si on confirme sans scheduledAt, utiliser la date demandée
    if (data.status === AppointmentStatus.CONFIRMED && !data.scheduledAt) {
      updateData.scheduledAt = appointment.requestedAt;
      updateData.confirmedAt = new Date();
    } else if (data.scheduledAt) {
      updateData.scheduledAt = new Date(data.scheduledAt);

      if (data.status === AppointmentStatus.CONFIRMED) {
        updateData.confirmedAt = new Date();
      }
    }

    const updated = await this.crud.updateStatus(id, updateData);

    // Gérer les rappels selon le statut
    if (data.status === AppointmentStatus.CONFIRMED && updateData.scheduledAt) {
      await this.reminder.updateReminder(updated.id, updated.scheduledAt);
      await this.mail.sendAppointmentConfirmation(updated);
    } else if (data.status === AppointmentStatus.CANCELLED) {
      await this.reminder.deleteReminder(updated.id);
      await this.mail.sendAppointmentCancelled(updated);
    }

    return updated;
  }

  /**
   * Annule un rendez-vous (admin)
   */
  async cancelAppointment(id: string) {
    // Annuler le rappel si il existe
    await this.reminder.deleteReminder(id);

    const updated = await this.crud.updateStatus(id, {
      status: AppointmentStatus.CANCELLED,
      cancelledAt: new Date(),
    });

    // Envoyer l'email d'annulation
    await this.mail.sendAppointmentCancelled(updated);

    return updated;
  }

  /**
   * Reprogramme un rendez-vous (admin)
   */
  async reschedule(id: string, data: { scheduledAt: string }) {
    // Annuler l'ancien rappel si il existe
    await this.reminder.deleteReminder(id);

    const updateData = {
      scheduledAt: new Date(data.scheduledAt),
      status: AppointmentStatus.CONFIRMED,
      confirmedAt: new Date(),
    };

    const updated = await this.crud.updateStatus(id, updateData);

    // Créer ou mettre à jour le rappel
    await this.reminder.updateReminder(updated.id, updated.scheduledAt);

    await this.mail.sendAppointmentConfirmation(updated);
    return updated;
  }

  /**
   * Supprime un rendez-vous (admin)
   */
  async delete(id: string) {
    // Annuler le rappel si il existe
    await this.reminder.deleteReminder(id);

    await this.crud.delete(id);
  }

  /**
   * Envoie un rappel manuel (admin)
   */
  async sendReminder(id: string) {
    const appointment = await this.crud.findByIdAdmin(id);

    this.validation.validateReminder(appointment);

    await this.mail.sendAppointmentReminder(appointment);

    // Créer un log d'email
    await this.prisma.emailLog.create({
      data: {
        appointmentId: appointment.id,
        to: appointment.contact.email,
        subject: 'Rappel de rendez-vous',
        template: 'reminder',
        meta: { sentBy: 'admin' },
      },
    });

    return { message: 'Rappel envoyé avec succès' };
  }

  /**
   * Propose une reprogrammation (admin)
   */
  async proposeReschedule(id: string, newScheduledAt: string) {
    const appointment = await this.crud.findByIdAdmin(id);

    this.validation.validateReschedule(appointment);
    const proposedDate = this.validation.validateRescheduleDate(newScheduledAt);

    // Mettre à jour la date proposée avec le statut RESCHEDULED
    const updated = await this.crud.updateStatus(id, {
      scheduledAt: proposedDate.toDate(),
      status: AppointmentStatus.RESCHEDULED,
      confirmedAt: new Date(),
    });

    // Créer ou mettre à jour le rappel
    await this.reminder.updateReminder(updated.id, updated.scheduledAt);

    // Envoyer un email de proposition de reprogrammation
    await this.mail.sendAppointmentRescheduleProposal(updated);

    // Créer un log d'email
    await this.prisma.emailLog.create({
      data: {
        appointmentId: appointment.id,
        to: appointment.contact.email,
        subject: 'Proposition de reprogrammation',
        template: 'reschedule_proposal',
        meta: { sentBy: 'admin' },
      },
    });

    return { message: 'Proposition de reprogrammation envoyée' };
  }

  /**
   * Récupère les rendez-vous à venir (admin)
   */
  async getUpcoming(days: number = 7) {
    return this.crud.findUpcoming(days);
  }

  /**
   * Récupère les statistiques (admin)
   */
  async getStats() {
    return this.crud.countByStatus();
  }
}
