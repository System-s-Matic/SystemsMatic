import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';
import { CreateAppointmentDto } from '../dto/create-appointments.dto';

/**
 * Service CRUD pour les opérations de base des rendez-vous
 */
@Injectable()
export class AppointmentCrudService {
  private readonly logger = new Logger(AppointmentCrudService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée un nouveau rendez-vous
   */
  async create(
    dto: CreateAppointmentDto,
    contactId: string,
    tokens: any,
    processedRequestedAt: Date,
  ) {
    return this.prisma.appointment.create({
      data: {
        contactId,
        reason: dto.reason,
        reasonOther: dto.reasonOther,
        message: dto.message,
        requestedAt: processedRequestedAt,
        timezone: dto.timezone,
        ...tokens,
      },
      include: { contact: true },
    });
  }

  /**
   * Trouve un rendez-vous par ID avec contact
   */
  async findByIdWithContact(id: string) {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: { contact: true },
    });
  }

  /**
   * Trouve un rendez-vous par ID (admin)
   */
  async findByIdAdmin(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { contact: true },
    });

    if (!appointment) {
      throw new Error(`Rendez-vous avec l'ID ${id} non trouvé`);
    }

    return appointment;
  }

  /**
   * Trouve tous les rendez-vous avec filtre de statut
   */
  async findAllWithStatus(status?: AppointmentStatus) {
    const where = status ? { status } : {};
    return this.prisma.appointment.findMany({
      where,
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Met à jour le statut d'un rendez-vous
   */
  async updateStatus(
    id: string,
    data: {
      status: AppointmentStatus;
      scheduledAt?: Date;
      confirmedAt?: Date;
      cancelledAt?: Date;
    },
  ) {
    return this.prisma.appointment.update({
      where: { id },
      data,
      include: { contact: true },
    });
  }

  /**
   * Supprime un rendez-vous
   */
  async delete(id: string) {
    return this.prisma.appointment.delete({
      where: { id },
    });
  }

  /**
   * Trouve les rendez-vous à venir
   */
  async findUpcoming(days: number = 7) {
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

  /**
   * Compte les rendez-vous par statut
   */
  async countByStatus() {
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
   */
  async upsertContact(contactData: {
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
}
