import { Test, TestingModule } from '@nestjs/testing';
import { QuoteManagementService } from '../../src/quotes/quote-management.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UpdateQuoteDto } from '../../src/quotes/dto/update-quote.dto';
import { QuoteFilterDto } from '../../src/quotes/dto/quote-filter.dto';

describe('QuoteManagementService', () => {
  let service: QuoteManagementService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockContact = {
    id: 'contact-123',
    email: 'jean.dupont@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '+590690123456',
    consentAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEmailLogs = [
    {
      id: 'email-123',
      sentAt: new Date(),
      appointmentId: null,
      quoteId: 'quote-123',
      to: 'jean.dupont@example.com',
      subject: 'Confirmation de devis',
      template: 'quote_confirmation',
      meta: {},
    },
  ];

  const mockQuote = {
    id: 'quote-123',
    projectDescription: 'Installation complète de portail automatique',
    acceptPhone: true,
    acceptTerms: true,
    status: 'PENDING' as const,
    quoteValidUntil: new Date(),
    quoteDocument: null,
    rejectionReason: null,
    processedAt: null,
    sentAt: null,
    respondedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    contactId: 'contact-123',
    contact: mockContact,
    emailLogs: mockEmailLogs,
  };

  const mockUpdateQuoteDto: UpdateQuoteDto = {
    status: 'PROCESSING',
    quoteValidUntil: '2024-12-31',
  };

  const mockQuoteFilterDto: QuoteFilterDto = {
    page: '1',
    limit: '10',
    status: 'PENDING',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuoteManagementService,
        {
          provide: PrismaService,
          useValue: {
            quote: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<QuoteManagementService>(QuoteManagementService);
    prismaService = module.get(PrismaService);

    // Mock the Prisma methods properly
    jest.mocked(prismaService.quote.findMany).mockResolvedValue([]);
    jest.mocked(prismaService.quote.findUnique).mockResolvedValue(null);
    jest.mocked(prismaService.quote.count).mockResolvedValue(0);
    jest.mocked(prismaService.quote.update).mockResolvedValue({} as any);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('devrait retourner tous les devis avec pagination', async () => {
      // Arrange
      const expectedResult = {
        data: [mockQuote],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
      jest.mocked(prismaService.quote.findMany).mockResolvedValue([mockQuote]);
      jest.mocked(prismaService.quote.count).mockResolvedValue(1);

      // Act
      const result = await service.findAll(1, 10);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(prismaService.quote.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          contact: true,
          emailLogs: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(prismaService.quote.count).toHaveBeenCalledWith({ where: {} });
    });

    it('devrait filtrer par statut quand fourni', async () => {
      // Arrange
      const expectedResult = {
        data: [mockQuote],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
      jest.mocked(prismaService.quote.findMany).mockResolvedValue([mockQuote]);
      jest.mocked(prismaService.quote.count).mockResolvedValue(1);

      // Act
      const result = await service.findAll(1, 10, 'PENDING');

      // Assert
      expect(result).toEqual(expectedResult);
      expect(prismaService.quote.findMany).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
        include: {
          contact: true,
          emailLogs: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(prismaService.quote.count).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
      });
    });

    it('devrait utiliser la pagination par défaut', async () => {
      // Arrange
      jest.mocked(prismaService.quote.findMany).mockResolvedValue([]);
      jest.mocked(prismaService.quote.count).mockResolvedValue(0);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(prismaService.quote.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          contact: true,
          emailLogs: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findOne', () => {
    it('devrait retourner un devis par id', async () => {
      // Arrange
      jest.mocked(prismaService.quote.findUnique).mockResolvedValue(mockQuote);

      // Act
      const result = await service.findOne('quote-123');

      // Assert
      expect(result).toEqual(mockQuote);
      expect(prismaService.quote.findUnique).toHaveBeenCalledWith({
        where: { id: 'quote-123' },
        include: {
          contact: true,
          emailLogs: {
            orderBy: { sentAt: 'desc' },
          },
        },
      });
    });

    it("devrait retourner null si le devis n'existe pas", async () => {
      // Arrange
      jest.mocked(prismaService.quote.findUnique).mockResolvedValue(null);

      // Act
      const result = await service.findOne('non-existent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('devrait mettre à jour le statut vers PROCESSING', async () => {
      // Arrange
      const updatedQuote = { ...mockQuote, status: 'PROCESSING' as const };
      jest.mocked(prismaService.quote.update).mockResolvedValue(updatedQuote);

      // Act
      const result = await service.updateStatus('quote-123', 'PROCESSING');

      // Assert
      expect(result).toEqual(updatedQuote);
      expect(prismaService.quote.update).toHaveBeenCalledWith({
        where: { id: 'quote-123' },
        data: {
          status: 'PROCESSING',
          processedAt: expect.any(Date),
        },
        include: {
          contact: true,
        },
      });
    });

    it('devrait mettre à jour le statut vers SENT avec données supplémentaires', async () => {
      // Arrange
      const updatedQuote = { ...mockQuote, status: 'SENT' as const };
      const data = { validUntil: '2024-12-31', document: 'quote.pdf' };
      jest.mocked(prismaService.quote.update).mockResolvedValue(updatedQuote);

      // Act
      const result = await service.updateStatus('quote-123', 'SENT', data);

      // Assert
      expect(result).toEqual(updatedQuote);
      expect(prismaService.quote.update).toHaveBeenCalledWith({
        where: { id: 'quote-123' },
        data: {
          status: 'SENT',
          sentAt: expect.any(Date),
          quoteValidUntil: new Date('2024-12-31'),
          quoteDocument: 'quote.pdf',
        },
        include: {
          contact: true,
        },
      });
    });

    it('devrait mettre à jour le statut vers ACCEPTED', async () => {
      // Arrange
      const updatedQuote = { ...mockQuote, status: 'ACCEPTED' as const };
      jest.mocked(prismaService.quote.update).mockResolvedValue(updatedQuote);

      // Act
      const result = await service.updateStatus('quote-123', 'ACCEPTED');

      // Assert
      expect(result).toEqual(updatedQuote);
      expect(prismaService.quote.update).toHaveBeenCalledWith({
        where: { id: 'quote-123' },
        data: {
          status: 'ACCEPTED',
          respondedAt: expect.any(Date),
        },
        include: {
          contact: true,
        },
      });
    });

    it('devrait mettre à jour le statut vers REJECTED avec raison', async () => {
      // Arrange
      const updatedQuote = { ...mockQuote, status: 'REJECTED' as const };
      const data = { rejectionReason: 'Prix trop élevé' };
      jest.mocked(prismaService.quote.update).mockResolvedValue(updatedQuote);

      // Act
      const result = await service.updateStatus('quote-123', 'REJECTED', data);

      // Assert
      expect(result).toEqual(updatedQuote);
      expect(prismaService.quote.update).toHaveBeenCalledWith({
        where: { id: 'quote-123' },
        data: {
          status: 'REJECTED',
          respondedAt: expect.any(Date),
          rejectionReason: 'Prix trop élevé',
        },
        include: {
          contact: true,
        },
      });
    });
  });

  describe('getStats', () => {
    it('devrait retourner les statistiques complètes', async () => {
      // Arrange
      const expectedStats = {
        total: 10,
        pending: 5,
        processing: 2,
        sent: 1,
        accepted: 3,
        rejected: 2,
        conversionRate: '30.00',
      };
      jest
        .mocked(prismaService.quote.count)
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(2) // processing
        .mockResolvedValueOnce(1) // sent
        .mockResolvedValueOnce(3) // accepted
        .mockResolvedValueOnce(2); // rejected

      // Act
      const result = await service.getStats();

      // Assert
      expect(result).toEqual(expectedStats);
      expect(prismaService.quote.count).toHaveBeenCalledTimes(6);
    });

    it('devrait calculer le taux de conversion à 0% quand aucun devis', async () => {
      // Arrange
      const expectedStats = {
        total: 0,
        pending: 0,
        processing: 0,
        sent: 0,
        accepted: 0,
        rejected: 0,
        conversionRate: '0.00',
      };
      jest.mocked(prismaService.quote.count).mockResolvedValue(0);

      // Act
      const result = await service.getStats();

      // Assert
      expect(result).toEqual(expectedStats);
    });
  });

  describe('findAllWithFilters', () => {
    it('devrait retourner les devis avec filtres de base', async () => {
      // Arrange
      const expectedResult = {
        data: [mockQuote],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
      jest.mocked(prismaService.quote.findMany).mockResolvedValue([mockQuote]);
      jest.mocked(prismaService.quote.count).mockResolvedValue(1);

      // Act
      const result = await service.findAllWithFilters(
        1,
        10,
        mockQuoteFilterDto,
      );

      // Assert
      expect(result).toEqual(expectedResult);
      expect(prismaService.quote.findMany).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
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
        skip: 0,
        take: 10,
      });
    });

    it('devrait filtrer par contactId', async () => {
      // Arrange
      const filters = { contactId: 'contact-123' } as QuoteFilterDto;
      jest.mocked(prismaService.quote.findMany).mockResolvedValue([]);
      jest.mocked(prismaService.quote.count).mockResolvedValue(0);

      // Act
      const result = await service.findAllWithFilters(1, 10, filters);

      // Assert
      expect(prismaService.quote.findMany).toHaveBeenCalledWith({
        where: { contactId: 'contact-123' },
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
        skip: 0,
        take: 10,
      });
    });

    it('devrait rechercher par nom ou email du contact', async () => {
      // Arrange
      const filters = { search: 'Jean' } as QuoteFilterDto;
      jest.mocked(prismaService.quote.findMany).mockResolvedValue([]);
      jest.mocked(prismaService.quote.count).mockResolvedValue(0);

      // Act
      const result = await service.findAllWithFilters(1, 10, filters);

      // Assert
      expect(prismaService.quote.findMany).toHaveBeenCalledWith({
        where: {
          contact: {
            OR: [
              { firstName: { contains: 'Jean', mode: 'insensitive' } },
              { lastName: { contains: 'Jean', mode: 'insensitive' } },
              { email: { contains: 'Jean', mode: 'insensitive' } },
            ],
          },
        },
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
        skip: 0,
        take: 10,
      });
    });

    it('devrait combiner plusieurs filtres', async () => {
      // Arrange
      const filters = {
        status: 'PENDING',
        contactId: 'contact-123',
        search: 'Jean',
      } as QuoteFilterDto;
      jest.mocked(prismaService.quote.findMany).mockResolvedValue([]);
      jest.mocked(prismaService.quote.count).mockResolvedValue(0);

      // Act
      const result = await service.findAllWithFilters(1, 10, filters);

      // Assert
      expect(prismaService.quote.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
          contactId: 'contact-123',
          contact: {
            OR: [
              { firstName: { contains: 'Jean', mode: 'insensitive' } },
              { lastName: { contains: 'Jean', mode: 'insensitive' } },
              { email: { contains: 'Jean', mode: 'insensitive' } },
            ],
          },
        },
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
        skip: 0,
        take: 10,
      });
    });
  });

  describe('updateQuote', () => {
    it('devrait mettre à jour un devis avec succès', async () => {
      // Arrange
      const updatedQuote = { ...mockQuote, status: 'PROCESSING' as const };
      jest.mocked(prismaService.quote.update).mockResolvedValue(updatedQuote);

      // Act
      const result = await service.updateQuote('quote-123', mockUpdateQuoteDto);

      // Assert
      expect(result).toEqual(updatedQuote);
      expect(prismaService.quote.update).toHaveBeenCalledWith({
        where: { id: 'quote-123' },
        data: {
          ...mockUpdateQuoteDto,
          quoteValidUntil: new Date('2024-12-31'),
          processedAt: expect.any(Date),
        },
        include: {
          contact: true,
          emailLogs: {
            orderBy: { sentAt: 'desc' },
          },
        },
      });
    });

    it('devrait valider les champs obligatoires pour le statut SENT', async () => {
      // Arrange
      const sentDto = {
        status: 'SENT',
        quoteValidUntil: '2024-12-31',
        quoteDocument: 'quote.pdf',
      } as UpdateQuoteDto;

      // Act & Assert
      await expect(
        service.updateQuote('quote-123', sentDto),
      ).resolves.not.toThrow();
    });

    it('devrait lever une erreur pour le statut SENT sans date de validité', async () => {
      // Arrange
      const invalidDto = {
        status: 'SENT',
        quoteDocument: 'quote.pdf',
      } as UpdateQuoteDto;

      // Act & Assert
      await expect(
        service.updateQuote('quote-123', invalidDto),
      ).rejects.toThrow(
        'Pour marquer un devis comme "Envoyé", une date de validité ET un document sont obligatoires.',
      );
    });

    it('devrait lever une erreur pour le statut SENT sans document', async () => {
      // Arrange
      const invalidDto = {
        status: 'SENT',
        quoteValidUntil: '2024-12-31',
      } as UpdateQuoteDto;

      // Act & Assert
      await expect(
        service.updateQuote('quote-123', invalidDto),
      ).rejects.toThrow(
        'Pour marquer un devis comme "Envoyé", une date de validité ET un document sont obligatoires.',
      );
    });

    it('devrait mettre à jour les timestamps selon le statut', async () => {
      // Arrange
      const sentDto = {
        status: 'SENT',
        quoteValidUntil: '2024-12-31',
        quoteDocument: 'quote.pdf',
      } as UpdateQuoteDto;
      const updatedQuote = { ...mockQuote, status: 'SENT' as const };
      jest.mocked(prismaService.quote.update).mockResolvedValue(updatedQuote);

      // Act
      const result = await service.updateQuote('quote-123', sentDto);

      // Assert
      expect(prismaService.quote.update).toHaveBeenCalledWith({
        where: { id: 'quote-123' },
        data: {
          ...sentDto,
          quoteValidUntil: new Date('2024-12-31'),
          sentAt: expect.any(Date),
        },
        include: {
          contact: true,
          emailLogs: {
            orderBy: { sentAt: 'desc' },
          },
        },
      });
    });
  });

  describe('acceptQuote', () => {
    it('devrait accepter un devis avec succès', async () => {
      // Arrange
      const acceptedQuote = { ...mockQuote, status: 'ACCEPTED' as const };
      const acceptData = { document: 'contract.pdf', validUntil: '2024-12-31' };
      jest.mocked(prismaService.quote.update).mockResolvedValue(acceptedQuote);

      // Act
      const result = await service.acceptQuote('quote-123', acceptData);

      // Assert
      expect(result).toEqual(acceptedQuote);
      expect(prismaService.quote.update).toHaveBeenCalledWith({
        where: { id: 'quote-123' },
        data: {
          status: 'ACCEPTED',
          respondedAt: expect.any(Date),
          quoteDocument: 'contract.pdf',
          quoteValidUntil: new Date('2024-12-31'),
        },
        include: {
          contact: true,
        },
      });
    });

    it('devrait accepter un devis sans données supplémentaires', async () => {
      // Arrange
      const acceptedQuote = { ...mockQuote, status: 'ACCEPTED' as const };
      jest.mocked(prismaService.quote.update).mockResolvedValue(acceptedQuote);

      // Act
      const result = await service.acceptQuote('quote-123');

      // Assert
      expect(result).toEqual(acceptedQuote);
      expect(prismaService.quote.update).toHaveBeenCalledWith({
        where: { id: 'quote-123' },
        data: {
          status: 'ACCEPTED',
          respondedAt: expect.any(Date),
        },
        include: {
          contact: true,
        },
      });
    });
  });

  describe('rejectQuote', () => {
    it('devrait rejeter un devis avec succès', async () => {
      // Arrange
      const rejectedQuote = { ...mockQuote, status: 'REJECTED' as const };
      jest.mocked(prismaService.quote.update).mockResolvedValue(rejectedQuote);

      // Act
      const result = await service.rejectQuote('quote-123', 'Prix trop élevé');

      // Assert
      expect(result).toEqual(rejectedQuote);
      expect(prismaService.quote.update).toHaveBeenCalledWith({
        where: { id: 'quote-123' },
        data: {
          status: 'REJECTED',
          rejectionReason: 'Prix trop élevé',
          respondedAt: expect.any(Date),
        },
        include: {
          contact: true,
        },
      });
    });

    it('devrait rejeter un devis avec une raison vide', async () => {
      // Arrange
      const rejectedQuote = { ...mockQuote, status: 'REJECTED' as const };
      jest.mocked(prismaService.quote.update).mockResolvedValue(rejectedQuote);

      // Act
      const result = await service.rejectQuote('quote-123', '');

      // Assert
      expect(result).toEqual(rejectedQuote);
      expect(prismaService.quote.update).toHaveBeenCalledWith({
        where: { id: 'quote-123' },
        data: {
          status: 'REJECTED',
          rejectionReason: '',
          respondedAt: expect.any(Date),
        },
        include: {
          contact: true,
        },
      });
    });
  });
});
