import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteFilterDto } from './dto/quote-filter.dto';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async create(createQuoteDto: CreateQuoteDto) {
    try {
      this.logger.log("Création d'une nouvelle demande de devis");

      // Créer ou trouver le contact existant
      const contact = await this.prisma.contact.upsert({
        where: { email: createQuoteDto.email },
        update: {
          firstName: createQuoteDto.firstName,
          lastName: createQuoteDto.lastName,
          phone: createQuoteDto.phone,
        },
        create: {
          firstName: createQuoteDto.firstName,
          lastName: createQuoteDto.lastName,
          email: createQuoteDto.email,
          phone: createQuoteDto.phone,
        },
      });

      // Créer la demande de devis dans la table dédiée
      const quote = await this.prisma.quote.create({
        data: {
          contactId: contact.id,
          projectDescription: createQuoteDto.message,
          acceptPhone: createQuoteDto.acceptPhone,
          acceptTerms: createQuoteDto.acceptTerms,
          status: 'PENDING',
        },
      });

      // Envoyer l'email de notification à l'admin
      await this.sendQuoteNotificationEmail(createQuoteDto, quote.id);

      // Envoyer l'email de confirmation au client
      await this.sendQuoteConfirmationEmail(createQuoteDto, quote.id);

      this.logger.log(
        `Demande de devis créée avec succès pour ${createQuoteDto.email}`,
      );

      return {
        success: true,
        message: 'Votre demande de devis a été envoyée avec succès',
        id: quote.id,
      };
    } catch (error) {
      this.logger.error(
        'Erreur lors de la création de la demande de devis:',
        error,
      );
      throw error;
    }
  }

  private async sendQuoteNotificationEmail(
    quoteDto: CreateQuoteDto,
    quoteId: string,
  ) {
    const subject = `Nouvelle demande de devis - ${quoteDto.firstName} ${quoteDto.lastName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
          Nouvelle demande de devis
        </h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Informations du client</h3>
          <p><strong>Nom :</strong> ${quoteDto.firstName} ${quoteDto.lastName}</p>
          <p><strong>Email :</strong> ${quoteDto.email}</p>
          ${quoteDto.phone ? `<p><strong>Téléphone :</strong> ${quoteDto.phone}</p>` : ''}
          <p><strong>Accepte d'être recontacté par téléphone :</strong> ${quoteDto.acceptPhone ? 'Oui' : 'Non'}</p>
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

  private async sendQuoteConfirmationEmail(
    quoteDto: CreateQuoteDto,
    quoteId: string,
  ) {
    const subject = 'Confirmation de réception - Demande de devis SystemsMatic';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">SystemsMatic</h1>
        </div>
        
        <div style="padding: 30px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Bonjour ${quoteDto.firstName},</h2>
          
          <p style="color: #4b5563; line-height: 1.6;">
            Nous avons bien reçu votre demande de devis et nous vous en remercions. 
            Notre équipe va l'étudier attentivement et vous recontacter rapidement.
          </p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Récapitulatif de votre demande</h3>
            <p><strong>Email :</strong> ${quoteDto.email}</p>
            ${quoteDto.phone ? `<p><strong>Téléphone :</strong> ${quoteDto.phone}</p>` : ''}
            ${
              quoteDto.acceptPhone
                ? '<p style="color: #059669;"><strong>✓</strong> Vous acceptez d\'être recontacté par téléphone</p>'
                : '<p style="color: #dc2626;"><strong>✗</strong> Vous préférez être contacté par email uniquement</p>'
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

  // Méthodes additionnelles pour la gestion des devis

  async findAll(page = 1, limit = 10, status?: string) {
    const where = status ? { status: status as any } : {};

    const [quotes, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        include: {
          contact: true,
          emailLogs: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.quote.count({ where }),
    ]);

    return {
      data: quotes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.quote.findUnique({
      where: { id },
      include: {
        contact: true,
        emailLogs: {
          orderBy: { sentAt: 'desc' },
        },
      },
    });
  }

  async updateStatus(id: string, status: string, data?: any) {
    const updateData: any = { status };

    // Mise à jour des timestamps selon le statut
    switch (status) {
      case 'PROCESSING':
        updateData.processedAt = new Date();
        break;
      case 'SENT':
        updateData.sentAt = new Date();
        if (data?.validUntil)
          updateData.quoteValidUntil = new Date(data.validUntil);
        if (data?.document) updateData.quoteDocument = data.document;
        break;
      case 'ACCEPTED':
      case 'REJECTED':
        updateData.respondedAt = new Date();
        break;
    }

    return this.prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        contact: true,
      },
    });
  }

  async getStats() {
    const [total, pending, processing, sent, accepted, rejected] =
      await Promise.all([
        this.prisma.quote.count(),
        this.prisma.quote.count({ where: { status: 'PENDING' } }),
        this.prisma.quote.count({ where: { status: 'PROCESSING' } }),
        this.prisma.quote.count({ where: { status: 'SENT' } }),
        this.prisma.quote.count({ where: { status: 'ACCEPTED' } }),
        this.prisma.quote.count({ where: { status: 'REJECTED' } }),
      ]);

    return {
      total,
      pending,
      processing,
      sent,
      accepted,
      rejected,
      conversionRate:
        total > 0 ? ((accepted / total) * 100).toFixed(2) : '0.00',
    };
  }

  async findAllWithFilters(page = 1, limit = 10, filters: QuoteFilterDto) {
    const where: any = {};

    // Filtre par statut
    if (filters.status) {
      where.status = filters.status;
    }

    // Filtre par contact ID
    if (filters.contactId) {
      where.contactId = filters.contactId;
    }

    // Recherche par nom ou email du contact
    if (filters.search) {
      where.contact = {
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      };
    }

    const [quotes, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        include: {
          contact: true,
          emailLogs: {
            select: {
              id: true,
              sentAt: true,
              template: true,
            },
            orderBy: { sentAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.quote.count({ where }),
    ]);

    return {
      data: quotes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateQuote(id: string, updateQuoteDto: UpdateQuoteDto) {
    const updateData: any = { ...updateQuoteDto };

    // Convertir les dates string en objets Date si nécessaire
    if (updateQuoteDto.quoteValidUntil) {
      updateData.quoteValidUntil = new Date(updateQuoteDto.quoteValidUntil);
    }

    // Mettre à jour les timestamps selon le statut
    if (updateQuoteDto.status) {
      switch (updateQuoteDto.status) {
        case 'PROCESSING':
          updateData.processedAt = new Date();
          break;
        case 'SENT':
          updateData.sentAt = new Date();
          break;
        case 'ACCEPTED':
        case 'REJECTED':
          updateData.respondedAt = new Date();
          break;
      }
    }

    return this.prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        contact: true,
        emailLogs: {
          orderBy: { sentAt: 'desc' },
        },
      },
    });
  }
}
