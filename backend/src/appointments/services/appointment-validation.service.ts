import { Injectable, BadRequestException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { randomBytes } from 'node:crypto';

// Configuration des plugins dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

const REFERENCE_TIMEZONE = 'America/Guadeloupe';
const MINIMUM_CANCELLATION_HOURS = 24;
const AUTHORIZED_TIME_SLOTS = {
  MORNING: { START: 8, END: 12 },
  AFTERNOON: { START: 14, END: 17 },
};

/**
 * Service de validation pour les règles métier des rendez-vous
 */
@Injectable()
export class AppointmentValidationService {
  /**
   * Vérifie si un rendez-vous peut être annulé (minimum 24h à l'avance)
   */
  canCancelAppointment(appointment: any): boolean {
    // Les demandes en attente peuvent toujours être annulées
    if (appointment.status === AppointmentStatus.PENDING) {
      return true;
    }

    // Pour les rendez-vous confirmés ou reprogrammés, vérifier le délai de 24h
    if (
      appointment.status !== AppointmentStatus.CONFIRMED &&
      appointment.status !== AppointmentStatus.RESCHEDULED
    ) {
      return false;
    }

    if (!appointment.scheduledAt) {
      return false;
    }

    const hoursUntilAppointment = this.calculateHoursUntilAppointment(
      appointment.scheduledAt,
    );

    return hoursUntilAppointment >= MINIMUM_CANCELLATION_HOURS;
  }

  /**
   * Vérifie si un rendez-vous peut être annulé avec validation du token
   */
  async canCancelCheck(appointment: any, token: string) {
    if (appointment.cancellationToken !== token) {
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

    let message: string;
    if (appointment.status === AppointmentStatus.PENDING) {
      message = 'Vous pouvez annuler cette demande';
    } else if (!canCancel) {
      message = `Impossible d'annuler ce rendez-vous (moins de ${MINIMUM_CANCELLATION_HOURS}h à l'avance)`;
    } else {
      message = 'Vous pouvez annuler ce rendez-vous';
    }

    return {
      canCancel,
      remainingHours,
      message,
    };
  }

  /**
   * Valide qu'un rendez-vous peut être annulé
   */
  validateCancellation(appointment: any, token: string) {
    if (appointment.cancellationToken !== token) {
      throw new BadRequestException('Token invalide');
    }

    // Les demandes en attente peuvent toujours être annulées
    if (appointment.status === AppointmentStatus.PENDING) {
      return;
    }

    // Vérifier que le rendez-vous peut être annulé (doit être confirmé ou reprogrammé)
    if (
      appointment.status !== AppointmentStatus.CONFIRMED &&
      appointment.status !== AppointmentStatus.RESCHEDULED
    ) {
      throw new BadRequestException('Ce rendez-vous ne peut pas être annulé');
    }

    // Pour les rendez-vous confirmés ou reprogrammés, vérifier le délai de 24h
    if (!appointment.scheduledAt) {
      throw new BadRequestException('Ce rendez-vous ne peut pas être annulé');
    }

    // Pour un rendez-vous reprogrammé (RESCHEDULED), on peut toujours l'annuler
    const now = new Date();
    const appointmentTime = new Date(appointment.scheduledAt);
    const timeDifference = appointmentTime.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    const isRescheduled = appointment.status === AppointmentStatus.RESCHEDULED;
    const canCancel = isRescheduled || hoursDifference >= 24;

    if (!canCancel) {
      throw new BadRequestException(
        "Impossible d'annuler un rendez-vous moins de 24h à l'avance. Veuillez nous contacter directement.",
      );
    }
  }

  /**
   * Valide qu'un rendez-vous peut être confirmé
   */
  validateConfirmation(appointment: any) {
    if (
      appointment.status !== AppointmentStatus.PENDING &&
      appointment.status !== AppointmentStatus.RESCHEDULED
    ) {
      throw new BadRequestException(
        'Le rendez-vous ne peut pas être confirmé dans son état actuel',
      );
    }
  }

  /**
   * Valide qu'un rendez-vous peut être reprogrammé
   */
  validateReschedule(appointment: any) {
    if (
      appointment.status !== AppointmentStatus.PENDING &&
      appointment.status !== AppointmentStatus.RESCHEDULED
    ) {
      throw new BadRequestException(
        'Seuls les rendez-vous en attente ou en cours de reprogrammation peuvent être reprogrammés',
      );
    }
  }

  /**
   * Valide une date de reprogrammation
   */
  validateRescheduleDate(newScheduledAt: string) {
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

    return proposedDate;
  }

  /**
   * Valide qu'un rendez-vous peut recevoir un rappel
   */
  validateReminder(appointment: any) {
    if (
      appointment.status !== AppointmentStatus.CONFIRMED ||
      !appointment.scheduledAt
    ) {
      throw new BadRequestException(
        'Le rendez-vous doit être confirmé et avoir une date programmée',
      );
    }
  }

  /**
   * Vérifie si l'heure est dans les créneaux autorisés
   */
  isValidTimeSlot(date: Date, timezone: string = REFERENCE_TIMEZONE): boolean {
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
   */
  private calculateHoursUntilAppointment(scheduledAt: Date): number {
    const now = new Date();
    const timeDifference = scheduledAt.getTime() - now.getTime();
    return timeDifference / (1000 * 60 * 60);
  }

  /**
   * Traite la date demandée avec timezone
   */
  processRequestedDate(requestedAt: string | Date): Date {
    if (typeof requestedAt === 'string') {
      const dateWithOffset = dayjs(requestedAt);

      if (!dateWithOffset.isValid()) {
        throw new BadRequestException('Date invalide reçue');
      }

      return dateWithOffset.toDate();
    }

    return requestedAt;
  }

  /**
   * Génère un token aléatoire
   */
  generateToken(): string {
    return randomBytes(32).toString('hex'); // 64 caractères hex
  }

  /**
   * Génère les tokens de sécurité
   */
  generateSecurityTokens() {
    return {
      confirmationToken: this.generateToken(),
      cancellationToken: this.generateToken(),
    };
  }
}
