import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ReminderScheduler } from './queues/reminder.scheduler';
import { AppointmentStatus, AppointmentReason } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointments.dto';
import { ConfirmAppointmentDto } from './dto/confirm-appointments.dto';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

// Configuration des plugins dayjs pour la gestion des dates
dayjs.extend(utc);
dayjs.extend(timezone);

const REFERENCE_TIMEZONE = 'America/Guadeloupe';
const MINIMUM_CANCELLATION_HOURS = 24;
const AUTHORIZED_TIME_SLOTS = {
  MORNING: { START: 8, END: 12 },
  AFTERNOON: { START: 14, END: 17 },
};

/**
 * Service de gestion des rendez-vous
 */
@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly reminder: ReminderScheduler,
  ) {}

  /**
   * Crée une nouvelle demande de rendez-vous
   * @param dto Données de la demande
   * @returns Rendez-vous créé avec contact
   */
  async create(dto: CreateAppointmentDto) {
    const {
      email,
      firstName,
      lastName,
      phone,
      reason,
      reasonOther,
      message,
      requestedAt,
      timezone,
      consent,
    } = dto;

    try {
      const contact = await this.upsertContact({
        email,
        firstName,
        lastName,
        phone,
        consent,
      });

      const tokens = this.generateSecurityTokens();
      const processedRequestedAt = this.processRequestedDate(
        requestedAt,
        timezone,
      );

      const appointment = await this.prisma.appointment.create({
        data: {
          contactId: contact.id,
          reason,
          reasonOther,
          message,
          requestedAt: processedRequestedAt,
          timezone: timezone,
          ...tokens,
        },
        include: { contact: true },
      });

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
    const appointment = await this.findOneAdmin(id);

    if (
      appointment.status !== AppointmentStatus.PENDING &&
      appointment.status !== AppointmentStatus.RESCHEDULED
    ) {
      throw new BadRequestException(
        'Le rendez-vous ne peut pas être confirmé dans son état actuel',
      );
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: new Date(scheduledAt),
        confirmedAt: new Date(),
      },
      include: { contact: true },
    });

    // Créer le rappel dans le modèle Reminder
    const reminderDueAt = new Date(scheduledAt);
    reminderDueAt.setHours(reminderDueAt.getHours() - 24); // 24h avant

    const reminder = await this.prisma.reminder.create({
      data: {
        appointmentId: updated.id,
        dueAt: reminderDueAt,
      },
    });

    // Planifier le rappel et mettre à jour la référence du provider
    const jobId = await this.reminder.scheduleReminder({
      id: updated.id,
      scheduledAt: updated.scheduledAt,
    });
    if (jobId) {
      await this.prisma.reminder.update({
        where: { id: reminder.id },
        data: { providerRef: jobId },
      });
    }

    await this.mail.sendAppointmentConfirmation(updated);
    return updated;
  }

  async confirmByToken(id: string, token: string) {
    const appt = await this.prisma.appointment.findUnique({ where: { id } });
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
    if (
      appointment.status !== AppointmentStatus.CONFIRMED ||
      !appointment.scheduledAt
    ) {
      return false;
    }

    const hoursUntilAppointment = this.calculateHoursUntilAppointment(
      appointment.scheduledAt,
    );

    return hoursUntilAppointment >= MINIMUM_CANCELLATION_HOURS;
  }

  /**
   * Vérifie si un rendez-vous peut être annulé avec validation du token
   * @param id Identifiant du rendez-vous
   * @param token Token d'annulation
   * @returns Informations sur la possibilité d'annulation
   */
  async canCancelCheck(id: string, token: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { contact: true },
    });

    if (!appointment || appointment.cancellationToken !== token) {
      throw new BadRequestException("Token d'annulation invalide");
    }

    const canCancel = this.canCancelAppointment(appointment);

    let remainingHours = null;
    if (appointment.scheduledAt) {
      remainingHours = Math.max(
        0,
        this.calculateHoursUntilAppointment(appointment.scheduledAt),
      );
      remainingHours = Math.round(remainingHours * 100) / 100;
    }

    const result = {
      canCancel,
      remainingHours,
      message: canCancel
        ? 'Vous pouvez annuler ce rendez-vous'
        : `Impossible d'annuler ce rendez-vous (moins de ${MINIMUM_CANCELLATION_HOURS}h à l'avance)`,
    };

    return result;
  }

  async cancel(id: string, token: string) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: { contact: true },
    });
    if (!appt || appt.cancellationToken !== token)
      throw new BadRequestException('Invalid token');

    // Vérifier que le rendez-vous peut être annulé
    // Permettre l'annulation si :
    // 1. Status est CONFIRMED ET il y a une date programmée
    // 2. OU si c'est une reprogrammation (RESCHEDULED) - on peut toujours refuser
    if (
      (appt.status !== AppointmentStatus.CONFIRMED &&
        appt.status !== AppointmentStatus.RESCHEDULED) ||
      !appt.scheduledAt
    ) {
      throw new BadRequestException('Ce rendez-vous ne peut pas être annulé');
    }

    // Pour un rendez-vous reprogrammé (RESCHEDULED), on peut toujours l'annuler
    // Vérifier qu'il reste au moins 24h seulement si ce n'est pas une reprogrammation récente
    const now = new Date();
    const appointmentTime = new Date(appt.scheduledAt);
    const timeDifference = appointmentTime.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    // Si c'est une reprogrammation (RESCHEDULED) ou récente (moins de 24h), permettre l'annulation
    // Sinon, appliquer la règle des 24h
    const isRescheduled = appt.status === AppointmentStatus.RESCHEDULED;
    const isRecentReschedule = hoursDifference < 24;
    const canCancel =
      isRescheduled || isRecentReschedule || hoursDifference >= 24;

    if (!canCancel) {
      throw new BadRequestException(
        "Impossible d'annuler un rendez-vous moins de 24h à l'avance. Veuillez nous contacter directement.",
      );
    }

    // Annuler le rappel associé
    const reminder = await this.prisma.reminder.findUnique({
      where: { appointmentId: id },
    });

    if (reminder?.providerRef) {
      await this.reminder.cancelReminder(reminder.providerRef);
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: { contact: true },
    });

    // Supprimer le rappel
    if (reminder) {
      await this.prisma.reminder.delete({
        where: { id: reminder.id },
      });
    }

    await this.mail.sendAppointmentCancelled(updated);
    return updated;
  }

  // Méthodes administratives
  async findAllAdmin(status?: AppointmentStatus) {
    const where = status ? { status } : {};
    return this.prisma.appointment.findMany({
      where,
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneAdmin(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { contact: true },
    });

    if (!appointment) {
      throw new NotFoundException(`Rendez-vous avec l'ID ${id} non trouvé`);
    }

    return appointment;
  }

  async updateStatusAdmin(
    id: string,
    data: {
      status: AppointmentStatus;
      scheduledAt?: string;
    },
  ) {
    const appointment = await this.findOneAdmin(id);

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

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: { contact: true },
    });

    // Gérer les rappels selon le statut
    if (data.status === AppointmentStatus.CONFIRMED && updateData.scheduledAt) {
      // Créer ou mettre à jour le rappel
      const reminderDueAt = new Date(updateData.scheduledAt);
      reminderDueAt.setHours(reminderDueAt.getHours() - 24);

      const existingReminder = await this.prisma.reminder.findUnique({
        where: { appointmentId: id },
      });

      if (existingReminder) {
        // Annuler l'ancien rappel
        if (existingReminder.providerRef) {
          await this.reminder.cancelReminder(existingReminder.providerRef);
        }

        // Mettre à jour le rappel existant
        const jobId = await this.reminder.scheduleReminder({
          id: updated.id,
          scheduledAt: updated.scheduledAt,
        });
        await this.prisma.reminder.update({
          where: { id: existingReminder.id },
          data: {
            dueAt: reminderDueAt,
            providerRef: jobId || null,
          },
        });
      } else {
        // Créer un nouveau rappel
        const reminder = await this.prisma.reminder.create({
          data: {
            appointmentId: updated.id,
            dueAt: reminderDueAt,
          },
        });

        const jobId = await this.reminder.scheduleReminder({
          id: updated.id,
          scheduledAt: updated.scheduledAt,
        });
        if (jobId) {
          await this.prisma.reminder.update({
            where: { id: reminder.id },
            data: { providerRef: jobId },
          });
        }
      }

      await this.mail.sendAppointmentConfirmation(updated);
    } else if (data.status === AppointmentStatus.CANCELLED) {
      // Annuler le rappel
      const reminder = await this.prisma.reminder.findUnique({
        where: { appointmentId: id },
      });

      if (reminder?.providerRef) {
        await this.reminder.cancelReminder(reminder.providerRef);
      }

      // Supprimer le rappel
      if (reminder) {
        await this.prisma.reminder.delete({
          where: { id: reminder.id },
        });
      }

      await this.mail.sendAppointmentCancelled(updated);
    }

    return updated;
  }

  async cancelAppointmentAdmin(id: string) {
    const appointment = await this.findOneAdmin(id);

    // Annuler le rappel si il existe
    const reminder = await this.prisma.reminder.findUnique({
      where: { appointmentId: id },
    });

    if (reminder?.providerRef) {
      await this.reminder.cancelReminder(reminder.providerRef);
    }

    // Supprimer le rappel
    if (reminder) {
      await this.prisma.reminder.delete({
        where: { id: reminder.id },
      });
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: { contact: true },
    });

    // Envoyer l'email d'annulation
    await this.mail.sendAppointmentCancelled(updated);

    return updated;
  }

  async rescheduleAdmin(id: string, data: { scheduledAt: string }) {
    const appointment = await this.findOneAdmin(id);

    // Annuler l'ancien rappel si il existe
    const existingReminder = await this.prisma.reminder.findUnique({
      where: { appointmentId: id },
    });

    if (existingReminder?.providerRef) {
      await this.reminder.cancelReminder(existingReminder.providerRef);
    }

    const updateData: any = {
      scheduledAt: new Date(data.scheduledAt),
      status: AppointmentStatus.CONFIRMED,
      confirmedAt: new Date(),
    };

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: { contact: true },
    });

    // Créer ou mettre à jour le rappel
    const reminderDueAt = new Date(data.scheduledAt);
    reminderDueAt.setHours(reminderDueAt.getHours() - 24);

    if (existingReminder) {
      // Mettre à jour le rappel existant
      const jobId = await this.reminder.scheduleReminder({
        id: updated.id,
        scheduledAt: updated.scheduledAt,
      });
      await this.prisma.reminder.update({
        where: { id: existingReminder.id },
        data: {
          dueAt: reminderDueAt,
          providerRef: jobId || null,
        },
      });
    } else {
      // Créer un nouveau rappel
      const reminder = await this.prisma.reminder.create({
        data: {
          appointmentId: updated.id,
          dueAt: reminderDueAt,
        },
      });

      const jobId = await this.reminder.scheduleReminder({
        id: updated.id,
        scheduledAt: updated.scheduledAt,
      });
      if (jobId) {
        await this.prisma.reminder.update({
          where: { id: reminder.id },
          data: { providerRef: jobId },
        });
      }
    }

    await this.mail.sendAppointmentConfirmation(updated);
    return updated;
  }

  async deleteAdmin(id: string) {
    const appointment = await this.findOneAdmin(id);

    // Annuler le rappel si il existe
    const reminder = await this.prisma.reminder.findUnique({
      where: { appointmentId: id },
    });

    if (reminder?.providerRef) {
      await this.reminder.cancelReminder(reminder.providerRef);
    }

    // Supprimer le rappel
    if (reminder) {
      await this.prisma.reminder.delete({
        where: { id: reminder.id },
      });
    }

    await this.prisma.appointment.delete({
      where: { id },
    });
  }

  async sendReminderAdmin(id: string) {
    const appointment = await this.findOneAdmin(id);

    if (
      appointment.status !== AppointmentStatus.CONFIRMED ||
      !appointment.scheduledAt
    ) {
      throw new BadRequestException(
        'Le rendez-vous doit être confirmé et avoir une date programmée',
      );
    }

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

  async proposeRescheduleAdmin(id: string, newScheduledAt: string) {
    const appointment = await this.findOneAdmin(id);

    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException(
        'Seuls les rendez-vous en attente peuvent être reprogrammés',
      );
    }

    // Validation des contraintes de reprogrammation
    // Utiliser dayjs pour interpréter l'heure locale correctement
    const proposedDate = dayjs.tz(newScheduledAt, 'America/Guadeloupe');
    const now = dayjs();

    if (!proposedDate.isValid()) {
      throw new BadRequestException('Date invalide reçue');
    }

    // Vérifier qu'il y a au moins 24h d'avance
    const timeDifference = proposedDate.diff(now, 'hour');

    if (timeDifference < 24) {
      throw new BadRequestException(
        "La reprogrammation doit être proposée au moins 24h à l'avance",
      );
    }

    // Vérifier que l'heure est dans les créneaux autorisés (8h-17h)
    const hour = proposedDate.hour();
    if (hour < 8 || hour > 17 || (hour === 17 && proposedDate.minute() > 0)) {
      throw new BadRequestException(
        'Les créneaux autorisés sont entre 8h et 17h',
      );
    }

    // Vérifier que les minutes sont 0 ou 30
    const minutes = proposedDate.minute();
    if (minutes !== 0 && minutes !== 30) {
      throw new BadRequestException(
        "Les créneaux doivent être à l'heure pile ou à la demi-heure",
      );
    }

    // Mettre à jour la date proposée avec le statut RESCHEDULED
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        scheduledAt: proposedDate.toDate(),
        status: AppointmentStatus.RESCHEDULED,
        confirmedAt: new Date(),
      },
      include: { contact: true },
    });

    // Créer ou mettre à jour le rappel
    const reminderDueAt = new Date(newScheduledAt);
    reminderDueAt.setHours(reminderDueAt.getHours() - 24);

    const existingReminder = await this.prisma.reminder.findUnique({
      where: { appointmentId: id },
    });

    if (existingReminder) {
      // Mettre à jour le rappel existant
      const jobId = await this.reminder.scheduleReminder({
        id: updated.id,
        scheduledAt: updated.scheduledAt,
      });
      await this.prisma.reminder.update({
        where: { id: existingReminder.id },
        data: {
          dueAt: reminderDueAt,
          providerRef: jobId || null,
        },
      });
    } else {
      // Créer un nouveau rappel
      const reminder = await this.prisma.reminder.create({
        data: {
          appointmentId: updated.id,
          dueAt: reminderDueAt,
        },
      });

      const jobId = await this.reminder.scheduleReminder({
        id: updated.id,
        scheduledAt: updated.scheduledAt,
      });
      if (jobId) {
        await this.prisma.reminder.update({
          where: { id: reminder.id },
          data: { providerRef: jobId },
        });
      }
    }

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

  async getUpcomingAdmin(days: number = 7) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { contact: true },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getStatsAdmin() {
    const [total, pending, confirmed, cancelled, completed] = await Promise.all(
      [
        this.prisma.appointment.count(),
        this.prisma.appointment.count({
          where: { status: AppointmentStatus.PENDING },
        }),
        this.prisma.appointment.count({
          where: { status: AppointmentStatus.CONFIRMED },
        }),
        this.prisma.appointment.count({
          where: { status: AppointmentStatus.CANCELLED },
        }),
        this.prisma.appointment.count({
          where: { status: AppointmentStatus.COMPLETED },
        }),
      ],
    );

    return {
      total,
      pending,
      confirmed,
      cancelled,
      completed,
    };
  }

  /**
   * Crée ou met à jour un contact
   * @param contactData Données du contact
   * @returns Contact créé ou mis à jour
   */
  private async upsertContact(contactData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    consent: boolean;
  }) {
    return this.prisma.contact.upsert({
      where: { email: contactData.email },
      update: {
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        phone: contactData.phone,
        consentAt: contactData.consent ? new Date() : undefined,
      },
      create: {
        email: contactData.email,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        phone: contactData.phone,
        consentAt: contactData.consent ? new Date() : undefined,
      },
    });
  }

  /**
   * Génère les tokens de sécurité
   * @returns Tokens de confirmation et d'annulation
   */
  private generateSecurityTokens() {
    return {
      confirmationToken: this.generateToken(),
      cancellationToken: this.generateToken(),
    };
  }

  /**
   * Traite la date demandée avec timezone
   * @param requestedAt Date demandée
   * @param timezone Timezone utilisateur
   * @returns Date traitée pour stockage en UTC
   */
  private processRequestedDate(
    requestedAt: string | Date,
    timezone: string,
  ): Date {
    if (typeof requestedAt === 'string') {
      const dateWithOffset = dayjs(requestedAt);

      if (!dateWithOffset.isValid()) {
        throw new BadRequestException('Date invalide reçue');
      }

      // La date vient avec son offset timezone du frontend
      return dateWithOffset.toDate();
    }

    return requestedAt;
  }

  /**
   * Vérifie si l'heure est dans les créneaux autorisés
   * @param date Date à vérifier
   * @param timezone Timezone de référence
   * @returns true si créneau valide
   */
  private isValidTimeSlot(
    date: Date,
    timezone: string = REFERENCE_TIMEZONE,
  ): boolean {
    const guadeloupeTime = dayjs(date).tz(timezone);
    const hour = guadeloupeTime.hour();

    return (
      (hour >= AUTHORIZED_TIME_SLOTS.MORNING.START &&
        hour < AUTHORIZED_TIME_SLOTS.MORNING.END) ||
      (hour >= AUTHORIZED_TIME_SLOTS.AFTERNOON.START &&
        hour < AUTHORIZED_TIME_SLOTS.AFTERNOON.END)
    );
  }

  /**
   * Calcule le délai avant un rendez-vous en heures
   * @param scheduledAt Date du rendez-vous
   * @returns Nombre d'heures avant le rendez-vous
   */
  private calculateHoursUntilAppointment(scheduledAt: Date): number {
    const now = new Date();
    const timeDifference = scheduledAt.getTime() - now.getTime();
    return timeDifference / (1000 * 60 * 60);
  }

  /**
   * Génère un token aléatoire
   * @returns Token de 26 caractères
   */
  private generateToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
