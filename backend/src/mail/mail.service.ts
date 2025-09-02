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

type ApptWithContact = Appointment & { contact?: Contact };

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

  private async send(to: string, subject: string, html: string) {
    if (this.resend) {
      try {
        await this.resend.emails.send({
          from: process.env.MAIL_FROM ?? 'noreply@example.com',
          to,
          subject,
          html,
        });
        this.logger.log(`Email envoyé avec succès à ${to}`);
      } catch (error) {
        this.logger.error(`Erreur lors de l'envoi d'email à ${to}:`, error);
        throw error;
      }
    } else {
      this.logger.log(`[MAIL] to=${to} | subject=${subject}\n${html}`);
    }
  }

  private formatDate(
    date: Date | string | null | undefined,
    tz: string,
  ): string {
    if (!date) return '—';
    return dayjs(date).tz(tz).format('dddd DD MMMM YYYY à HH:mm');
  }

  async sendAppointmentRequest(contact: Contact, appt: Appointment) {
    const to = contact.email;
    const subject = 'Nous avons bien reçu votre demande de rendez-vous';
    const requestedDate = this.formatDate(
      appt.requestedAt,
      'America/Guadeloupe',
    );
    const html = `
      <p>Bonjour ${contact.firstName},</p>
      <p>Votre demande a été enregistrée. Nous reviendrons vers vous pour confirmer la date/heure.</p>
      <p><strong>Date souhaitée :</strong> ${requestedDate}</p>
      <p><strong>Motif :</strong> ${appt.reason ?? '—'}<br/>${appt.message ? `Message : ${appt.message}` : ''}</p>
      <p>Pour annuler : <a href="${process.env.PUBLIC_URL}/appointments/${appt.id}/cancel?token=${appt.cancellationToken}">cliquez ici</a></p>
    `;
    await this.send(to, subject, html);
  }

  async sendAppointmentConfirmation(appt: ApptWithContact) {
    if (!appt.contact) return;
    const to = appt.contact.email;
    const scheduledDate = this.formatDate(
      appt.scheduledAt,
      'America/Guadeloupe',
    );
    const subject = 'Confirmation de votre rendez-vous';
    const html = `
      <p>Bonjour ${appt.contact.firstName},</p>
      <p>Votre rendez-vous est confirmé le <b>${scheduledDate}</b>.</p>
      <p>Annuler : <a href="${process.env.PUBLIC_URL}/appointments/${appt.id}/cancel?token=${appt.cancellationToken}">Annuler</a></p>
      <p><strong>Important :</strong> Vous ne pouvez annuler ce rendez-vous que jusqu'à 24h avant l'heure prévue. Passé ce délai, veuillez nous contacter directement.</p>
    `;
    await this.send(to, subject, html);
  }

  async sendAppointmentCancelled(appt: ApptWithContact) {
    if (!appt.contact) return;
    const to = appt.contact.email;
    const subject = 'Votre rendez-vous a été annulé';
    const html = `
      <p>Bonjour ${appt.contact.firstName},</p>
      <p>Votre rendez-vous a bien été annulé.</p>
    `;
    await this.send(to, subject, html);
  }

  async sendAppointmentReminder(appt: ApptWithContact) {
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

  async sendAppointmentRescheduleProposal(appt: ApptWithContact) {
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
