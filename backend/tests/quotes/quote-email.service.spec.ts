import { Test, TestingModule } from '@nestjs/testing';
import { QuoteEmailService } from '../../src/quotes/quote-email.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { MailService } from '../../src/mail/mail.service';
import { EmailActionsService } from '../../src/email-actions/email-actions.service';
import { EmailRenderer } from '../../src/email-templates/EmailRenderer';

// Mock EmailRenderer
jest.mock('../../src/email-templates/EmailRenderer', () => ({
  EmailRenderer: {
    renderAdminQuoteNotification: jest.fn(),
    renderQuoteConfirmation: jest.fn(),
    renderQuoteAccepted: jest.fn(),
    renderQuoteRejected: jest.fn(),
  },
}));

describe('QuoteEmailService', () => {
  let service: QuoteEmailService;
  let prismaService: jest.Mocked<PrismaService>;
  let mailService: jest.Mocked<MailService>;
  let emailActionsService: jest.Mocked<EmailActionsService>;

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

  const mockQuote = {
    id: 'quote-123',
    contactId: 'contact-123',
    projectDescription: 'Installation complète de portail automatique',
    acceptPhone: true,
    acceptTerms: true,
    status: 'PENDING' as const,
    quoteValidUntil: null,
    quoteDocument: null,
    rejectionReason: null,
    processedAt: null,
    sentAt: null,
    respondedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    contact: mockContact,
  };

  const mockCreateQuoteDto = {
    email: 'jean.dupont@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '+590690123456',
    message: 'Installation complète de portail automatique',
    acceptPhone: true,
    acceptTerms: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuoteEmailService,
        {
          provide: PrismaService,
          useValue: {
            emailLog: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: MailService,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
        {
          provide: EmailActionsService,
          useValue: {
            createActionToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QuoteEmailService>(QuoteEmailService);
    prismaService = module.get(PrismaService);
    mailService = module.get(MailService);
    emailActionsService = module.get(EmailActionsService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('sendQuoteNotificationEmail', () => {
    it("devrait envoyer un email de notification à l'admin", async () => {
      // Arrange
      const acceptToken = 'accept-token-123';
      const rejectToken = 'reject-token-456';
      const renderedHtml = '<html>Admin notification email</html>';

      emailActionsService.createActionToken
        .mockResolvedValueOnce(acceptToken)
        .mockResolvedValueOnce(rejectToken);

      (
        EmailRenderer.renderAdminQuoteNotification as jest.Mock
      ).mockResolvedValue(renderedHtml);
      mailService.sendEmail.mockResolvedValue(undefined);
      jest.mocked(prismaService.emailLog.create).mockResolvedValue({} as any);

      // Act
      await service.sendQuoteNotificationEmail(mockCreateQuoteDto, 'quote-123');

      // Assert
      expect(emailActionsService.createActionToken).toHaveBeenCalledWith(
        'quote',
        'quote-123',
        'accept',
      );
      expect(emailActionsService.createActionToken).toHaveBeenCalledWith(
        'quote',
        'quote-123',
        'reject',
      );

      expect(EmailRenderer.renderAdminQuoteNotification).toHaveBeenCalledWith({
        contactName: 'Jean Dupont',
        contactEmail: 'jean.dupont@example.com',
        contactPhone: '+590690123456',
        acceptPhone: true,
        message: 'Installation complète de portail automatique',
        quoteId: 'quote-123',
        acceptToken,
        rejectToken,
        baseUrl: process.env.PUBLIC_URL || 'http://localhost:3000',
      });

      expect(mailService.sendEmail).toHaveBeenCalledWith(
        process.env.ADMIN_EMAIL || 'kenzokerachi@hotmail.fr (dev test)',
        'Nouvelle demande de devis - Jean Dupont',
        renderedHtml,
      );

      expect(prismaService.emailLog.create).toHaveBeenCalledWith({
        data: {
          quoteId: 'quote-123',
          to: process.env.ADMIN_EMAIL || 'kenzokerachi@hotmail.fr (dev test)',
          subject: 'Nouvelle demande de devis - Jean Dupont',
          template: 'quote-notification-admin',
          meta: {
            contact: {
              firstName: 'Jean',
              lastName: 'Dupont',
              email: 'jean.dupont@example.com',
              phone: '+590690123456',
            },
            preferences: {
              acceptPhone: true,
              acceptTerms: true,
            },
          },
        },
      });
    });

    it("devrait utiliser l'email admin par défaut si non défini", async () => {
      // Arrange
      const originalAdminEmail = process.env.ADMIN_EMAIL;
      delete process.env.ADMIN_EMAIL;

      emailActionsService.createActionToken.mockResolvedValue('token');
      (
        EmailRenderer.renderAdminQuoteNotification as jest.Mock
      ).mockResolvedValue('<html>Test</html>');
      mailService.sendEmail.mockResolvedValue(undefined);
      jest.mocked(prismaService.emailLog.create).mockResolvedValue({} as any);

      // Act
      await service.sendQuoteNotificationEmail(mockCreateQuoteDto, 'quote-123');

      // Assert
      expect(mailService.sendEmail).toHaveBeenCalledWith(
        'kenzokerachi@hotmail.fr (dev test)',
        expect.any(String),
        expect.any(String),
      );

      // Restore
      if (originalAdminEmail) {
        process.env.ADMIN_EMAIL = originalAdminEmail;
      }
    });
  });

  describe('sendQuoteConfirmationEmail', () => {
    it('devrait envoyer un email de confirmation au client', async () => {
      // Arrange
      const renderedHtml = '<html>Confirmation email</html>';
      (EmailRenderer.renderQuoteConfirmation as jest.Mock).mockResolvedValue(
        renderedHtml,
      );
      mailService.sendEmail.mockResolvedValue(undefined);
      jest.mocked(prismaService.emailLog.create).mockResolvedValue({} as any);

      // Act
      await service.sendQuoteConfirmationEmail(mockCreateQuoteDto, 'quote-123');

      // Assert
      expect(EmailRenderer.renderQuoteConfirmation).toHaveBeenCalledWith({
        contactName: 'Jean',
        email: 'jean.dupont@example.com',
        phone: '+590690123456',
        acceptPhone: true,
        message: 'Installation complète de portail automatique',
      });

      expect(mailService.sendEmail).toHaveBeenCalledWith(
        'jean.dupont@example.com',
        'Confirmation de réception - Demande de devis SystemsMatic',
        renderedHtml,
      );

      expect(prismaService.emailLog.create).toHaveBeenCalledWith({
        data: {
          quoteId: 'quote-123',
          to: 'jean.dupont@example.com',
          subject: 'Confirmation de réception - Demande de devis SystemsMatic',
          template: 'quote-confirmation-client',
          meta: {
            contact: {
              firstName: 'Jean',
              lastName: 'Dupont',
            },
            projectDescription: 'Installation complète de portail automatique',
            preferences: {
              acceptPhone: true,
              acceptTerms: true,
            },
          },
        },
      });
    });
  });

  describe('sendQuoteAcceptedEmail', () => {
    it("devrait envoyer un email d'acceptation au client", async () => {
      // Arrange
      const renderedHtml = '<html>Quote accepted email</html>';
      (EmailRenderer.renderQuoteAccepted as jest.Mock).mockResolvedValue(
        renderedHtml,
      );
      mailService.sendEmail.mockResolvedValue(undefined);
      jest.mocked(prismaService.emailLog.create).mockResolvedValue({} as any);

      // Act
      await service.sendQuoteAcceptedEmail(mockQuote);

      // Assert
      expect(EmailRenderer.renderQuoteAccepted).toHaveBeenCalledWith({
        contactName: 'Jean',
        projectDescription: 'Installation complète de portail automatique',
      });

      expect(mailService.sendEmail).toHaveBeenCalledWith(
        'jean.dupont@example.com',
        'Devis accepté - SystemsMatic',
        renderedHtml,
      );

      expect(prismaService.emailLog.create).toHaveBeenCalledWith({
        data: {
          quoteId: 'quote-123',
          to: 'jean.dupont@example.com',
          subject: 'Devis accepté - SystemsMatic',
          template: 'quote-accepted-client',
          meta: {
            contact: {
              firstName: 'Jean',
              lastName: 'Dupont',
            },
            projectDescription: 'Installation complète de portail automatique',
            status: 'ACCEPTED',
          },
        },
      });
    });
  });

  describe('sendQuoteRejectedEmail', () => {
    it('devrait envoyer un email de rejet au client avec raison', async () => {
      // Arrange
      const rejectionReason = 'Projet trop complexe pour nos services actuels';
      const renderedHtml = '<html>Quote rejected email</html>';
      (EmailRenderer.renderQuoteRejected as jest.Mock).mockResolvedValue(
        renderedHtml,
      );
      mailService.sendEmail.mockResolvedValue(undefined);
      jest.mocked(prismaService.emailLog.create).mockResolvedValue({} as any);

      // Act
      await service.sendQuoteRejectedEmail(mockQuote, rejectionReason);

      // Assert
      expect(EmailRenderer.renderQuoteRejected).toHaveBeenCalledWith({
        contactName: 'Jean',
        projectDescription: 'Installation complète de portail automatique',
        rejectionReason,
      });

      expect(mailService.sendEmail).toHaveBeenCalledWith(
        'jean.dupont@example.com',
        'Demande de devis - SystemsMatic',
        renderedHtml,
      );

      expect(prismaService.emailLog.create).toHaveBeenCalledWith({
        data: {
          quoteId: 'quote-123',
          to: 'jean.dupont@example.com',
          subject: 'Demande de devis - SystemsMatic',
          template: 'quote-rejected-client',
          meta: {
            contact: {
              firstName: 'Jean',
              lastName: 'Dupont',
            },
            projectDescription: 'Installation complète de portail automatique',
            status: 'REJECTED',
            rejectionReason,
          },
        },
      });
    });

    it('devrait envoyer un email de rejet sans raison', async () => {
      // Arrange
      const renderedHtml = '<html>Quote rejected email</html>';
      (EmailRenderer.renderQuoteRejected as jest.Mock).mockResolvedValue(
        renderedHtml,
      );
      mailService.sendEmail.mockResolvedValue(undefined);
      jest.mocked(prismaService.emailLog.create).mockResolvedValue({} as any);

      // Act
      await service.sendQuoteRejectedEmail(mockQuote);

      // Assert
      expect(EmailRenderer.renderQuoteRejected).toHaveBeenCalledWith({
        contactName: 'Jean',
        projectDescription: 'Installation complète de portail automatique',
        rejectionReason: undefined,
      });

      expect(prismaService.emailLog.create).toHaveBeenCalledWith({
        data: {
          quoteId: 'quote-123',
          to: 'jean.dupont@example.com',
          subject: 'Demande de devis - SystemsMatic',
          template: 'quote-rejected-client',
          meta: {
            contact: {
              firstName: 'Jean',
              lastName: 'Dupont',
            },
            projectDescription: 'Installation complète de portail automatique',
            status: 'REJECTED',
            rejectionReason: null,
          },
        },
      });
    });
  });

  describe('Gestion des erreurs', () => {
    it("devrait gérer les erreurs lors de l'envoi d'email de notification", async () => {
      // Arrange
      const error = new Error('SMTP connection failed');
      emailActionsService.createActionToken.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.sendQuoteNotificationEmail(mockCreateQuoteDto, 'quote-123'),
      ).rejects.toThrow(error);
    });

    it("devrait gérer les erreurs lors de l'envoi d'email de confirmation", async () => {
      // Arrange
      const error = new Error('Email service unavailable');
      mailService.sendEmail.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.sendQuoteConfirmationEmail(mockCreateQuoteDto, 'quote-123'),
      ).rejects.toThrow(error);
    });

    it("devrait gérer les erreurs lors de l'envoi d'email d'acceptation", async () => {
      // Arrange
      const error = new Error('Template rendering failed');
      (EmailRenderer.renderQuoteAccepted as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(service.sendQuoteAcceptedEmail(mockQuote)).rejects.toThrow(
        error,
      );
    });

    it("devrait gérer les erreurs lors de l'envoi d'email de rejet", async () => {
      // Arrange
      const error = new Error('Database connection failed');
      jest.mocked(prismaService.emailLog.create).mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.sendQuoteRejectedEmail(mockQuote, 'Test reason'),
      ).rejects.toThrow(error);
    });
  });
});
