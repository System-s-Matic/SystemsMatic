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
   * @param date Date à formater
   * @param timezone Timezone d'affichage
   * @returns Date formatée ou "—" si nulle
   */
  private formatDate(
    date: Date | string | null | undefined,
    timezone: string = EMAIL_TIMEZONE,
  ): string {
    if (!date) return '—';
    return dayjs(date).tz(timezone).format(EMAIL_CONFIG.DATE_FORMAT);
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
   * Envoie un email de confirmation de demande de rendez-vous
   * @param contact Informations du contact
   * @param appointment Détails du rendez-vous demandé
   */
  async sendAppointmentRequest(
    contact: Contact,
    appointment: Appointment,
  ): Promise<void> {
    const requestedDate = this.formatDate(appointment.requestedAt);
    const cancelUrl = this.generateActionUrl(
      appointment.id,
      'cancel',
      appointment.cancellationToken,
    );

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Demande de rendez-vous reçue ✅</h2>
        
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
          <a href="${cancelUrl}" style="color: #dc2626; text-decoration: none;">
            🚫 Annuler cette demande
          </a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 14px; color: #6b7280;">
          System's Matic - Service de rendez-vous<br>
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
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
        <h2 style="color: #059669;">Rendez-vous confirmé 🎉</h2>
        
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
        <p style="font-size: 14px; color: #6b7280;">
          System's Matic - Service de rendez-vous<br>
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
      </div>
    `;

    await this.send(appointment.contact.email, 'Rendez-vous confirmé', html);
  }

  async sendAppointmentCancelled(appt: AppointmentWithContact) {
    if (!appt.contact) return;
    const to = appt.contact.email;
    const subject = 'Votre rendez-vous a été annulé';
    const html = `
      <p>Bonjour ${appt.contact.firstName},</p>
      <p>Votre rendez-vous a bien été annulé.</p>
    `;
    await this.send(to, subject, html);
  }

  async sendAppointmentReminder(appt: AppointmentWithContact) {
    if (!appt.contact) return;
    const to = appt.contact.email;
    const scheduledDate = this.formatDate(
      appt.scheduledAt,
      'America/Guadeloupe',
    );
    const subject = 'Rappel : votre rendez-vous approche';
    const html = `
      <p>Bonjour ${appt.contact.firstName},</p>
      <p>Petit rappel : votre rendez-vous est prévu le <b>${scheduledDate}</b>.</p>
    `;
    await this.send(to, subject, html);
  }

  async sendAppointmentRescheduleProposal(appt: AppointmentWithContact) {
    if (!appt.contact) return;
    const to = appt.contact.email;
    const scheduledDate = this.formatDate(
      appt.scheduledAt,
      'America/Guadeloupe',
    );
    const subject = 'Proposition de reprogrammation de votre rendez-vous';
    const html = `
      <p>Bonjour ${appt.contact.firstName},</p>
      <p>Nous vous proposons de reprogrammer votre rendez-vous au <b>${scheduledDate}</b>.</p>
      <p>Pour confirmer cette nouvelle date : <a href="${process.env.PUBLIC_URL}/appointments/${appt.id}/confirm?token=${appt.confirmationToken}">Confirmer</a></p>
      <p>Pour refuser et annuler : <a href="${process.env.PUBLIC_URL}/appointments/${appt.id}/cancel?token=${appt.cancellationToken}">Refuser</a></p>
      <p>Si vous refusez, vous devrez prendre un nouveau rendez-vous manuellement.</p>
    `;
    await this.send(to, subject, html);
  }
}
