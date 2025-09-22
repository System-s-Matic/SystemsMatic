import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteFilterDto } from './dto/quote-filter.dto';

@Injectable()
export class QuoteManagementService {
  private readonly logger = new Logger(QuoteManagementService.name);

  constructor(private readonly prisma: PrismaService) {}

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
        if (data?.rejectionReason) {
          updateData.rejectionReason = data.rejectionReason;
        }
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
    // Validation spéciale pour le statut "SENT"
    if (updateQuoteDto.status === 'SENT') {
      if (!updateQuoteDto.quoteValidUntil || !updateQuoteDto.quoteDocument) {
        throw new Error(
          'Pour marquer un devis comme "Envoyé", une date de validité ET un document sont obligatoires.',
        );
      }
    }

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

  // Méthodes spécifiques pour accepter et rejeter les devis
  async acceptQuote(
    id: string,
    data?: { document?: string; validUntil?: string },
  ) {
    const updateData: any = {
      status: 'ACCEPTED',
      respondedAt: new Date(),
    };

    if (data?.document) {
      updateData.quoteDocument = data.document;
    }
    if (data?.validUntil) {
      updateData.quoteValidUntil = new Date(data.validUntil);
    }

    return this.prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        contact: true,
      },
    });
  }

  async rejectQuote(id: string, rejectionReason: string) {
    return this.prisma.quote.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason,
        respondedAt: new Date(),
      },
      include: {
        contact: true,
      },
    });
  }
}
