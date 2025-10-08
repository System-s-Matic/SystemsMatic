import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Resend } from 'resend';
import { Appointment, Contact } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/fr';
import { EmailRenderer } from '../email-templates/EmailRenderer';
import { EmailActionsService } from '../email-actions/email-actions.service';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('fr');

const EMAIL_TIMEZONE = 'America/Guadeloupe';
type AppointmentWithContact = Appointment & { contact?: Contact };
const EMAIL_CONFIG = {
  DEFAULT_FROM: 'noreply@systemsmatic.netlify.app',
  DATE_FORMAT: 'dddd DD MMMM YYYY à HH:mm',
  BASE_URL: process.env.PUBLIC_URL || 'http://localhost:3000',
  LOGO_URL:
    'https://res.cloudinary.com/dfqpyuhyj/image/upload/v1758333945/1755694814429f_-_Ramco_tpoknd.jpg',
} as const;

/**
 * Service de gestion des emails
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend?: Resend;

  constructor(
    @Inject(forwardRef(() => EmailActionsService))
    private readonly emailActionsService: EmailActionsService,
  ) {
    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn(
        'Aucune clé API Resend configurée — les emails seront loggés en console.',
      );
    }
  }

  /**
   * Envoie un email via Resend ou log en console selon la configuration
   * @param to Destinataire
   * @param subject Sujet
   * @param html Contenu HTML
   */
  private async send(to: string, subject: string, html: string): Promise<void> {
    if (this.resend) {
      try {
        await this.resend.emails.send({
          from: process.env.MAIL_FROM ?? EMAIL_CONFIG.DEFAULT_FROM,
          to,
          subject,
          html,
        });
      } catch (error) {
        this.logger.error(`Erreur lors de l'envoi d'email à ${to}:`, error);
        throw error;
      }
    }
  }

  /**
   * Formate une date pour l'affichage dans les emails
   * @param date Date à formater (toutes les dates sont maintenant en UTC depuis la base)
   * @param timezone Timezone d'affichage
   * @returns Date formatée ou "—" si nulle
   */
  private formatDate(
    date: Date | string | null | undefined,
    timezone: string = EMAIL_TIMEZONE,
  ): string {
    if (!date) return '—';
    // Toutes les dates venant de la base sont en UTC
    return dayjs.utc(date).tz(timezone).format(EMAIL_CONFIG.DATE_FORMAT);
  }

  /**
   * Génère une URL d'action pour un rendez-vous
   * @param appointmentId ID du rendez-vous
   * @param action Action (confirm/cancel/accept-reschedule/reject-reschedule)
   * @param token Token de sécurité
   * @returns URL complète
   */
  private generateActionUrl(
    appointmentId: string,
    action: 'confirm' | 'cancel' | 'accept-reschedule' | 'reject-reschedule',
    token: string,
  ): string {
    return `${EMAIL_CONFIG.BASE_URL}/appointments/${appointmentId}/${action}?token=${token}`;
  }

  /**
   * Envoie un email générique
   * @param to Destinataire
   * @param subject Sujet
   * @param html Contenu HTML
   */
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    await this.send(to, subject, html);
  }

  /**
   * Envoie un email de confirmation de demande de rendez-vous
   * @param contact Informations du contact
   * @param appointment Détails du rendez-vous demandé
   */
  async sendAppointmentRequest(
    contact: Contact,
    appointment: Appointment,
  ): Promise<void> {
    // Pour requestedAt, utiliser la timezone de l'utilisateur stockée avec le rendez-vous
    const requestedDate = this.formatDate(
      appointment.requestedAt,
      appointment.timezone,
    );
    const cancelUrl = this.generateActionUrl(
      appointment.id,
      'cancel',
      appointment.cancellationToken,
    );

    const html = await EmailRenderer.renderAppointmentRequest({
      contactName: contact.firstName,
      requestedDate,
      reason: appointment.reason,
      reasonOther: appointment.reasonOther,
      message: appointment.message,
      cancelUrl,
    });

    await this.send(contact.email, 'Demande de rendez-vous reçue', html);
  }

  /**
   * Envoie un email de confirmation de rendez-vous planifié
   * @param appointment Rendez-vous confirmé avec contact
   */
  async sendAppointmentConfirmation(
    appointment: AppointmentWithContact,
  ): Promise<void> {
    if (!appointment.contact) {
      return;
    }

    const scheduledDate = this.formatDate(appointment.scheduledAt);
    const cancelUrl = this.generateActionUrl(
      appointment.id,
      'cancel',
      appointment.cancellationToken,
    );

    const html = await EmailRenderer.renderAppointmentConfirmation({
      contactName: appointment.contact.firstName,
      scheduledDate,
      reason: appointment.reason,
      cancelUrl,
    });

    await this.send(appointment.contact.email, 'Rendez-vous confirmé', html);
  }

  async sendAppointmentCancelled(appt: AppointmentWithContact) {
    if (!appt.contact) return;

    const cancelledDate = this.formatDate(
      appt.scheduledAt,
      'America/Guadeloupe',
    );

    const html = await EmailRenderer.renderAppointmentCancelled({
      contactName: appt.contact.firstName,
      cancelledDate,
      baseUrl: EMAIL_CONFIG.BASE_URL,
    });

    await this.send(appt.contact.email, 'Votre rendez-vous a été annulé', html);
  }

  async sendAppointmentReminder(appt: AppointmentWithContact) {
    if (!appt.contact) return;

    const scheduledDate = this.formatDate(
      appt.scheduledAt,
      'America/Guadeloupe',
    );
    const cancelUrl = this.generateActionUrl(
      appt.id,
      'cancel',
      appt.cancellationToken,
    );

    const html = await EmailRenderer.renderAppointmentReminder({
      contactName: appt.contact.firstName,
      scheduledDate,
      reason: appt.reason,
      cancelUrl,
    });

    await this.send(
      appt.contact.email,
      'Rappel : votre rendez-vous approche',
      html,
    );
  }

  async sendAppointmentRescheduleProposal(appt: AppointmentWithContact) {
    if (!appt.contact) return;

    const scheduledDate = this.formatDate(
      appt.scheduledAt,
      'America/Guadeloupe',
    );
    const confirmUrl = this.generateActionUrl(
      appt.id,
      'accept-reschedule',
      appt.confirmationToken,
    );
    const cancelUrl = this.generateActionUrl(
      appt.id,
      'reject-reschedule',
      appt.cancellationToken,
    );

    const html = await EmailRenderer.renderAppointmentRescheduleProposal({
      contactName: appt.contact.firstName,
      scheduledDate,
      reason: appt.reason,
      confirmUrl,
      cancelUrl,
    });

    await this.send(
      appt.contact.email,
      'Proposition de reprogrammation de votre rendez-vous',
      html,
    );
  }

  /**
   * Envoie un email de notification à l'admin pour une nouvelle demande de rendez-vous
   * @param contact Informations du contact
   * @param appointment Détails du rendez-vous demandé
   */
  async sendAppointmentNotificationEmail(
    contact: Contact,
    appointment: Appointment,
  ): Promise<void> {
    const requestedDate = this.formatDate(
      appointment.requestedAt,
      appointment.timezone,
    );

    const subject = `Nouvelle demande de rendez-vous - ${contact.firstName} ${contact.lastName}`;

    // Générer les tokens d'actions
    const [acceptToken, rejectToken, rescheduleToken] = await Promise.all([
      this.emailActionsService.createActionToken(
        'appointment',
        appointment.id,
        'accept',
      ),
      this.emailActionsService.createActionToken(
        'appointment',
        appointment.id,
        'reject',
      ),
      this.emailActionsService.createActionToken(
        'appointment',
        appointment.id,
        'reschedule',
      ),
    ]);

    const html = await EmailRenderer.renderAdminAppointmentNotification({
      contactName: `${contact.firstName} ${contact.lastName}`,
      contactEmail: contact.email,
      contactPhone: contact.phone,
      requestedDate,
      reason: appointment.reason,
      reasonOther: appointment.reasonOther,
      message: appointment.message,
      appointmentId: appointment.id,
      acceptToken,
      rejectToken,
      rescheduleToken,
      baseUrl: EMAIL_CONFIG.BASE_URL,
    });

    // Utiliser l'email admin depuis les variables d'environnement
    const adminEmail =
      process.env.ADMIN_EMAIL || 'kenzokerachi@hotmail.fr (dev test)';

    await this.send(adminEmail, subject, html);
  }

  /**
   * Envoie un email de confirmation de devis accepté
   */
  async sendQuoteAccepted(quote: any): Promise<void> {
    const subject = 'Votre devis a été accepté - SystemsMatic';

    const html = await EmailRenderer.renderQuoteAccepted({
      contactName: `${quote.contact.firstName} ${quote.contact.lastName}`,
      projectDescription: quote.projectDescription,
    });

    await this.send(quote.contact.email, subject, html);
  }

  /**
   * Envoie un email de refus de devis
   */
  async sendQuoteRejected(quote: any): Promise<void> {
    const subject = 'Réponse à votre demande de devis - SystemsMatic';

    const html = await EmailRenderer.renderQuoteRejected({
      contactName: `${quote.contact.firstName} ${quote.contact.lastName}`,
      projectDescription: quote.projectDescription,
      rejectionReason: quote.rejectionReason,
    });

    await this.send(quote.contact.email, subject, html);
  }
}
