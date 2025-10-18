import { Test, TestingModule } from '@nestjs/testing';
import { QuotesService } from '../../src/quotes/quotes.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { QuoteEmailService } from '../../src/quotes/quote-email.service';
import { QuoteManagementService } from '../../src/quotes/quote-management.service';

describe('QuotesService', () => {
  let service: QuotesService;
  let prisma: PrismaService;
  let quoteEmailService: QuoteEmailService;
  let quoteManagementService: QuoteManagementService;

  const mockContact = {
    id: 'contact-123',
    email: 'client@test.com',
    firstName: 'Marie',
    lastName: 'Martin',
    phone: '+590690654321',
    consent: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQuote = {
    id: 'quote-123',
    contactId: 'contact-123',
    projectDescription: 'Installation portail automatique avec vidéophone',
    acceptPhone: true,
    acceptTerms: true,
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    contact: mockContact,
  };

  const mockPrismaService = {
    contact: {
      upsert: jest.fn().mockResolvedValue(mockContact),
    },
    quote: {
      create: jest.fn().mockResolvedValue(mockQuote),
      findUnique: jest.fn().mockResolvedValue(mockQuote),
      update: jest.fn().mockResolvedValue({ ...mockQuote, status: 'ACCEPTED' }),
    },
  };

  const mockQuoteEmailService = {
    sendQuoteNotificationEmail: jest.fn().mockResolvedValue(undefined),
    sendQuoteConfirmationEmail: jest.fn().mockResolvedValue(undefined),
    sendQuoteAcceptedEmail: jest.fn().mockResolvedValue(undefined),
    sendQuoteRejectedEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockQuoteManagementService = {
    findAll: jest.fn().mockResolvedValue([mockQuote]),
    findOne: jest.fn().mockResolvedValue(mockQuote),
    updateStatus: jest
      .fn()
      .mockResolvedValue({ ...mockQuote, status: 'ACCEPTED' }),
    getStats: jest
      .fn()
      .mockResolvedValue({ total: 10, pending: 5, accepted: 3, rejected: 2 }),
    findAllWithFilters: jest.fn().mockResolvedValue([mockQuote]),
    updateQuote: jest.fn().mockResolvedValue(mockQuote),
    acceptQuote: jest
      .fn()
      .mockResolvedValue({ ...mockQuote, status: 'ACCEPTED' }),
    rejectQuote: jest
      .fn()
      .mockResolvedValue({ ...mockQuote, status: 'REJECTED' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: QuoteEmailService,
          useValue: mockQuoteEmailService,
        },
        {
          provide: QuoteManagementService,
          useValue: mockQuoteManagementService,
        },
      ],
    }).compile();

    service = module.get<QuotesService>(QuotesService);
    prisma = module.get<PrismaService>(PrismaService);
    quoteEmailService = module.get<QuoteEmailService>(QuoteEmailService);
    quoteManagementService = module.get<QuoteManagementService>(
      QuoteManagementService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('TU05 - create()', () => {
    it('devrait créer un devis complet avec toutes les données', async () => {
      // Arrange
      const createQuoteDto = {
        email: 'client@test.com',
        firstName: 'Marie',
        lastName: 'Martin',
        phone: '+590690654321',
        message: 'Installation portail automatique avec vidéophone',
        acceptPhone: true,
        acceptTerms: true,
      };

      // Act
      const result = await service.create(createQuoteDto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.id).toBe('quote-123');
      expect(mockPrismaService.contact.upsert).toHaveBeenCalledWith({
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
      expect(mockPrismaService.quote.create).toHaveBeenCalledWith({
        data: {
          contactId: mockContact.id,
          projectDescription: createQuoteDto.message,
          acceptPhone: createQuoteDto.acceptPhone,
          acceptTerms: createQuoteDto.acceptTerms,
          status: 'PENDING',
        },
      });
    });

    it('devrait envoyer les emails de notification et confirmation', async () => {
      // Arrange
      const createQuoteDto = {
        email: 'client@test.com',
        firstName: 'Marie',
        lastName: 'Martin',
        phone: '+590690654321',
        message: 'Installation portail automatique',
        acceptPhone: true,
        acceptTerms: true,
      };

      // Act
      await service.create(createQuoteDto);

      // Assert
      expect(quoteEmailService.sendQuoteNotificationEmail).toHaveBeenCalledWith(
        createQuoteDto,
        'quote-123',
      );
      expect(quoteEmailService.sendQuoteConfirmationEmail).toHaveBeenCalledWith(
        createQuoteDto,
        'quote-123',
      );
    });

    it('devrait créer ou mettre à jour le contact existant', async () => {
      // Arrange
      const createQuoteDto = {
        email: 'existing@test.com',
        firstName: 'Pierre',
        lastName: 'Durand',
        phone: '+590690111222',
        message: 'Réparation urgente',
        acceptPhone: true,
        acceptTerms: true,
      };

      // Act
      await service.create(createQuoteDto);

      // Assert
      expect(mockPrismaService.contact.upsert).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs lors de la création', async () => {
      // Arrange
      const createQuoteDto = {
        email: 'error@test.com',
        firstName: 'Error',
        lastName: 'Test',
        phone: '+590690000000',
        message: 'Test error',
        acceptPhone: true,
        acceptTerms: true,
      };

      const error = new Error('Database connection failed');
      mockPrismaService.contact.upsert.mockRejectedValue(error);

      // Act & Assert
      await expect(service.create(createQuoteDto)).rejects.toThrow(error);
    });
  });

  describe('TU06 - updateStatus()', () => {
    it("devrait changer le statut d'un devis à ACCEPTED", async () => {
      // Arrange
      const quoteId = 'quote-123';
      const updatedQuote = { ...mockQuote, status: 'ACCEPTED' };
      mockQuoteManagementService.updateStatus.mockResolvedValue(updatedQuote);

      // Act
      const result = await service.updateStatus(quoteId, 'ACCEPTED');

      // Assert
      expect(result.status).toBe('ACCEPTED');
      expect(quoteManagementService.updateStatus).toHaveBeenCalledWith(
        quoteId,
        'ACCEPTED',
        undefined,
      );
      expect(quoteEmailService.sendQuoteAcceptedEmail).toHaveBeenCalledWith(
        updatedQuote,
      );
    });

    it("devrait changer le statut d'un devis à REJECTED avec raison", async () => {
      // Arrange
      const quoteId = 'quote-123';
      const rejectionReason = 'Projet trop complexe pour nos services';
      const updatedQuote = {
        ...mockQuote,
        status: 'REJECTED',
        rejectionReason,
      };
      mockQuoteManagementService.updateStatus.mockResolvedValue(updatedQuote);

      // Act
      const result = await service.updateStatus(quoteId, 'REJECTED', {
        rejectionReason,
      });

      // Assert
      expect(result.status).toBe('REJECTED');
      expect(quoteEmailService.sendQuoteRejectedEmail).toHaveBeenCalledWith(
        updatedQuote,
        rejectionReason,
      );
    });

    it("devrait envoyer l'email approprié selon le statut", async () => {
      // Arrange
      const quoteId = 'quote-123';
      const acceptedQuote = { ...mockQuote, status: 'ACCEPTED' };
      mockQuoteManagementService.updateStatus.mockResolvedValue(acceptedQuote);

      // Act
      await service.updateStatus(quoteId, 'ACCEPTED');

      // Assert
      expect(quoteEmailService.sendQuoteAcceptedEmail).toHaveBeenCalledWith(
        acceptedQuote,
      );
      expect(quoteEmailService.sendQuoteRejectedEmail).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('devrait récupérer tous les devis avec pagination', async () => {
      // Act
      const result = await service.findAll(1, 10);

      // Assert
      expect(result).toEqual([mockQuote]);
      expect(quoteManagementService.findAll).toHaveBeenCalledWith(
        1,
        10,
        undefined,
      );
    });

    it('devrait récupérer les devis avec filtre de statut', async () => {
      // Act
      const result = await service.findAll(1, 10, 'PENDING');

      // Assert
      expect(result).toEqual([mockQuote]);
      expect(quoteManagementService.findAll).toHaveBeenCalledWith(
        1,
        10,
        'PENDING',
      );
    });
  });

  describe('findOne', () => {
    it('devrait récupérer un devis par ID', async () => {
      // Act
      const result = await service.findOne('quote-123');

      // Assert
      expect(result).toEqual(mockQuote);
      expect(quoteManagementService.findOne).toHaveBeenCalledWith('quote-123');
    });
  });

  describe('acceptQuote', () => {
    it("devrait accepter un devis et envoyer l'email", async () => {
      // Arrange
      const acceptedQuote = { ...mockQuote, status: 'ACCEPTED' };
      mockQuoteManagementService.acceptQuote.mockResolvedValue(acceptedQuote);

      // Act
      const result = await service.acceptQuote('quote-123');

      // Assert
      expect(result.status).toBe('ACCEPTED');
      expect(quoteEmailService.sendQuoteAcceptedEmail).toHaveBeenCalledWith(
        acceptedQuote,
      );
    });
  });

  describe('rejectQuote', () => {
    it("devrait rejeter un devis avec une raison et envoyer l'email", async () => {
      // Arrange
      const rejectionReason = 'Délai trop court';
      const rejectedQuote = {
        ...mockQuote,
        status: 'REJECTED',
        rejectionReason,
      };
      mockQuoteManagementService.rejectQuote.mockResolvedValue(rejectedQuote);

      // Act
      const result = await service.rejectQuote('quote-123', rejectionReason);

      // Assert
      expect(result.status).toBe('REJECTED');
      expect(quoteEmailService.sendQuoteRejectedEmail).toHaveBeenCalledWith(
        rejectedQuote,
        rejectionReason,
      );
    });
  });

  describe('getStats', () => {
    it('devrait récupérer les statistiques des devis', async () => {
      // Act
      const result = await service.getStats();

      // Assert
      expect(result).toEqual({
        total: 10,
        pending: 5,
        accepted: 3,
        rejected: 2,
      });
      expect(quoteManagementService.getStats).toHaveBeenCalled();
    });
  });

  describe('updateQuote', () => {
    it('devrait mettre à jour un devis', async () => {
      // Arrange
      const updateData = {
        projectDescription: 'Nouvelle description',
        acceptPhone: false,
      };
      const updatedQuote = { ...mockQuote, ...updateData };
      mockQuoteManagementService.updateQuote.mockResolvedValue(updatedQuote);

      // Act
      const result = await service.updateQuote('quote-123', updateData);

      // Assert
      expect(result).toEqual(updatedQuote);
      expect(quoteManagementService.updateQuote).toHaveBeenCalledWith(
        'quote-123',
        updateData,
      );
    });
  });

  describe('findAll', () => {
    it('devrait récupérer tous les devis avec pagination par défaut', async () => {
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
      mockQuoteManagementService.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(expectedResult);
      expect(quoteManagementService.findAll).toHaveBeenCalledWith(
        1,
        10,
        undefined,
      );
    });

    it('devrait récupérer les devis avec pagination personnalisée', async () => {
      // Arrange
      const expectedResult = {
        data: [mockQuote],
        meta: {
          total: 1,
          page: 2,
          limit: 5,
          totalPages: 1,
        },
      };
      mockQuoteManagementService.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await service.findAll(2, 5);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(quoteManagementService.findAll).toHaveBeenCalledWith(
        2,
        5,
        undefined,
      );
    });

    it('devrait récupérer les devis avec filtre de statut', async () => {
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
      mockQuoteManagementService.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await service.findAll(1, 10, 'PENDING');

      // Assert
      expect(result).toEqual(expectedResult);
      expect(quoteManagementService.findAll).toHaveBeenCalledWith(
        1,
        10,
        'PENDING',
      );
    });
  });

  describe('findAllWithFilters', () => {
    it('devrait récupérer les devis avec filtres avancés', async () => {
      // Arrange
      const filters = {
        status: 'PENDING',
        contactId: 'contact-123',
        search: 'Jean',
      };
      const expectedResult = {
        data: [mockQuote],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
      mockQuoteManagementService.findAllWithFilters.mockResolvedValue(
        expectedResult,
      );

      // Act
      const result = await service.findAllWithFilters(1, 10, filters);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(quoteManagementService.findAllWithFilters).toHaveBeenCalledWith(
        1,
        10,
        filters,
      );
    });

    it('devrait récupérer les devis avec filtres et pagination par défaut', async () => {
      // Arrange
      const filters = { status: 'ACCEPTED' };
      const expectedResult = {
        data: [mockQuote],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
      mockQuoteManagementService.findAllWithFilters.mockResolvedValue(
        expectedResult,
      );

      // Act
      const result = await service.findAllWithFilters(
        undefined,
        undefined,
        filters,
      );

      // Assert
      expect(result).toEqual(expectedResult);
      expect(quoteManagementService.findAllWithFilters).toHaveBeenCalledWith(
        1,
        10,
        filters,
      );
    });
  });
});
