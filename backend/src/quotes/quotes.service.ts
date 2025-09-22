import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuoteEmailService } from './quote-email.service';
import { QuoteManagementService } from './quote-management.service';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly quoteEmailService: QuoteEmailService,
    private readonly quoteManagementService: QuoteManagementService,
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
      await this.quoteEmailService.sendQuoteNotificationEmail(
        createQuoteDto,
        quote.id,
      );

      // Envoyer l'email de confirmation au client
      await this.quoteEmailService.sendQuoteConfirmationEmail(
        createQuoteDto,
        quote.id,
      );

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

  // Méthodes additionnelles pour la gestion des devis

  async findAll(page = 1, limit = 10, status?: string) {
    return this.quoteManagementService.findAll(page, limit, status);
  }

  async findOne(id: string) {
    return this.quoteManagementService.findOne(id);
  }

  async updateStatus(id: string, status: string, data?: any) {
    const updatedQuote = await this.quoteManagementService.updateStatus(
      id,
      status,
      data,
    );

    // Envoyer les emails appropriés selon le statut
    if (status === 'ACCEPTED') {
      await this.quoteEmailService.sendQuoteAcceptedEmail(updatedQuote);
    } else if (status === 'REJECTED') {
      await this.quoteEmailService.sendQuoteRejectedEmail(
        updatedQuote,
        data?.rejectionReason,
      );
    }

    return updatedQuote;
  }

  async getStats() {
    return this.quoteManagementService.getStats();
  }

  async findAllWithFilters(page = 1, limit = 10, filters: any) {
    return this.quoteManagementService.findAllWithFilters(page, limit, filters);
  }

  async updateQuote(id: string, updateQuoteDto: any) {
    return this.quoteManagementService.updateQuote(id, updateQuoteDto);
  }

  // Méthodes spécifiques pour accepter et rejeter les devis
  async acceptQuote(
    id: string,
    data?: { document?: string; validUntil?: string },
  ) {
    const updatedQuote = await this.quoteManagementService.acceptQuote(
      id,
      data,
    );

    // Envoyer l'email d'acceptation
    await this.quoteEmailService.sendQuoteAcceptedEmail(updatedQuote);

    return updatedQuote;
  }

  async rejectQuote(id: string, rejectionReason: string) {
    const updatedQuote = await this.quoteManagementService.rejectQuote(
      id,
      rejectionReason,
    );

    // Envoyer l'email de rejet
    await this.quoteEmailService.sendQuoteRejectedEmail(
      updatedQuote,
      rejectionReason,
    );

    return updatedQuote;
  }
}
