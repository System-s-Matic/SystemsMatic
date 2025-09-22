import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@Injectable()
export class QuoteEmailService {
  private readonly logger = new Logger(QuoteEmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async sendQuoteNotificationEmail(quoteDto: CreateQuoteDto, quoteId: string) {
    const subject = `Nouvelle demande de devis - ${quoteDto.firstName} ${quoteDto.lastName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
          Nouvelle demande de devis
        </h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Informations du client</h3>
          <p><strong>Nom :</strong><br>${quoteDto.firstName} ${quoteDto.lastName}</p>
          <p><strong>Email :</strong><br>${quoteDto.email}</p>
          ${quoteDto.phone ? `<p><strong>Téléphone :</strong><br>${quoteDto.phone}</p>` : ''}
          <p><strong>Accepte d'être recontacté par téléphone :</strong><br>${quoteDto.acceptPhone ? 'Oui' : 'Non'}</p>
        </div>
        
        <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h3 style="color: #1e293b; margin-top: 0;">Description du projet</h3>
          <p style="white-space: pre-wrap; line-height: 1.6;">${quoteDto.message}</p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #dbeafe; border-radius: 8px;">
          <p style="margin: 0; color: #1e40af;">
            <strong>Action requise :</strong> Contactez le client dans les plus brefs délais pour établir un devis personnalisé.
          </p>
        </div>
      </div>
    `;

    // Utiliser l'email admin depuis les variables d'environnement
    const adminEmail =
      process.env.ADMIN_EMAIL || 'kenzokerachi@hotmail.fr (dev test)';

    await this.mailService.sendEmail(adminEmail, subject, html);

    // Logger l'email dans la base de données
    await this.prisma.emailLog.create({
      data: {
        quoteId,
        to: adminEmail,
        subject,
        template: 'quote-notification-admin',
        meta: {
          contact: {
            firstName: quoteDto.firstName,
            lastName: quoteDto.lastName,
            email: quoteDto.email,
            phone: quoteDto.phone,
          },
          preferences: {
            acceptPhone: quoteDto.acceptPhone,
            acceptTerms: quoteDto.acceptTerms,
          },
        },
      },
    });
  }

  async sendQuoteConfirmationEmail(quoteDto: CreateQuoteDto, quoteId: string) {
    const subject = 'Confirmation de réception - Demande de devis SystemsMatic';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="text-align: center; padding: 10px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">SystemsMatic</h1>
        </div>
        
        <div style="padding: 10px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Bonjour ${quoteDto.firstName},</h2>
          
          <p style="color: #4b5563; line-height: 1.6; padding: 20px;">
            Nous avons bien reçu votre demande de devis et nous vous en remercions. 
            Notre équipe va l'étudier attentivement et vous recontacter rapidement.
          </p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Récapitulatif de votre demande</h3>
            <p><strong>Email :</strong><br>${quoteDto.email}</p>
            ${quoteDto.phone ? `<p><strong>Téléphone :</strong><br>${quoteDto.phone}</p>` : ''}
            ${
              quoteDto.acceptPhone
                ? '<p style="color: #059669;"><strong>✓</strong><br>Vous acceptez d\'être recontacté par téléphone</p>'
                : '<p style="color: #dc2626;"><strong>✗</strong><br>Vous préférez être contacté par email uniquement</p>'
            }
          </div>
          
          <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h4 style="color: #1e293b; margin-top: 0;">Votre projet :</h4>
            <p style="white-space: pre-wrap; line-height: 1.6; color: #4b5563;">${quoteDto.message}</p>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #dbeafe; border-radius: 8px; text-align: center;">
            <h3 style="color: #1e40af; margin-top: 0;">Prochaines étapes</h3>
            <p style="color: #1e40af; margin: 0; line-height: 1.6;">
              📞 Nous vous contacterons sous 24h<br>
              💼 Analyse détaillée de vos besoins<br>
              📋 Devis personnalisé et détaillé<br>
              🤝 Planification de l'intervention
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
            En cas de question urgente, n'hésitez pas à nous contacter directement.
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>SystemsMatic</p>
          <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.</p>
        </div>
      </div>
    `;

    await this.mailService.sendEmail(quoteDto.email, subject, html);

    // Logger l'email dans la base de données
    await this.prisma.emailLog.create({
      data: {
        quoteId,
        to: quoteDto.email,
        subject,
        template: 'quote-confirmation-client',
        meta: {
          contact: {
            firstName: quoteDto.firstName,
            lastName: quoteDto.lastName,
          },
          projectDescription: quoteDto.message,
          preferences: {
            acceptPhone: quoteDto.acceptPhone,
            acceptTerms: quoteDto.acceptTerms,
          },
        },
      },
    });
  }

  async sendQuoteAcceptedEmail(quote: any) {
    const subject = 'Devis accepté - SystemsMatic';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="text-align: center; padding: 10px; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">SystemsMatic</h1>
        </div>
        
        <div style="padding: 10px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Bonjour ${quote.contact.firstName},</h2>
          
          <p style="color: #4b5563; line-height: 1.6; padding: 20px;">
            Nous avons le plaisir de vous informer que votre demande de devis a été acceptée ! 
            Notre équipe va vous recontacter dans les plus brefs délais pour planifier la suite.
          </p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
            <h3 style="color: #1e293b; margin-top: 0;">✅ Devis accepté</h3>
            <p style="color: #4b5563; margin: 0;">
              Votre projet d'automatisme a été validé par notre équipe technique.
            </p>
          </div>
          
          <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h4 style="color: #1e293b; margin-top: 0;">Votre projet :</h4>
            <p style="white-space: pre-wrap; line-height: 1.6; color: #4b5563;">${quote.projectDescription}</p>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #dbeafe; border-radius: 8px; text-align: center;">
            <h3 style="color: #1e40af; margin-top: 0;">Prochaines étapes</h3>
            <p style="color: #1e40af; margin: 0; line-height: 1.6;">
              📞 Contact sous 24h pour planifier l'intervention<br>
              💼 Préparation du devis détaillé<br>
              📋 Validation des modalités<br>
              🚀 Démarrage du projet
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
            En cas de question urgente, n'hésitez pas à nous contacter directement.
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>SystemsMatic</p>
          <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.</p>
        </div>
      </div>
    `;

    await this.mailService.sendEmail(quote.contact.email, subject, html);

    // Logger l'email dans la base de données
    await this.prisma.emailLog.create({
      data: {
        quoteId: quote.id,
        to: quote.contact.email,
        subject,
        template: 'quote-accepted-client',
        meta: {
          contact: {
            firstName: quote.contact.firstName,
            lastName: quote.contact.lastName,
          },
          projectDescription: quote.projectDescription,
          status: 'ACCEPTED',
        },
      },
    });
  }

  async sendQuoteRejectedEmail(quote: any, rejectionReason?: string) {
    const subject = 'Demande de devis - SystemsMatic';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="text-align: center; padding: 10px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">SystemsMatic</h1>
        </div>
        
        <div style="padding: 10px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Bonjour ${quote.contact.firstName},</h2>
          
          <p style="color: #4b5563; line-height: 1.6; padding: 20px;">
            Nous vous remercions pour votre demande de devis. Après étude de votre projet, 
            nous ne sommes malheureusement pas en mesure de vous proposer nos services dans ce cas précis.
          </p>
          
          ${
            rejectionReason
              ? `
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc2626;">
            <h3 style="color: #1e293b; margin-top: 0;">Raison du refus</h3>
            <p style="color: #4b5563; margin: 0; white-space: pre-wrap;">${rejectionReason}</p>
          </div>
          `
              : ''
          }
          
          <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h4 style="color: #1e293b; margin-top: 0;">Votre projet :</h4>
            <p style="white-space: pre-wrap; line-height: 1.6; color: #4b5563;">${quote.projectDescription}</p>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; text-align: center;">
            <h3 style="color: #1e40af; margin-top: 0;">Autres possibilités</h3>
            <p style="color: #4b5563; margin: 0; line-height: 1.6;">
              Nous vous encourageons à nous recontacter pour d'autres projets d'automatisme.<br>
              Notre équipe reste à votre disposition pour tout autre besoin.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
            Merci de votre compréhension et à bientôt pour de futurs projets.
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>SystemsMatic</p>
          <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.</p>
        </div>
      </div>
    `;

    await this.mailService.sendEmail(quote.contact.email, subject, html);

    // Logger l'email dans la base de données
    await this.prisma.emailLog.create({
      data: {
        quoteId: quote.id,
        to: quote.contact.email,
        subject,
        template: 'quote-rejected-client',
        meta: {
          contact: {
            firstName: quote.contact.firstName,
            lastName: quote.contact.lastName,
          },
          projectDescription: quote.projectDescription,
          status: 'REJECTED',
          rejectionReason: rejectionReason || null,
        },
      },
    });
  }
}
