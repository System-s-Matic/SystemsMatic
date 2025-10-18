import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { QuotesController } from '../../src/quotes/quotes.controller';
import { QuotesService } from '../../src/quotes/quotes.service';
import { CreateQuoteDto } from '../../src/quotes/dto/create-quote.dto';
import { UpdateQuoteDto } from '../../src/quotes/dto/update-quote.dto';
import { QuoteFilterDto } from '../../src/quotes/dto/quote-filter.dto';

describe('QuotesController', () => {
  let controller: QuotesController;
  let quotesService: jest.Mocked<QuotesService>;

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

  const mockCreateQuoteDto: CreateQuoteDto = {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    phone: '+590690123456',
    message: 'Installation complète de portail automatique',
    acceptPhone: true,
    acceptTerms: true,
  };

  const mockUpdateQuoteDto: UpdateQuoteDto = {
    status: 'PROCESSING',
    quoteValidUntil: '2024-12-31',
  };

  const mockQuoteFilterDto: QuoteFilterDto = {
    page: '1',
    limit: '10',
    status: 'PENDING' as const,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuotesController],
      providers: [
        {
          provide: QuotesService,
          useValue: {
            create: jest.fn(),
            findAllWithFilters: jest.fn(),
            findOne: jest.fn(),
            updateQuote: jest.fn(),
            updateStatus: jest.fn(),
            acceptQuote: jest.fn(),
            rejectQuote: jest.fn(),
            getStats: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<QuotesController>(QuotesController);
    quotesService = module.get(QuotesService);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('devrait créer un devis avec succès', async () => {
      // Arrange
      const createResult = {
        success: true,
        message: 'Devis créé avec succès',
        id: 'quote-123',
      };
      quotesService.create.mockResolvedValue(createResult);

      // Act
      const result = await controller.create(mockCreateQuoteDto);

      // Assert
      expect(result).toEqual(createResult);
      expect(quotesService.create).toHaveBeenCalledWith(mockCreateQuoteDto);
    });

    it('devrait lever BAD_REQUEST quand acceptTerms est false', async () => {
      // Arrange
      const invalidDto = { ...mockCreateQuoteDto, acceptTerms: false };

      // Act & Assert
      await expect(controller.create(invalidDto)).rejects.toThrow(
        new HttpException(
          "L'acceptation des conditions générales est obligatoire",
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('devrait lever INTERNAL_SERVER_ERROR quand le service lève une non-HttpException', async () => {
      // Arrange
      quotesService.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(controller.create(mockCreateQuoteDto)).rejects.toThrow(
        new HttpException(
          'Une erreur est survenue lors du traitement de votre demande',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('devrait relancer HttpException du service', async () => {
      // Arrange
      const httpError = new HttpException(
        'Service error',
        HttpStatus.BAD_REQUEST,
      );
      quotesService.create.mockRejectedValue(httpError);

      // Act & Assert
      await expect(controller.create(mockCreateQuoteDto)).rejects.toThrow(
        httpError,
      );
    });
  });

  describe('findAll', () => {
    it('devrait retourner les devis avec filtres', async () => {
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
      quotesService.findAllWithFilters.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll(mockQuoteFilterDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(quotesService.findAllWithFilters).toHaveBeenCalledWith(
        1,
        10,
        mockQuoteFilterDto,
      );
    });

    it('devrait utiliser la pagination par défaut quand non fournie', async () => {
      // Arrange
      const filtersWithoutPagination = { status: 'PENDING' } as QuoteFilterDto;
      const expectedResult = {
        data: [mockQuote],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
      quotesService.findAllWithFilters.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll(filtersWithoutPagination);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(quotesService.findAllWithFilters).toHaveBeenCalledWith(
        1,
        10,
        filtersWithoutPagination,
      );
    });

    it('devrait lever INTERNAL_SERVER_ERROR quand le service échoue', async () => {
      // Arrange
      quotesService.findAllWithFilters.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(controller.findAll(mockQuoteFilterDto)).rejects.toThrow(
        new HttpException(
          'Erreur lors de la récupération des devis',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('getStats', () => {
    it('devrait retourner les statistiques', async () => {
      // Arrange
      const expectedStats = {
        total: 10,
        pending: 5,
        processing: 2,
        sent: 1,
        accepted: 3,
        rejected: 2,
        conversionRate: '30.00%',
      };
      quotesService.getStats.mockResolvedValue(expectedStats);

      // Act
      const result = await controller.getStats();

      // Assert
      expect(result).toEqual(expectedStats);
      expect(quotesService.getStats).toHaveBeenCalled();
    });

    it('devrait lever INTERNAL_SERVER_ERROR quand le service échoue', async () => {
      // Arrange
      quotesService.getStats.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(controller.getStats()).rejects.toThrow(
        new HttpException(
          'Erreur lors de la récupération des statistiques',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('findOne', () => {
    it('devrait retourner un devis par id', async () => {
      // Arrange
      quotesService.findOne.mockResolvedValue(mockQuote);

      // Act
      const result = await controller.findOne('quote-123');

      // Assert
      expect(result).toEqual(mockQuote);
      expect(quotesService.findOne).toHaveBeenCalledWith('quote-123');
    });

    it("devrait lever NOT_FOUND quand le devis n'existe pas", async () => {
      // Arrange
      quotesService.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.findOne('non-existent')).rejects.toThrow(
        new HttpException('Devis introuvable', HttpStatus.NOT_FOUND),
      );
    });

    it('devrait lever INTERNAL_SERVER_ERROR quand le service échoue', async () => {
      // Arrange
      quotesService.findOne.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(controller.findOne('quote-123')).rejects.toThrow(
        new HttpException(
          'Erreur lors de la récupération du devis',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('update', () => {
    it('devrait mettre à jour un devis avec succès', async () => {
      // Arrange
      const updatedQuote = { ...mockQuote, status: 'PROCESSING' as const };
      quotesService.findOne.mockResolvedValue(mockQuote);
      quotesService.updateQuote.mockResolvedValue(updatedQuote);

      // Act
      const result = await controller.update('quote-123', mockUpdateQuoteDto);

      // Assert
      expect(result).toEqual(updatedQuote);
      expect(quotesService.findOne).toHaveBeenCalledWith('quote-123');
      expect(quotesService.updateQuote).toHaveBeenCalledWith(
        'quote-123',
        mockUpdateQuoteDto,
      );
    });

    it("devrait lever NOT_FOUND quand le devis n'existe pas", async () => {
      // Arrange
      quotesService.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        controller.update('non-existent', mockUpdateQuoteDto),
      ).rejects.toThrow(
        new HttpException('Devis introuvable', HttpStatus.NOT_FOUND),
      );
    });

    it('devrait lever INTERNAL_SERVER_ERROR quand le service échoue', async () => {
      // Arrange
      quotesService.findOne.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        controller.update('quote-123', mockUpdateQuoteDto),
      ).rejects.toThrow(
        new HttpException(
          'Erreur lors de la mise à jour du devis',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('updateStatus', () => {
    it('devrait mettre à jour le statut du devis avec succès', async () => {
      // Arrange
      const statusBody = { status: 'PROCESSING', data: { notes: 'En cours' } };
      const updatedQuote = { ...mockQuote, status: 'PROCESSING' as const };
      quotesService.findOne.mockResolvedValue(mockQuote);
      quotesService.updateStatus.mockResolvedValue(updatedQuote);

      // Act
      const result = await controller.updateStatus('quote-123', statusBody);

      // Assert
      expect(result).toEqual(updatedQuote);
      expect(quotesService.findOne).toHaveBeenCalledWith('quote-123');
      expect(quotesService.updateStatus).toHaveBeenCalledWith(
        'quote-123',
        'PROCESSING',
        { notes: 'En cours' },
      );
    });

    it("devrait lever NOT_FOUND quand le devis n'existe pas", async () => {
      // Arrange
      quotesService.findOne.mockResolvedValue(null);
      const statusBody = { status: 'PROCESSING' };

      // Act & Assert
      await expect(
        controller.updateStatus('non-existent', statusBody),
      ).rejects.toThrow(
        new HttpException('Devis introuvable', HttpStatus.NOT_FOUND),
      );
    });

    it('devrait lever INTERNAL_SERVER_ERROR quand le service échoue', async () => {
      // Arrange
      quotesService.findOne.mockRejectedValue(new Error('Database error'));
      const statusBody = { status: 'PROCESSING' };

      // Act & Assert
      await expect(
        controller.updateStatus('quote-123', statusBody),
      ).rejects.toThrow(
        new HttpException(
          'Erreur lors de la mise à jour du statut',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('acceptQuote', () => {
    it('devrait accepter un devis en attente avec succès', async () => {
      // Arrange
      const pendingQuote = { ...mockQuote, status: 'PENDING' as const };
      const acceptBody = { document: 'contract.pdf', validUntil: '2024-12-31' };
      const acceptedQuote = { ...pendingQuote, status: 'ACCEPTED' as const };
      quotesService.findOne.mockResolvedValue(pendingQuote);
      quotesService.acceptQuote.mockResolvedValue(acceptedQuote);

      // Act
      const result = await controller.acceptQuote('quote-123', acceptBody);

      // Assert
      expect(result).toEqual(acceptedQuote);
      expect(quotesService.findOne).toHaveBeenCalledWith('quote-123');
      expect(quotesService.acceptQuote).toHaveBeenCalledWith(
        'quote-123',
        acceptBody,
      );
    });

    it('devrait accepter un devis en cours de traitement avec succès', async () => {
      // Arrange
      const processingQuote = { ...mockQuote, status: 'PROCESSING' as const };
      const acceptBody = { document: 'contract.pdf' };
      const acceptedQuote = { ...processingQuote, status: 'ACCEPTED' as const };
      quotesService.findOne.mockResolvedValue(processingQuote);
      quotesService.acceptQuote.mockResolvedValue(acceptedQuote);

      // Act
      const result = await controller.acceptQuote('quote-123', acceptBody);

      // Assert
      expect(result).toEqual(acceptedQuote);
      expect(quotesService.acceptQuote).toHaveBeenCalledWith(
        'quote-123',
        acceptBody,
      );
    });

    it("devrait lever NOT_FOUND quand le devis n'existe pas", async () => {
      // Arrange
      quotesService.findOne.mockResolvedValue(null);
      const acceptBody = { document: 'contract.pdf' };

      // Act & Assert
      await expect(
        controller.acceptQuote('non-existent', acceptBody),
      ).rejects.toThrow(
        new HttpException('Devis introuvable', HttpStatus.NOT_FOUND),
      );
    });

    it("devrait lever BAD_REQUEST quand le devis n'est pas dans un statut valide", async () => {
      // Arrange
      const acceptedQuote = { ...mockQuote, status: 'ACCEPTED' as const };
      quotesService.findOne.mockResolvedValue(acceptedQuote);
      const acceptBody = { document: 'contract.pdf' };

      // Act & Assert
      await expect(
        controller.acceptQuote('quote-123', acceptBody),
      ).rejects.toThrow(
        new HttpException(
          'Seuls les devis en attente ou en cours de traitement peuvent être acceptés',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('devrait lever INTERNAL_SERVER_ERROR quand le service échoue', async () => {
      // Arrange
      quotesService.findOne.mockRejectedValue(new Error('Database error'));
      const acceptBody = { document: 'contract.pdf' };

      // Act & Assert
      await expect(
        controller.acceptQuote('quote-123', acceptBody),
      ).rejects.toThrow(
        new HttpException(
          "Erreur lors de l'acceptation du devis",
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('rejectQuote', () => {
    it('devrait rejeter un devis en attente avec succès', async () => {
      // Arrange
      const pendingQuote = { ...mockQuote, status: 'PENDING' as const };
      const rejectBody = { rejectionReason: 'Prix trop élevé' };
      const rejectedQuote = { ...pendingQuote, status: 'REJECTED' as const };
      quotesService.findOne.mockResolvedValue(pendingQuote);
      quotesService.rejectQuote.mockResolvedValue(rejectedQuote);

      // Act
      const result = await controller.rejectQuote('quote-123', rejectBody);

      // Assert
      expect(result).toEqual(rejectedQuote);
      expect(quotesService.findOne).toHaveBeenCalledWith('quote-123');
      expect(quotesService.rejectQuote).toHaveBeenCalledWith(
        'quote-123',
        'Prix trop élevé',
      );
    });

    it('devrait rejeter un devis en cours de traitement avec succès', async () => {
      // Arrange
      const processingQuote = { ...mockQuote, status: 'PROCESSING' as const };
      const rejectBody = { rejectionReason: 'Client non intéressé' };
      const rejectedQuote = { ...processingQuote, status: 'REJECTED' as const };
      quotesService.findOne.mockResolvedValue(processingQuote);
      quotesService.rejectQuote.mockResolvedValue(rejectedQuote);

      // Act
      const result = await controller.rejectQuote('quote-123', rejectBody);

      // Assert
      expect(result).toEqual(rejectedQuote);
      expect(quotesService.rejectQuote).toHaveBeenCalledWith(
        'quote-123',
        'Client non intéressé',
      );
    });

    it("devrait lever NOT_FOUND quand le devis n'existe pas", async () => {
      // Arrange
      quotesService.findOne.mockResolvedValue(null);
      const rejectBody = { rejectionReason: 'Prix trop élevé' };

      // Act & Assert
      await expect(
        controller.rejectQuote('non-existent', rejectBody),
      ).rejects.toThrow(
        new HttpException('Devis introuvable', HttpStatus.NOT_FOUND),
      );
    });

    it("devrait lever BAD_REQUEST quand le devis n'est pas dans un statut valide", async () => {
      // Arrange
      const acceptedQuote = { ...mockQuote, status: 'ACCEPTED' as const };
      quotesService.findOne.mockResolvedValue(acceptedQuote);
      const rejectBody = { rejectionReason: 'Prix trop élevé' };

      // Act & Assert
      await expect(
        controller.rejectQuote('quote-123', rejectBody),
      ).rejects.toThrow(
        new HttpException(
          'Seuls les devis en attente ou en cours de traitement peuvent être rejetés',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('devrait lever BAD_REQUEST quand la raison de refus est vide', async () => {
      // Arrange
      const pendingQuote = { ...mockQuote, status: 'PENDING' as const };
      quotesService.findOne.mockResolvedValue(pendingQuote);
      const rejectBody = { rejectionReason: '' };

      // Act & Assert
      await expect(
        controller.rejectQuote('quote-123', rejectBody),
      ).rejects.toThrow(
        new HttpException(
          'La raison du refus est obligatoire',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('devrait lever BAD_REQUEST quand la raison de refus ne contient que des espaces', async () => {
      // Arrange
      const pendingQuote = { ...mockQuote, status: 'PENDING' as const };
      quotesService.findOne.mockResolvedValue(pendingQuote);
      const rejectBody = { rejectionReason: '   ' };

      // Act & Assert
      await expect(
        controller.rejectQuote('quote-123', rejectBody),
      ).rejects.toThrow(
        new HttpException(
          'La raison du refus est obligatoire',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('devrait lever INTERNAL_SERVER_ERROR quand le service échoue', async () => {
      // Arrange
      quotesService.findOne.mockRejectedValue(new Error('Database error'));
      const rejectBody = { rejectionReason: 'Prix trop élevé' };

      // Act & Assert
      await expect(
        controller.rejectQuote('quote-123', rejectBody),
      ).rejects.toThrow(
        new HttpException(
          'Erreur lors du rejet du devis',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });
});
