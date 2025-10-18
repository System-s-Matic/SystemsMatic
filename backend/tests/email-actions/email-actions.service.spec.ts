import { Test, TestingModule } from '@nestjs/testing';
import { EmailActionsService } from '../../src/email-actions/email-actions.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AppointmentsService } from '../../src/appointments/appointments.service';
import { QuotesService } from '../../src/quotes/quotes.service';
import { MailService } from '../../src/mail/mail.service';
import { BadRequestException } from '@nestjs/common';

describe('EmailActionsService', () => {
  let service: EmailActionsService;
  let prismaService: jest.Mocked<PrismaService>;
  let appointmentsService: jest.Mocked<AppointmentsService>;
  let quotesService: jest.Mocked<QuotesService>;
  let mailService: jest.Mocked<MailService>;

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

  const mockAppointment = {
    id: 'appointment-123',
    contactId: 'contact-123',
    requestedAt: new Date(),
    status: 'PENDING' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    contact: mockContact,
  };

  const mockQuote = {
    id: 'quote-123',
    contactId: 'contact-123',
    projectDescription: 'Installation portail automatique',
    status: 'PENDING' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    contact: mockContact,
  };

  const mockToken = {
    id: 'token-123',
    token: 'valid-token-123',
    type: 'appointment',
    entityId: 'appointment-123',
    action: 'accept',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    isUsed: false,
    usedAt: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailActionsService,
        {
          provide: PrismaService,
          useValue: {
            emailActionToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            appointment: {
              findUnique: jest.fn(),
            },
            quote: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: AppointmentsService,
          useValue: {
            acceptAppointment: jest.fn(),
            rejectAppointment: jest.fn(),
            proposeReschedule: jest.fn(),
            updateStatusAdmin: jest.fn(),
            proposeRescheduleAdmin: jest.fn(),
            findOne: jest.fn(),
          } as any,
        },
        {
          provide: QuotesService,
          useValue: {
            acceptQuote: jest.fn(),
            rejectQuote: jest.fn(),
            findOne: jest.fn(),
          } as any,
        },
        {
          provide: MailService,
          useValue: {
            sendEmail: jest.fn(),
            sendQuoteAccepted: jest.fn(),
            sendQuoteRejected: jest.fn(),
            sendAppointmentConfirmation: jest.fn(),
            sendAppointmentCancelled: jest.fn(),
          } as any,
        },
      ],
    }).compile();

    service = module.get<EmailActionsService>(EmailActionsService);
    prismaService = module.get(PrismaService);
    appointmentsService = module.get(AppointmentsService);
    quotesService = module.get(QuotesService);
    mailService = module.get(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('createActionToken', () => {
    it("devrait créer un token d'action avec succès", async () => {
      // Arrange
      const type = 'appointment';
      const entityId = 'appointment-123';
      const action = 'accept';
      const expiresInHours = 24;

      jest
        .mocked(prismaService.emailActionToken.create)
        .mockResolvedValue(mockToken as any);

      // Act
      const result = await service.createActionToken(
        type,
        entityId,
        action,
        expiresInHours,
      );

      // Assert
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(prismaService.emailActionToken.create).toHaveBeenCalledWith({
        data: {
          token: expect.any(String),
          type,
          entityId,
          action,
          expiresAt: expect.any(Date),
          isUsed: false,
        },
      });
    });

    it('devrait créer un token avec expiration par défaut', async () => {
      // Arrange
      const type = 'quote';
      const entityId = 'quote-123';
      const action = 'reject';

      jest
        .mocked(prismaService.emailActionToken.create)
        .mockResolvedValue(mockToken as any);

      // Act
      const result = await service.createActionToken(type, entityId, action);

      // Assert
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(prismaService.emailActionToken.create).toHaveBeenCalledWith({
        data: {
          token: expect.any(String),
          type,
          entityId,
          action,
          expiresAt: expect.any(Date),
          isUsed: false,
        },
      });
    });
  });

  describe('verifyToken', () => {
    it('devrait vérifier un token valide', async () => {
      // Arrange
      const token = 'valid-token-123';
      jest
        .mocked(prismaService.emailActionToken.findUnique)
        .mockResolvedValue(mockToken as any);

      // Act
      const result = await service.verifyToken(token);

      // Assert
      expect(result).toEqual({
        valid: true,
        type: mockToken.type,
        action: mockToken.action,
      });
      expect(prismaService.emailActionToken.findUnique).toHaveBeenCalledWith({
        where: { token },
      });
    });

    it('devrait retourner invalide pour un token inexistant', async () => {
      // Arrange
      const token = 'invalid-token';
      jest
        .mocked(prismaService.emailActionToken.findUnique)
        .mockResolvedValue(null);

      // Act
      const result = await service.verifyToken(token);

      // Assert
      expect(result).toEqual({
        valid: false,
      });
    });

    it('devrait retourner invalide pour un token expiré', async () => {
      // Arrange
      const token = 'expired-token';
      const expiredToken = {
        ...mockToken,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expiré
      };
      jest
        .mocked(prismaService.emailActionToken.findUnique)
        .mockResolvedValue(expiredToken as any);

      // Act
      const result = await service.verifyToken(token);

      // Assert
      expect(result).toEqual({
        valid: false,
      });
    });

    it('devrait retourner invalide pour un token déjà utilisé', async () => {
      // Arrange
      const token = 'used-token';
      const usedToken = {
        ...mockToken,
        isUsed: true,
      };
      jest
        .mocked(prismaService.emailActionToken.findUnique)
        .mockResolvedValue(usedToken as any);

      // Act
      const result = await service.verifyToken(token);

      // Assert
      expect(result).toEqual({
        valid: false,
      });
    });
  });

  describe('acceptAppointment', () => {
    it('devrait accepter un rendez-vous avec succès', async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const data = {
        scheduledAt: '2024-01-15T10:00:00Z',
        token: 'valid-token',
      };
      const expectedResult = {
        success: true,
        appointment: mockAppointment,
      };

      // Mock verifyAndUseToken
      jest
        .mocked(prismaService.emailActionToken.findUnique)
        .mockResolvedValue(mockToken as any);
      jest
        .mocked(prismaService.emailActionToken.update)
        .mockResolvedValue(mockToken as any);

      (appointmentsService as any).updateStatusAdmin.mockResolvedValue(
        mockAppointment as any,
      );
      mailService.sendAppointmentConfirmation = jest
        .fn()
        .mockResolvedValue(undefined);

      // Act
      const result = await service.acceptAppointment(appointmentId, data);

      // Assert
      expect(result.success).toBe(true);
      expect(result.appointment).toEqual(mockAppointment);
      expect(
        (appointmentsService as any).updateStatusAdmin,
      ).toHaveBeenCalledWith(appointmentId, {
        status: 'CONFIRMED',
        confirmedAt: expect.any(Date),
        scheduledAt: expect.any(Date),
      });
    });

    it('devrait lever une erreur si le token est invalide', async () => {
      // Arrange
      const appointmentId = 'non-existent';
      const data = { token: 'invalid-token' };
      jest
        .mocked(prismaService.emailActionToken.findUnique)
        .mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.acceptAppointment(appointmentId, data),
      ).rejects.toThrow(new BadRequestException('Token invalide'));
    });
  });

  describe('rejectAppointment', () => {
    it('devrait refuser un rendez-vous avec succès', async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const data = {
        reason: "Conflit d'horaire",
        token: 'valid-token',
      };
      const expectedResult = {
        success: true,
        appointment: { ...mockAppointment, status: 'REJECTED' },
      };

      // Mock verifyAndUseToken
      jest
        .mocked(prismaService.emailActionToken.findUnique)
        .mockResolvedValue(mockToken as any);
      jest
        .mocked(prismaService.emailActionToken.update)
        .mockResolvedValue(mockToken as any);

      (appointmentsService as any).updateStatusAdmin.mockResolvedValue(
        mockAppointment as any,
      );
      mailService.sendAppointmentCancelled = jest
        .fn()
        .mockResolvedValue(undefined);

      // Act
      const result = await service.rejectAppointment(appointmentId, data);

      // Assert
      expect(result.success).toBe(true);
      expect(result.appointment).toEqual(mockAppointment);
      expect(
        (appointmentsService as any).updateStatusAdmin,
      ).toHaveBeenCalledWith(appointmentId, {
        status: 'CANCELLED',
      });
    });
  });

  describe('proposeReschedule', () => {
    it('devrait proposer une reprogrammation avec succès', async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const data = {
        newScheduledAt: '2024-01-20T14:00:00Z',
        token: 'valid-token',
      };
      const expectedResult = {
        success: true,
        appointment: mockAppointment,
      };

      // Mock verifyAndUseToken
      jest
        .mocked(prismaService.emailActionToken.findUnique)
        .mockResolvedValue(mockToken as any);
      jest
        .mocked(prismaService.emailActionToken.update)
        .mockResolvedValue(mockToken as any);

      (appointmentsService as any).proposeRescheduleAdmin.mockResolvedValue(
        mockAppointment as any,
      );

      // Act
      const result = await service.proposeReschedule(appointmentId, data);

      // Assert
      expect(result.success).toBe(true);
      expect(result.appointment).toEqual(mockAppointment);
      expect(
        (appointmentsService as any).proposeRescheduleAdmin,
      ).toHaveBeenCalledWith(appointmentId, data.newScheduledAt);
    });
  });

  describe('acceptQuote', () => {
    it('devrait accepter un devis avec succès', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const data = {
        document: 'quote-document.pdf',
        validUntil: '2024-02-15',
        token: 'valid-token',
      };
      const expectedResult = {
        success: true,
        quote: mockQuote,
      };

      // Mock verifyAndUseToken
      const quoteToken = { ...mockToken, type: 'quote', entityId: 'quote-123' };
      jest
        .mocked(prismaService.emailActionToken.findUnique)
        .mockResolvedValue(quoteToken as any);
      jest
        .mocked(prismaService.emailActionToken.update)
        .mockResolvedValue(quoteToken as any);

      quotesService.acceptQuote.mockResolvedValue(mockQuote as any);
      mailService.sendQuoteAccepted = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await service.acceptQuote(quoteId, data);

      // Assert
      expect(result.success).toBe(true);
      expect(result.quote).toEqual(mockQuote);
      expect(quotesService.acceptQuote).toHaveBeenCalledWith(quoteId, {
        document: data.document,
        validUntil: data.validUntil,
      });
    });

    it('devrait lever une erreur si le token est invalide', async () => {
      // Arrange
      const quoteId = 'non-existent';
      const data = { token: 'invalid-token' };
      jest
        .mocked(prismaService.emailActionToken.findUnique)
        .mockResolvedValue(null);

      // Act & Assert
      await expect(service.acceptQuote(quoteId, data)).rejects.toThrow(
        new BadRequestException('Token invalide'),
      );
    });
  });

  describe('rejectQuote', () => {
    it('devrait refuser un devis avec succès', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const data = {
        rejectionReason: 'Budget insuffisant',
        token: 'valid-token',
      };
      const expectedResult = {
        success: true,
        quote: { ...mockQuote, status: 'REJECTED' },
      };

      // Mock verifyAndUseToken
      const quoteToken = { ...mockToken, type: 'quote', entityId: 'quote-123' };
      jest
        .mocked(prismaService.emailActionToken.findUnique)
        .mockResolvedValue(quoteToken as any);
      jest
        .mocked(prismaService.emailActionToken.update)
        .mockResolvedValue(quoteToken as any);

      quotesService.rejectQuote.mockResolvedValue(mockQuote as any);
      mailService.sendQuoteRejected = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await service.rejectQuote(quoteId, data);

      // Assert
      expect(result.success).toBe(true);
      expect(result.quote).toEqual(mockQuote);
      expect(quotesService.rejectQuote).toHaveBeenCalledWith(
        quoteId,
        data.rejectionReason,
      );
    });
  });

  describe('getAppointmentDetails', () => {
    it("devrait récupérer les détails d'un rendez-vous", async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      jest
        .mocked(prismaService.appointment.findUnique)
        .mockResolvedValue(mockAppointment as any);

      // Act
      const result = await service.getAppointmentDetails(appointmentId);

      // Assert
      expect(result).toEqual(mockAppointment);
      expect(prismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: appointmentId },
        include: {
          contact: true,
        },
      });
    });

    it("devrait lever une erreur si le rendez-vous n'existe pas", async () => {
      // Arrange
      const appointmentId = 'non-existent';
      jest.mocked(prismaService.appointment.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getAppointmentDetails(appointmentId),
      ).rejects.toThrow(new BadRequestException('Rendez-vous non trouvé'));
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs lors de la création de token', async () => {
      // Arrange
      const type = 'appointment';
      const entityId = 'appointment-123';
      const action = 'accept';
      const error = new Error('Database connection failed');
      jest
        .mocked(prismaService.emailActionToken.create)
        .mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.createActionToken(type, entityId, action),
      ).rejects.toThrow(error);
    });

    it('devrait gérer les erreurs lors de la vérification de token', async () => {
      // Arrange
      const token = 'valid-token';
      const error = new Error('Database error');
      jest
        .mocked(prismaService.emailActionToken.findUnique)
        .mockRejectedValue(error);

      // Act
      const result = await service.verifyToken(token);

      // Assert
      expect(result).toEqual({ valid: false });
    });

    it("devrait gérer les erreurs lors de l'acceptation d'un rendez-vous", async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const data = { token: 'valid-token' };
      const error = new Error('Service error');

      // Mock verifyAndUseToken
      jest
        .mocked(prismaService.emailActionToken.findUnique)
        .mockResolvedValue(mockToken as any);
      jest
        .mocked(prismaService.emailActionToken.update)
        .mockResolvedValue(mockToken as any);

      (appointmentsService as any).updateStatusAdmin.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.acceptAppointment(appointmentId, data),
      ).rejects.toThrow(error);
    });
  });
});
