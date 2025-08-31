import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { Appointment, Contact } from '@prisma/client';

type ApptWithContact = Appointment & { contact?: Contact };

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: Transporter;

  constructor() {
    // Option 1: SMTP via variables d'env
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT
      ? Number(process.env.SMTP_PORT)
      : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        auth: { user, pass },
        secure: port === 465,
      });
    } else {
      // Option 2: mode "console" (no-op) — compile sans erreur
      this.logger.warn(
        'Aucun SMTP configuré — les emails seront loggés en console.',
      );
    }
  }

  private async send(to: string, subject: string, html: string) {
    if (this.transporter) {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM ?? 'noreply@example.com',
        to,
        subject,
        html,
      });
    } else {
      this.logger.log(`[MAIL] to=${to} | subject=${subject}\n${html}`);
    }
  }

  async sendAppointmentRequest(contact: Contact, appt: Appointment) {
    const to = contact.email;
    const subject = 'Nous avons bien reçu votre demande de rendez-vous';
    const html = `
      <p>Bonjour ${contact.firstName},</p>
      <p>Votre demande a été enregistrée. Nous reviendrons vers vous pour confirmer la date/heure.</p>
      <p>Motif: ${appt.reason ?? '—'}<br/>Message: ${appt.message ?? '—'}</p>
      <p>En cas d’annulation: <a href="${process.env.PUBLIC_URL}/appointments/${appt.id}/cancel?token=${appt.cancellationToken}">cliquez ici</a></p>
    `;
    await this.send(to, subject, html);
  }

  async sendAppointmentConfirmation(appt: ApptWithContact) {
    if (!appt.contact) return;
    const to = appt.contact.email;
    const date = appt.scheduledAt
      ? new Date(appt.scheduledAt).toLocaleString('fr-FR')
      : '—';
    const subject = 'Confirmation de votre rendez-vous';
    const html = `
      <p>Bonjour ${appt.contact.firstName},</p>
      <p>Votre rendez-vous est confirmé le <b>${date}</b>.</p>
      <p>Lieu: ${appt.location ?? '—'}</p>
      <p>Pour confirmer par lien: <a href="${process.env.PUBLIC_URL}/appointments/${appt.id}/confirm?token=${appt.confirmationToken}">Confirmer</a></p>
      <p>Pour annuler: <a href="${process.env.PUBLIC_URL}/appointments/${appt.id}/cancel?token=${appt.cancellationToken}">Annuler</a></p>
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
    const date = appt.scheduledAt
      ? new Date(appt.scheduledAt).toLocaleString('fr-FR')
      : '—';
    const subject = 'Rappel : votre rendez-vous est demain';
    const html = `
      <p>Bonjour ${appt.contact.firstName},</p>
      <p>Petit rappel : votre rendez-vous est prévu le <b>${date}</b>.</p>
    `;
    await this.send(to, subject, html);
  }
}
