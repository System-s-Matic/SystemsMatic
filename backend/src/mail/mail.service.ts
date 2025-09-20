import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { Appointment, Contact } from '@prisma/client';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/fr';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('fr');

const EMAIL_TIMEZONE = 'America/Guadeloupe';
type AppointmentWithContact = Appointment & { contact?: Contact };
const EMAIL_CONFIG = {
  DEFAULT_FROM: 'noreply@systemsmatic.com',
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

  constructor() {
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
   * @param action Action (confirm/cancel)
   * @param token Token de sécurité
   * @returns URL complète
   */
  private generateActionUrl(
    appointmentId: string,
    action: 'confirm' | 'cancel',
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

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; margin-top: 0;">Demande de rendez-vous reçue ✅</h2>
        
        <p>Bonjour <strong>${contact.firstName}</strong>,</p>
        
        <p>Nous avons bien reçu votre demande de rendez-vous. Notre équipe va examiner votre demande et vous recontacter rapidement pour confirmer la date et l'heure.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">📋 Détails de votre demande</h3>
          <p><strong>Date souhaitée :</strong> ${requestedDate}</p>
          <p><strong>Motif :</strong> ${appointment.reason ?? 'Non spécifié'}</p>
          ${appointment.reasonOther ? `<p><strong>Précision :</strong> ${appointment.reasonOther}</p>` : ''}
          ${appointment.message ? `<p><strong>Message :</strong> ${appointment.message}</p>` : ''}
        </div>
        
        <p style="margin-top: 30px;">
          <a href="${cancelUrl}" style="color: #dc2626; text-decoration: none; font-weight: bold;">
            🚫 Annuler cette demande
          </a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center; font-size: 14px; color: #6b7280;">
          <img src="${EMAIL_CONFIG.LOGO_URL}" alt="System's Matic" style="width: 40px; height: auto; margin-right: 10px;">
          <div>
            <strong>System's Matic</strong> - Service de rendez-vous<br>
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
          </div>
        </div>
      </div>
    `;

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

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669; margin-top: 0;">Rendez-vous confirmé 🎉</h2>
        
        <p>Bonjour <strong>${appointment.contact.firstName}</strong>,</p>
        
        <p>Excellente nouvelle ! Votre rendez-vous a été confirmé.</p>
        
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <h3 style="margin-top: 0; color: #065f46;">📅 Détails du rendez-vous</h3>
          <p style="font-size: 18px; font-weight: bold; color: #065f46;">
            ${scheduledDate}
          </p>
          ${appointment.reason ? `<p><strong>Motif :</strong> ${appointment.reason}</p>` : ''}
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;">
            <strong>⚠️ Important :</strong> Vous ne pouvez annuler ce rendez-vous que jusqu'à 24h avant l'heure prévue. 
            Passé ce délai, veuillez nous contacter directement.
          </p>
        </div>
        
        <p style="margin-top: 30px;">
          <a href="${cancelUrl}" style="color: #dc2626; text-decoration: none; font-weight: bold;">
            🚫 Annuler ce rendez-vous
          </a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center; font-size: 14px; color: #6b7280;">
          <img src="${EMAIL_CONFIG.LOGO_URL}" alt="System's Matic" style="width: 40px; height: auto; margin-right: 10px;">
          <div>
            <strong>System's Matic</strong> - Service de rendez-vous<br>
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
          </div>
        </div>
      </div>
    `;

    await this.send(appointment.contact.email, 'Rendez-vous confirmé', html);
  }

  async sendAppointmentCancelled(appt: AppointmentWithContact) {
    if (!appt.contact) return;

    const cancelledDate = this.formatDate(
      appt.scheduledAt,
      'America/Guadeloupe',
    );

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626; margin-top: 0;">Rendez-vous annulé ❌</h2>
        
        <p>Bonjour <strong>${appt.contact.firstName}</strong>,</p>
        
        <p>Votre rendez-vous ${cancelledDate ? `du <strong>${cancelledDate}</strong>` : ''} a bien été annulé.</p>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 0; color: #991b1b;">
            <strong>✅ Confirmation :</strong> Votre rendez-vous a été annulé avec succès. 
            Vous pouvez reprendre un nouveau rendez-vous à tout moment si nécessaire.
          </p>
        </div>
        
        <p style="margin-top: 30px;">
          <a href="${EMAIL_CONFIG.BASE_URL}" style="color: #2563eb; text-decoration: none; font-weight: bold;">
            📅 Prendre un nouveau rendez-vous
          </a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center; font-size: 14px; color: #6b7280;">
          <img src="${EMAIL_CONFIG.LOGO_URL}" alt="System's Matic" style="width: 40px; height: auto; margin-right: 10px;">
          <div>
            <strong>System's Matic</strong> - Service de rendez-vous<br>
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
          </div>
        </div>
      </div>
    `;
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

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b; margin-top: 0;">Rappel : votre rendez-vous approche ⏰</h2>
        
        <p>Bonjour <strong>${appt.contact.firstName}</strong>,</p>
        
        <p>Petit rappel concernant votre rendez-vous qui approche !</p>
        
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e;">📅 Votre rendez-vous</h3>
          <p style="font-size: 18px; font-weight: bold; color: #92400e;">
            ${scheduledDate}
          </p>
          ${appt.reason ? `<p><strong>Motif :</strong> ${appt.reason}</p>` : ''}
        </div>
        
        <div style="background-color: #ecfeff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #06b6d4;">
          <p style="margin: 0; color: #155e75;">
            <strong>ℹ️ Rappel :</strong> Si vous devez annuler ce rendez-vous, pensez à le faire au moins 24h à l'avance.
          </p>
        </div>
        
        <p style="margin-top: 30px;">
          <a href="${cancelUrl}" style="color: #dc2626; text-decoration: none; font-weight: bold;">
            🚫 Annuler ce rendez-vous
          </a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center; font-size: 14px; color: #6b7280;">
          <img src="${EMAIL_CONFIG.LOGO_URL}" alt="System's Matic" style="width: 40px; height: auto; margin-right: 10px;">
          <div>
            <strong>System's Matic</strong> - Service de rendez-vous<br>
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
          </div>
        </div>
      </div>
    `;
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
      'confirm',
      appt.confirmationToken,
    );
    const cancelUrl = this.generateActionUrl(
      appt.id,
      'cancel',
      appt.cancellationToken,
    );

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed; margin-top: 0;">Proposition de reprogrammation 🔄</h2>
        
        <p>Bonjour <strong>${appt.contact.firstName}</strong>,</p>
        
        <p>Nous vous proposons de reprogrammer votre rendez-vous à une nouvelle date qui pourrait mieux vous convenir.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
          <h3 style="margin-top: 0; color: #5b21b6;">📅 Nouvelle date proposée</h3>
          <p style="font-size: 18px; font-weight: bold; color: #5b21b6;">
            ${scheduledDate}
          </p>
          ${appt.reason ? `<p><strong>Motif :</strong> ${appt.reason}</p>` : ''}
        </div>
        
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
          <p style="margin: 0; color: #0c4a6e;">
            <strong>ℹ️ À noter :</strong> Si vous refusez cette proposition, vous devrez prendre un nouveau rendez-vous manuellement depuis notre site.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px; display: inline-block;">
            ✅ Accepter cette date
          </a>
          <br><br>
          <a href="${cancelUrl}" style="color: #dc2626; text-decoration: none; font-weight: bold;">
            ❌ Refuser et annuler
          </a>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center; font-size: 14px; color: #6b7280;">
          <img src="${EMAIL_CONFIG.LOGO_URL}" alt="System's Matic" style="width: 40px; height: auto; margin-right: 10px;">
          <div>
            <strong>System's Matic</strong> - Service de rendez-vous<br>
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
          </div>
        </div>
      </div>
    `;
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

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
          Nouvelle demande de rendez-vous
        </h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Informations du client</h3>
          <p><strong>Nom :</strong> ${contact.firstName} ${contact.lastName}</p>
          <p><strong>Email :</strong> ${contact.email}</p>
          ${contact.phone ? `<p><strong>Téléphone :</strong> ${contact.phone}</p>` : ''}
        </div>
        
        <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h3 style="color: #1e293b; margin-top: 0;">Détails de la demande</h3>
          <p><strong>Date souhaitée :</strong> ${requestedDate}</p>
          <p><strong>Motif :</strong> ${appointment.reason ?? 'Non spécifié'}</p>
          ${appointment.reasonOther ? `<p><strong>Précision :</strong> ${appointment.reasonOther}</p>` : ''}
          ${appointment.message ? `<p><strong>Message :</strong> ${appointment.message}</p>` : ''}
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #dbeafe; border-radius: 8px;">
          <p style="margin: 0; color: #1e40af;">
            <strong>Action requise :</strong> Contactez le client dans les plus brefs délais pour confirmer le rendez-vous.
          </p>
        </div>
      </div>
    `;

    // Utiliser l'email admin depuis les variables d'environnement
    const adminEmail =
      process.env.ADMIN_EMAIL || 'kenzokerachi@hotmail.fr (dev test)';

    await this.send(adminEmail, subject, html);
  }
}
