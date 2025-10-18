import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '../../src/mail/mail.service';
import { EmailActionsService } from '../../src/email-actions/email-actions.service';
import { AppointmentStatus, AppointmentReason } from '@prisma/client';

// Mock EmailRenderer pour éviter les erreurs de rendu React
jest.mock('../../src/email-templates/EmailRenderer', () => ({
  EmailRenderer: {
    renderTemplate: jest.fn().mockResolvedValue('<html>Mocked Email</html>'),
    renderAppointmentRequest: jest
      .fn()
      .mockResolvedValue('<html>Request Email</html>'),
    renderAppointmentConfirmation: jest
      .fn()
      .mockImplementation(async (data) => {
        // Le mock inclut le cancelUrl qui contient le token d'annulation
        return `<html>Confirmation Email with cancel URL: ${data.cancelUrl || ''}</html>`;
      }),
    renderAppointmentCancelled: jest
      .fn()
      .mockResolvedValue('<html>Cancelled Email</html>'),
    renderAppointmentReminder: jest
      .fn()
      .mockResolvedValue('<html>Reminder Email</html>'),
    renderAppointmentRescheduleProposal: jest
      .fn()
      .mockResolvedValue('<html>Reschedule Email</html>'),
    renderQuoteAccepted: jest
      .fn()
      .mockResolvedValue('<html>Quote Accepted</html>'),
    renderQuoteRejected: jest
      .fn()
      .mockResolvedValue('<html>Quote Rejected</html>'),
    renderAdminAppointmentNotification: jest
      .fn()
      .mockResolvedValue('<html>Admin Notification</html>'),
  },
}));

describe('MailService', () => {
  let service: MailService;
  let emailActionsService: EmailActionsService;

  const mockContact = {
    id: 'contact-123',
    email: 'client@test.com',
    firstName: 'Sophie',
    lastName: 'Bernard',
    phone: '+590690789456',
    consentAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAppointment = {
    id: 'appt-123',
    contactId: 'contact-123',
    reason: AppointmentReason.INSTALLATION,
    reasonOther: null,
    message: 'Installation portail automatique',
    requestedAt: new Date('2025-12-01T10:00:00.000Z'),
    scheduledAt: new Date('2025-12-15T14:00:00.000Z'),
    status: AppointmentStatus.CONFIRMED,
    confirmationToken: 'confirm-token-123',
    cancellationToken: 'cancel-token-123',
    timezone: 'America/Guadeloupe',
    confirmedAt: new Date(),
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdIp: null,
    contact: mockContact,
  };

  const mockEmailActionsService = {
    createActionToken: jest.fn().mockResolvedValue('action-token-123'),
  };

  beforeEach(async () => {
    // Mock de Resend pour éviter les appels réels
    process.env.RESEND_API_KEY = undefined;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: EmailActionsService,
          useValue: mockEmailActionsService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    emailActionsService = module.get<EmailActionsService>(EmailActionsService);

    // Spy sur la méthode privée send
    jest.spyOn(service as any, 'send').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('TU07 - sendAppointmentConfirmation()', () => {
    it('devrait envoyer un email de confirmation de rendez-vous', async () => {
      // Arrange
      const sendSpy = jest.spyOn(service as any, 'send');

      // Act
      await service.sendAppointmentConfirmation(mockAppointment);

      // Assert
      expect(sendSpy).toHaveBeenCalledWith(
        mockContact.email,
        'Rendez-vous confirmé',
        expect.any(String),
      );
    });

    it("ne devrait rien faire si le contact n'est pas présent", async () => {
      // Arrange
      const appointmentWithoutContact = {
        ...mockAppointment,
        contact: undefined,
      };
      const sendSpy = jest.spyOn(service as any, 'send');

      // Act
      await service.sendAppointmentConfirmation(appointmentWithoutContact);

      // Assert
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it("devrait inclure le lien d'annulation dans l'email", async () => {
      // Arrange
      const sendSpy = jest.spyOn(service as any, 'send');

      // Act
      await service.sendAppointmentConfirmation(mockAppointment);

      // Assert
      const htmlContent = sendSpy.mock.calls[0][2];
      expect(htmlContent).toContain(mockAppointment.cancellationToken);
    });
  });

  describe('TU08 - sendQuoteToClient()', () => {
    it('devrait envoyer un email de devis accepté au client', async () => {
      // Arrange
      const quote = {
        id: 'quote-123',
        projectDescription: 'Installation portail',
        contact: mockContact,
      };
      const sendSpy = jest.spyOn(service as any, 'send');

      // Act
      await service.sendQuoteAccepted(quote);

      // Assert
      expect(sendSpy).toHaveBeenCalledWith(
        mockContact.email,
        'Votre devis a été accepté - SystemsMatic',
        expect.any(String),
      );
    });

    it('devrait envoyer un email de devis rejeté avec raison', async () => {
      // Arrange
      const quote = {
        id: 'quote-123',
        projectDescription: 'Installation portail',
        rejectionReason: 'Projet trop complexe',
        contact: mockContact,
      };
      const sendSpy = jest.spyOn(service as any, 'send');

      // Act
      await service.sendQuoteRejected(quote);

      // Assert
      expect(sendSpy).toHaveBeenCalledWith(
        mockContact.email,
        'Réponse à votre demande de devis - SystemsMatic',
        expect.any(String),
      );
    });
  });

  describe('sendAppointmentRequest', () => {
    it('devrait envoyer un email de demande de rendez-vous', async () => {
      // Arrange
      const sendSpy = jest.spyOn(service as any, 'send');

      // Act
      await service.sendAppointmentRequest(mockContact, mockAppointment);

      // Assert
      expect(sendSpy).toHaveBeenCalledWith(
        mockContact.email,
        'Demande de rendez-vous reçue',
        expect.any(String),
      );
    });
  });

  describe('sendAppointmentCancelled', () => {
    it("devrait envoyer un email d'annulation", async () => {
      // Arrange
      const cancelledAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
      };
      const sendSpy = jest.spyOn(service as any, 'send');

      // Act
      await service.sendAppointmentCancelled(cancelledAppointment);

      // Assert
      expect(sendSpy).toHaveBeenCalledWith(
        mockContact.email,
        'Votre rendez-vous a été annulé',
        expect.any(String),
      );
    });

    it("ne devrait rien faire si le contact n'est pas présent", async () => {
      // Arrange
      const cancelledAppointment = {
        ...mockAppointment,
        contact: undefined,
        status: AppointmentStatus.CANCELLED,
      };
      const sendSpy = jest.spyOn(service as any, 'send');

      // Act
      await service.sendAppointmentCancelled(cancelledAppointment);

      // Assert
      expect(sendSpy).not.toHaveBeenCalled();
    });
  });

  describe('sendAppointmentReminder', () => {
    it('devrait envoyer un email de rappel', async () => {
      // Arrange
      const sendSpy = jest.spyOn(service as any, 'send');

      // Act
      await service.sendAppointmentReminder(mockAppointment);

      // Assert
      expect(sendSpy).toHaveBeenCalledWith(
        mockContact.email,
        'Rappel : votre rendez-vous approche',
        expect.any(String),
      );
    });
  });

  describe('sendAppointmentRescheduleProposal', () => {
    it('devrait envoyer un email de proposition de reprogrammation', async () => {
      // Arrange
      const rescheduledAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.RESCHEDULED,
      };
      const sendSpy = jest.spyOn(service as any, 'send');

      // Act
      await service.sendAppointmentRescheduleProposal(rescheduledAppointment);

      // Assert
      expect(sendSpy).toHaveBeenCalledWith(
        mockContact.email,
        'Proposition de reprogrammation de votre rendez-vous',
        expect.any(String),
      );
    });
  });

  describe('sendAppointmentNotificationEmail', () => {
    it("devrait envoyer un email de notification à l'admin", async () => {
      // Arrange
      const sendSpy = jest.spyOn(service as any, 'send');
      process.env.ADMIN_EMAIL = 'admin@systemsmatic.com';

      // Act
      await service.sendAppointmentNotificationEmail(
        mockContact,
        mockAppointment,
      );

      // Assert
      expect(emailActionsService.createActionToken).toHaveBeenCalledTimes(3);
      expect(sendSpy).toHaveBeenCalledWith(
        'admin@systemsmatic.com',
        expect.stringContaining('Nouvelle demande de rendez-vous'),
        expect.any(String),
      );
    });

    it("devrait créer les tokens d'action pour l'admin", async () => {
      // Act
      await service.sendAppointmentNotificationEmail(
        mockContact,
        mockAppointment,
      );

      // Assert
      expect(emailActionsService.createActionToken).toHaveBeenCalledWith(
        'appointment',
        mockAppointment.id,
        'accept',
      );
      expect(emailActionsService.createActionToken).toHaveBeenCalledWith(
        'appointment',
        mockAppointment.id,
        'reject',
      );
      expect(emailActionsService.createActionToken).toHaveBeenCalledWith(
        'appointment',
        mockAppointment.id,
        'reschedule',
      );
    });
  });

  describe('formatDate', () => {
    it('devrait formater correctement les dates', () => {
      // Arrange
      const date = new Date('2025-12-15T14:00:00.000Z');

      // Act
      const formatted = (service as any).formatDate(date);

      // Assert
      expect(formatted).toBeTruthy();
      expect(formatted).not.toBe('—');
    });

    it('devrait retourner "—" pour les dates nulles', () => {
      // Act
      const formatted = (service as any).formatDate(null);

      // Assert
      expect(formatted).toBe('—');
    });
  });

  describe('generateActionUrl', () => {
    it("devrait générer une URL d'action valide", () => {
      // Act
      const url = (service as any).generateActionUrl(
        'appt-123',
        'confirm',
        'token-123',
      );

      // Assert
      expect(url).toContain('/appointments/appt-123/confirm');
      expect(url).toContain('token=token-123');
    });
  });
});
