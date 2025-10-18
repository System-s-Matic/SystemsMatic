import { Test, TestingModule } from '@nestjs/testing';
import { EmailActionsController } from '../../src/email-actions/email-actions.controller';
import { EmailActionsService } from '../../src/email-actions/email-actions.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('EmailActionsController', () => {
  let controller: EmailActionsController;
  let emailActionsService: jest.Mocked<EmailActionsService>;

  const mockAppointment = {
    id: 'appointment-123',
    contactId: 'contact-123',
    requestedAt: new Date(),
    status: 'PENDING' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    contact: {
      id: 'contact-123',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      phone: '+590690123456',
      consentAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockQuote = {
    id: 'quote-123',
    contactId: 'contact-123',
    projectDescription: 'Installation portail automatique',
    status: 'PENDING' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    contact: {
      id: 'contact-123',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      phone: '+590690123456',
      consentAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockTokenValidation = {
    valid: true,
    type: 'appointment',
    entityId: 'appointment-123',
    action: 'accept',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailActionsController],
      providers: [
        {
          provide: EmailActionsService,
          useValue: {
            acceptAppointment: jest.fn(),
            rejectAppointment: jest.fn(),
            proposeReschedule: jest.fn(),
            acceptQuote: jest.fn(),
            rejectQuote: jest.fn(),
            verifyToken: jest.fn(),
            getAppointmentDetails: jest.fn(),
            createActionToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EmailActionsController>(EmailActionsController);
    emailActionsService = module.get(EmailActionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  describe('acceptAppointmentGet', () => {
    it('devrait accepter un rendez-vous via GET avec succès', async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const token = 'valid-token';
      const expectedResult = {
        success: true,
        message: 'Rendez-vous accepté avec succès',
        appointment: mockAppointment,
      };
      emailActionsService.acceptAppointment.mockResolvedValue(
        expectedResult as any,
      );

      // Act
      const result = await controller.acceptAppointmentGet(
        appointmentId,
        token,
      );

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Rendez-vous accepté avec succès',
        appointment: mockAppointment,
      });
      expect(emailActionsService.acceptAppointment).toHaveBeenCalledWith(
        appointmentId,
        { token },
      );
    });

    it("devrait lever une HttpException en cas d'erreur", async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const token = 'invalid-token';
      const error = new Error('Token invalide');
      emailActionsService.acceptAppointment.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.acceptAppointmentGet(appointmentId, token),
      ).rejects.toThrow(
        new HttpException('Token invalide', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('acceptAppointment', () => {
    it('devrait accepter un rendez-vous via POST avec succès', async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const data = {
        scheduledAt: '2024-01-15T10:00:00Z',
        token: 'valid-token',
      };
      const expectedResult = {
        success: true,
        message: 'Rendez-vous accepté avec succès',
        appointment: mockAppointment,
      };
      emailActionsService.acceptAppointment.mockResolvedValue(
        expectedResult as any,
      );

      // Act
      const result = await controller.acceptAppointment(appointmentId, data);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(emailActionsService.acceptAppointment).toHaveBeenCalledWith(
        appointmentId,
        data,
      );
    });

    it("devrait lever une HttpException en cas d'erreur", async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const data = { token: 'invalid-token' };
      const error = new Error('Token expiré');
      emailActionsService.acceptAppointment.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.acceptAppointment(appointmentId, data),
      ).rejects.toThrow(
        new HttpException('Token expiré', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('rejectAppointmentGet', () => {
    it('devrait refuser un rendez-vous via GET avec succès', async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const token = 'valid-token';
      const expectedResult = {
        success: true,
        message: 'Rendez-vous refusé avec succès',
        appointment: { ...mockAppointment, status: 'REJECTED' },
      };
      emailActionsService.rejectAppointment.mockResolvedValue(
        expectedResult as any,
      );

      // Act
      const result = await controller.rejectAppointmentGet(
        appointmentId,
        token,
      );

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Rendez-vous refusé avec succès',
        appointment: { ...mockAppointment, status: 'REJECTED' },
      });
      expect(emailActionsService.rejectAppointment).toHaveBeenCalledWith(
        appointmentId,
        { token },
      );
    });

    it("devrait lever une HttpException en cas d'erreur", async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const token = 'invalid-token';
      const error = new Error('Token invalide');
      emailActionsService.rejectAppointment.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.rejectAppointmentGet(appointmentId, token),
      ).rejects.toThrow(
        new HttpException('Token invalide', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('rejectAppointment', () => {
    it('devrait refuser un rendez-vous via POST avec succès', async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const data = {
        reason: "Conflit d'horaire",
        token: 'valid-token',
      };
      const expectedResult = {
        success: true,
        message: 'Rendez-vous refusé avec succès',
        appointment: { ...mockAppointment, status: 'REJECTED' },
      };
      emailActionsService.rejectAppointment.mockResolvedValue(
        expectedResult as any,
      );

      // Act
      const result = await controller.rejectAppointment(appointmentId, data);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(emailActionsService.rejectAppointment).toHaveBeenCalledWith(
        appointmentId,
        data,
      );
    });

    it("devrait lever une HttpException en cas d'erreur", async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const data = {
        reason: "Conflit d'horaire",
        token: 'invalid-token',
      };
      const error = new Error('Token invalide');
      emailActionsService.rejectAppointment.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.rejectAppointment(appointmentId, data),
      ).rejects.toThrow(
        new HttpException('Token invalide', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('proposeRescheduleGet', () => {
    it('devrait proposer une reprogrammation via GET avec token valide', async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const token = 'valid-token';
      emailActionsService.verifyToken.mockResolvedValue(mockTokenValidation);

      // Act
      const result = await controller.proposeRescheduleGet(
        appointmentId,
        token,
      );

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Token valide. Vous pouvez proposer une nouvelle date.',
        appointmentId,
      });
      expect(emailActionsService.verifyToken).toHaveBeenCalledWith(token);
    });

    it('devrait lever une HttpException avec token invalide', async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const token = 'invalid-token';
      emailActionsService.verifyToken.mockResolvedValue({
        valid: false,
      });

      // Act & Assert
      await expect(
        controller.proposeRescheduleGet(appointmentId, token),
      ).rejects.toThrow(
        new HttpException('Token invalide ou expiré', HttpStatus.UNAUTHORIZED),
      );
    });
  });

  describe('proposeReschedule', () => {
    it('devrait proposer une reprogrammation via POST avec succès', async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const data = {
        newScheduledAt: '2024-01-20T14:00:00Z',
        token: 'valid-token',
      };
      const expectedResult = {
        success: true,
        message: 'Reprogrammation proposée avec succès',
        appointment: mockAppointment,
      };
      emailActionsService.proposeReschedule.mockResolvedValue(
        expectedResult as any,
      );

      // Act
      const result = await controller.proposeReschedule(appointmentId, data);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(emailActionsService.proposeReschedule).toHaveBeenCalledWith(
        appointmentId,
        data,
      );
    });

    it("devrait lever une HttpException en cas d'erreur", async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const data = {
        newScheduledAt: '2024-01-20T14:00:00Z',
        token: 'invalid-token',
      };
      const error = new Error('Token expiré');
      emailActionsService.proposeReschedule.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.proposeReschedule(appointmentId, data),
      ).rejects.toThrow(
        new HttpException('Token expiré', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('acceptQuoteGet', () => {
    it('devrait accepter un devis via GET avec succès', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const token = 'valid-token';
      const expectedResult = {
        success: true,
        message: 'Devis accepté avec succès',
        quote: mockQuote,
      };
      emailActionsService.acceptQuote.mockResolvedValue(expectedResult as any);

      // Act
      const result = await controller.acceptQuoteGet(quoteId, token);

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Devis accepté avec succès',
        quote: mockQuote,
      });
      expect(emailActionsService.acceptQuote).toHaveBeenCalledWith(quoteId, {
        token,
      });
    });

    it("devrait lever une HttpException en cas d'erreur", async () => {
      // Arrange
      const quoteId = 'quote-123';
      const token = 'invalid-token';
      const error = new Error('Token invalide');
      emailActionsService.acceptQuote.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.acceptQuoteGet(quoteId, token)).rejects.toThrow(
        new HttpException('Token invalide', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('acceptQuote', () => {
    it('devrait accepter un devis via POST avec succès', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const data = {
        document: 'quote-document.pdf',
        validUntil: '2024-02-15',
        token: 'valid-token',
      };
      const expectedResult = {
        success: true,
        message: 'Devis accepté avec succès',
        quote: mockQuote,
      };
      emailActionsService.acceptQuote.mockResolvedValue(expectedResult as any);

      // Act
      const result = await controller.acceptQuote(quoteId, data);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(emailActionsService.acceptQuote).toHaveBeenCalledWith(
        quoteId,
        data,
      );
    });

    it("devrait lever une HttpException en cas d'erreur", async () => {
      // Arrange
      const quoteId = 'quote-123';
      const data = {
        document: 'quote-document.pdf',
        validUntil: '2024-02-15',
        token: 'invalid-token',
      };
      const error = new Error('Token expiré');
      emailActionsService.acceptQuote.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.acceptQuote(quoteId, data)).rejects.toThrow(
        new HttpException('Token expiré', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('rejectQuoteGet', () => {
    it('devrait refuser un devis via GET avec succès', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const token = 'valid-token';
      const expectedResult = {
        success: true,
        message: 'Devis refusé avec succès',
        quote: { ...mockQuote, status: 'REJECTED' },
      };
      emailActionsService.rejectQuote.mockResolvedValue(expectedResult as any);

      // Act
      const result = await controller.rejectQuoteGet(quoteId, token);

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Devis refusé avec succès',
        quote: { ...mockQuote, status: 'REJECTED' },
      });
      expect(emailActionsService.rejectQuote).toHaveBeenCalledWith(quoteId, {
        rejectionReason: 'Refusé via email',
        token,
      });
    });

    it("devrait lever une HttpException en cas d'erreur", async () => {
      // Arrange
      const quoteId = 'quote-123';
      const token = 'invalid-token';
      const error = new Error('Token invalide');
      emailActionsService.rejectQuote.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.rejectQuoteGet(quoteId, token)).rejects.toThrow(
        new HttpException('Token invalide', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('rejectQuote', () => {
    it('devrait refuser un devis via POST avec succès', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const data = {
        rejectionReason: 'Budget insuffisant',
        token: 'valid-token',
      };
      const expectedResult = {
        success: true,
        message: 'Devis refusé avec succès',
        quote: { ...mockQuote, status: 'REJECTED' },
      };
      emailActionsService.rejectQuote.mockResolvedValue(expectedResult as any);

      // Act
      const result = await controller.rejectQuote(quoteId, data);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(emailActionsService.rejectQuote).toHaveBeenCalledWith(
        quoteId,
        data,
      );
    });

    it("devrait lever une HttpException en cas d'erreur", async () => {
      // Arrange
      const quoteId = 'quote-123';
      const data = {
        rejectionReason: 'Budget insuffisant',
        token: 'invalid-token',
      };
      const error = new Error('Token expiré');
      emailActionsService.rejectQuote.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.rejectQuote(quoteId, data)).rejects.toThrow(
        new HttpException('Token expiré', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('getAppointmentDetails', () => {
    it("devrait récupérer les détails d'un rendez-vous avec token valide", async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const token = 'valid-token';
      emailActionsService.verifyToken.mockResolvedValue(mockTokenValidation);
      emailActionsService.getAppointmentDetails.mockResolvedValue(
        mockAppointment as any,
      );

      // Act
      const result = await controller.getAppointmentDetails(
        appointmentId,
        token,
      );

      // Assert
      expect(result).toEqual({
        success: true,
        appointment: mockAppointment,
      });
      expect(emailActionsService.verifyToken).toHaveBeenCalledWith(token);
      expect(emailActionsService.getAppointmentDetails).toHaveBeenCalledWith(
        appointmentId,
      );
    });

    it('devrait lever une HttpException avec token invalide', async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const token = 'invalid-token';
      emailActionsService.verifyToken.mockResolvedValue({
        valid: false,
      });

      // Act & Assert
      await expect(
        controller.getAppointmentDetails(appointmentId, token),
      ).rejects.toThrow(
        new HttpException('Token invalide ou expiré', HttpStatus.UNAUTHORIZED),
      );
    });
  });

  describe('verifyToken', () => {
    it('devrait vérifier un token valide', async () => {
      // Arrange
      const token = 'valid-token';
      emailActionsService.verifyToken.mockResolvedValue(mockTokenValidation);

      // Act
      const result = await controller.verifyToken(token);

      // Assert
      expect(result).toEqual(mockTokenValidation);
      expect(emailActionsService.verifyToken).toHaveBeenCalledWith(token);
    });

    it('devrait lever une HttpException avec token invalide', async () => {
      // Arrange
      const token = 'invalid-token';
      const error = new Error('Token invalide');
      emailActionsService.verifyToken.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.verifyToken(token)).rejects.toThrow(
        new HttpException('Token invalide', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('createTestTokens', () => {
    beforeEach(() => {
      // Mock environment
      process.env.NODE_ENV = 'development';
      process.env.PUBLIC_URL = 'http://localhost:3000';
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
      delete process.env.PUBLIC_URL;
    });

    it('devrait créer des tokens de test pour un rendez-vous', async () => {
      // Arrange
      const data = {
        type: 'appointment' as const,
        entityId: 'appointment-123',
      };
      const tokens = ['accept-token', 'reject-token', 'reschedule-token'];
      emailActionsService.createActionToken
        .mockResolvedValueOnce(tokens[0])
        .mockResolvedValueOnce(tokens[1])
        .mockResolvedValueOnce(tokens[2]);

      // Act
      const result = await controller.createTestTokens(data);

      // Assert
      expect(result).toEqual({
        success: true,
        tokens: {
          accept: 'accept-token',
          reject: 'reject-token',
          reschedule: 'reschedule-token',
        },
        urls: {
          accept:
            'http://localhost:3000/email-actions/appointments/appointment-123/accept?token=accept-token',
          reject:
            'http://localhost:3000/email-actions/appointments/appointment-123/reject?token=reject-token',
          reschedule:
            'http://localhost:3000/email-actions/appointments/appointment-123/propose-reschedule?token=reschedule-token',
        },
      });
      expect(emailActionsService.createActionToken).toHaveBeenCalledTimes(3);
    });

    it('devrait créer des tokens de test pour un devis', async () => {
      // Arrange
      const data = {
        type: 'quote' as const,
        entityId: 'quote-123',
      };
      const tokens = ['accept-token', 'reject-token'];
      emailActionsService.createActionToken
        .mockResolvedValueOnce(tokens[0])
        .mockResolvedValueOnce(tokens[1]);

      // Act
      const result = await controller.createTestTokens(data);

      // Assert
      expect(result).toEqual({
        success: true,
        tokens: {
          accept: 'accept-token',
          reject: 'reject-token',
        },
        urls: {
          accept:
            'http://localhost:3000/email-actions/quotes/quote-123/accept?token=accept-token',
          reject:
            'http://localhost:3000/email-actions/quotes/quote-123/reject?token=reject-token',
        },
      });
      expect(emailActionsService.createActionToken).toHaveBeenCalledTimes(2);
    });

    it('devrait lever une HttpException en production', async () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const data = {
        type: 'appointment' as const,
        entityId: 'appointment-123',
      };

      // Act & Assert
      await expect(controller.createTestTokens(data)).rejects.toThrow(
        new HttpException(
          'Endpoint de test non disponible en production',
          HttpStatus.FORBIDDEN,
        ),
      );
    });

    it("devrait lever une HttpException en cas d'erreur", async () => {
      // Arrange
      const data = {
        type: 'appointment' as const,
        entityId: 'appointment-123',
      };
      const error = new Error('Erreur de création de token');
      emailActionsService.createActionToken.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.createTestTokens(data)).rejects.toThrow(
        new HttpException(
          'Erreur de création de token',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });
});
