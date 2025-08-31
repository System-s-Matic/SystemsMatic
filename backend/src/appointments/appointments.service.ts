import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointments.dto';
import { ConfirmAppointmentDto } from './dto/confirm-appointments.dto';
import { AppointmentStatus } from '@prisma/client';
import { nanoid } from 'nanoid';
import { MailService } from '../mail/mail.service';
import { ReminderScheduler } from './queues/reminder.scheduler';

function toGuadeloupeTime(date: Date | string): Date {
  const dateObj = new Date(date);
  return new Date(
    dateObj.toLocaleString('fr-FR', {
      timeZone: 'America/Guadeloupe',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
  );
}

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private reminder: ReminderScheduler,
  ) {}

  async create(dto: CreateAppointmentDto) {
    const contact = await this.prisma.contact.upsert({
      where: { email: dto.email },
      update: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        consentAt: dto.consent ? new Date() : undefined,
      },
      create: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        consentAt: dto.consent ? new Date() : undefined,
      },
    });

    const appointmentData = {
      contactId: contact.id,
      reason: dto.reason,
      reasonOther: dto.reason === 'AUTRE' ? dto.reasonOther : null,
      message: dto.message || null,
      confirmationToken: nanoid(32),
      cancellationToken: nanoid(32),
    };

    const appointment = await this.prisma.appointment.create({
      data: appointmentData,
      include: { contact: true },
    });

    await this.mail.sendAppointmentRequest(contact, appointment);
    return appointment;
  }

  async confirm(id: string, dto: ConfirmAppointmentDto) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: { contact: true },
    });
    if (!appt) throw new NotFoundException();

    // Convertir la date en timezone Guadeloupe
    const guadeloupeTime = toGuadeloupeTime(dto.scheduledAt);

    // unique (contactId, scheduledAt) peut lever une erreur — on laisse Postgres/Prisma la remonter si doublon
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: guadeloupeTime,
        timezone: 'America/Guadeloupe',
        confirmedAt: new Date(),
        reminderScheduledAt: new Date(
          guadeloupeTime.getTime() - 24 * 3600 * 1000,
        ),
      },
      include: { contact: true },
    });

    // planifie le rappel et persiste le jobId
    const jobId = await this.reminder.scheduleReminder(updated);
    if (jobId) {
      await this.prisma.appointment.update({
        where: { id },
        data: { reminderJobId: jobId },
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

  async cancel(id: string, token: string) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: { contact: true },
    });
    if (!appt || appt.cancellationToken !== token)
      throw new BadRequestException('Invalid token');

    await this.reminder.cancelReminder(appt.reminderJobId ?? undefined);

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        reminderJobId: null,
      },
      include: { contact: true },
    });

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
      location?: string;
    },
  ) {
    const appointment = await this.findOneAdmin(id);

    const updateData: any = { status: data.status };

    if (data.scheduledAt) {
      const guadeloupeTime = toGuadeloupeTime(data.scheduledAt);
      updateData.scheduledAt = guadeloupeTime;
      updateData.timezone = 'America/Guadeloupe';

      if (data.status === AppointmentStatus.CONFIRMED) {
        updateData.confirmedAt = new Date();
        updateData.reminderScheduledAt = new Date(
          guadeloupeTime.getTime() - 24 * 3600 * 1000,
        );
      }
    }

    if (data.location) {
      updateData.location = data.location;
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: { contact: true },
    });

    // Gérer les rappels selon le statut
    if (data.status === AppointmentStatus.CONFIRMED && data.scheduledAt) {
      const jobId = await this.reminder.scheduleReminder(updated);
      if (jobId) {
        await this.prisma.appointment.update({
          where: { id },
          data: { reminderJobId: jobId },
        });
      }
      await this.mail.sendAppointmentConfirmation(updated);
    } else if (data.status === AppointmentStatus.CANCELLED) {
      await this.reminder.cancelReminder(
        appointment.reminderJobId ?? undefined,
      );
      await this.mail.sendAppointmentCancelled(updated);
    }

    return updated;
  }

  async rescheduleAdmin(
    id: string,
    data: { scheduledAt: string; location?: string },
  ) {
    const appointment = await this.findOneAdmin(id);

    // Annuler l'ancien rappel si il existe
    if (appointment.reminderJobId) {
      await this.reminder.cancelReminder(appointment.reminderJobId);
    }

    const guadeloupeTime = toGuadeloupeTime(data.scheduledAt);

    const updateData: any = {
      scheduledAt: guadeloupeTime,
      timezone: 'America/Guadeloupe',
      status: AppointmentStatus.CONFIRMED,
      confirmedAt: new Date(),
      reminderScheduledAt: new Date(
        guadeloupeTime.getTime() - 24 * 3600 * 1000,
      ),
    };

    if (data.location) {
      updateData.location = data.location;
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: { contact: true },
    });

    // Planifier le nouveau rappel
    const jobId = await this.reminder.scheduleReminder(updated);
    if (jobId) {
      await this.prisma.appointment.update({
        where: { id },
        data: { reminderJobId: jobId },
      });
    }

    await this.mail.sendAppointmentConfirmation(updated);
    return updated;
  }

  async deleteAdmin(id: string) {
    const appointment = await this.findOneAdmin(id);

    // Annuler le rappel si il existe
    if (appointment.reminderJobId) {
      await this.reminder.cancelReminder(appointment.reminderJobId);
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

    // Mettre à jour la date du dernier email
    await this.prisma.appointment.update({
      where: { id },
      data: { lastEmailAt: new Date() },
    });

    return { message: 'Rappel envoyé avec succès' };
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

  async getPendingAdmin() {
    return this.prisma.appointment.findMany({
      where: { status: AppointmentStatus.PENDING },
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats() {
    const total = await this.prisma.appointment.count();
    const pending = await this.prisma.appointment.count({
      where: { status: AppointmentStatus.PENDING },
    });
    const confirmed = await this.prisma.appointment.count({
      where: { status: AppointmentStatus.CONFIRMED },
    });
    const cancelled = await this.prisma.appointment.count({
      where: { status: AppointmentStatus.CANCELLED },
    });
    const completed = await this.prisma.appointment.count({
      where: { status: AppointmentStatus.COMPLETED },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await this.prisma.appointment.count({
      where: {
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return {
      total,
      pending,
      confirmed,
      cancelled,
      completed,
      todayAppointments,
      statusDistribution: {
        pending: total > 0 ? (pending / total) * 100 : 0,
        confirmed: total > 0 ? (confirmed / total) * 100 : 0,
        cancelled: total > 0 ? (cancelled / total) * 100 : 0,
        completed: total > 0 ? (completed / total) * 100 : 0,
      },
    };
  }
}
