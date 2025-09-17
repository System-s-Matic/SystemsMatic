import {
  Injectable,
  BadRequestException,
  NotFoundException,
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

dayjs.extend(utc);
dayjs.extend(timezone);

const GUADELOUPE_TIMEZONE = 'America/Guadeloupe';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private reminder: ReminderScheduler,
  ) {}

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

    // Créer ou récupérer le contact
    const contact = await this.prisma.contact.upsert({
      where: { email },
      update: {
        firstName,
        lastName,
        phone,
        consentAt: consent ? new Date() : undefined,
      },
      create: {
        email,
        firstName,
        lastName,
        phone,
        consentAt: consent ? new Date() : undefined,
      },
    });

    // Générer les tokens uniques
    const confirmationToken = this.generateToken();
    const cancellationToken = this.generateToken();

    // Traiter requestedAt comme une date UTC déjà convertie par le frontend
    let processedRequestedAt: Date;

    if (typeof requestedAt === 'string') {
      // La date est déjà en UTC, on la traite directement
      const utcTime = dayjs.utc(requestedAt);

      // Vérifier que la date est valide
      if (!utcTime.isValid()) {
        throw new BadRequestException('Date invalide reçue');
      }

      // Convertir en Date JavaScript (sera stockée en UTC dans la BDD)
      processedRequestedAt = utcTime.toDate();
    } else {
      processedRequestedAt = requestedAt;
    }

    // Créer le rendez-vous avec la date traitée
    const appointment = await this.prisma.appointment.create({
      data: {
        contactId: contact.id,
        reason,
        reasonOther,
        message,
        requestedAt: processedRequestedAt,
        timezone: timezone || GUADELOUPE_TIMEZONE,
        confirmationToken,
        cancellationToken,
      },
      include: { contact: true },
    });

    // Envoyer l'email de confirmation de demande
    await this.mail.sendAppointmentRequest(appointment.contact, appointment);

    return appointment;
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
   * Vérifie si un rendez-vous peut être annulé (au moins 24h à l'avance)
   */
  canCancelAppointment(appt: any): boolean {
    if (appt.status !== AppointmentStatus.CONFIRMED || !appt.scheduledAt) {
      return false;
    }

    const now = new Date();
    const appointmentTime = new Date(appt.scheduledAt);
    const timeDifference = appointmentTime.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    return hoursDifference >= 24;
  }

  /**
   * Vérifie si un rendez-vous peut être annulé (avec token)
   */
  async canCancelCheck(id: string, token: string) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: { contact: true },
    });

    if (!appt || appt.cancellationToken !== token) {
      throw new BadRequestException('Token invalide');
    }

    const canCancel = this.canCancelAppointment(appt);
    const now = new Date();
    const appointmentTime = appt.scheduledAt
      ? new Date(appt.scheduledAt)
      : null;

    let remainingHours = null;
    if (appointmentTime) {
      const timeDifference = appointmentTime.getTime() - now.getTime();
      remainingHours = Math.max(0, timeDifference / (1000 * 60 * 60));
    }

    return {
      canCancel,
      remainingHours: Math.round(remainingHours * 100) / 100,
      message: canCancel
        ? 'Vous pouvez annuler ce rendez-vous'
        : "Impossible d'annuler ce rendez-vous (moins de 24h à l'avance)",
    };
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

  private generateToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
