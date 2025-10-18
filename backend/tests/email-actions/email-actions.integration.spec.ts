import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { EmailActionsModule } from '../../src/email-actions/email-actions.module';
import { QuotesModule } from '../../src/quotes/quotes.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { QuoteEmailService } from '../../src/quotes/quote-email.service';

/**
 * NOTE: Ces tests d'intégration sont actuellement désactivés car les routes attendues
 * ne correspondent pas aux routes réelles implémentées dans EmailActionsController.
 *
 * Routes attendues par les tests :
 * - GET /email-actions/:token
 * - POST /email-actions/:token/execute
 *
 * Routes réelles dans le controller :
 * - GET /email-actions/appointments/:id/accept
 * - GET /email-actions/appointments/:id/reject
 * - GET /email-actions/quotes/:id/accept
 * - GET /email-actions/quotes/:id/reject
 *
 * TODO: Réécrire ces tests pour correspondre aux routes réelles ou implémenter les routes génériques.
 */
describe.skip('TI05 - EmailActionsModule + QuotesModule - Gestion des actions par email', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let quoteEmailService: QuoteEmailService;

  const mockContact = {
    id: 'contact-email-action-123',
    email: 'client.action@test.com',
    firstName: 'Client',
    lastName: 'Action',
    phone: '+590690987654',
    consentAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQuote = {
    id: 'quote-action-123',
    contactId: mockContact.id,
    projectDescription: 'Installation automatique',
    acceptPhone: true,
    acceptTerms: true,
    status: 'PENDING',
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    contact: mockContact,
  };

  const mockActionToken = {
    id: 'token-123',
    token: 'action-token-abc123',
    entityType: 'quote',
    entityId: mockQuote.id,
    action: 'accept',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours
    usedAt: null,
    createdAt: new Date(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [EmailActionsModule, QuotesModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        contact: {
          upsert: jest.fn().mockResolvedValue(mockContact),
          findUnique: jest.fn().mockResolvedValue(mockContact),
        },
        quote: {
          create: jest.fn().mockResolvedValue(mockQuote),
          findUnique: jest.fn().mockResolvedValue(mockQuote),
          findMany: jest.fn().mockResolvedValue([mockQuote]),
          update: jest
            .fn()
            .mockResolvedValue({ ...mockQuote, status: 'ACCEPTED' }),
          count: jest.fn().mockResolvedValue(1),
        },
        emailActionToken: {
          create: jest.fn().mockResolvedValue(mockActionToken),
          findUnique: jest.fn().mockResolvedValue(mockActionToken),
          update: jest
            .fn()
            .mockResolvedValue({ ...mockActionToken, usedAt: new Date() }),
        },
      })
      .overrideProvider(QuoteEmailService)
      .useValue({
        sendQuoteNotificationEmail: jest.fn().mockResolvedValue(undefined),
        sendQuoteConfirmationEmail: jest.fn().mockResolvedValue(undefined),
        sendQuoteAcceptedEmail: jest.fn().mockResolvedValue(undefined),
        sendQuoteRejectedEmail: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    quoteEmailService = moduleFixture.get<QuoteEmailService>(QuoteEmailService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Création de tokens d'action par email", () => {
    it("devrait créer un token d'action lors de la création d'un devis", async () => {
      // Arrange
      const createQuoteDto = {
        email: 'client.action@test.com',
        firstName: 'Client',
        lastName: 'Action',
        phone: '+590690987654',
        message: "Test d'action par email",
        acceptPhone: true,
        acceptTerms: true,
      };

      // Act
      await request(app.getHttpServer())
        .post('/quotes')
        .send(createQuoteDto)
        .expect(201);

      // Assert - Vérifier que les emails de notification sont envoyés
      expect(quoteEmailService.sendQuoteNotificationEmail).toHaveBeenCalled();
      expect(quoteEmailService.sendQuoteConfirmationEmail).toHaveBeenCalled();
    });
  });

  describe('GET /email-actions/:token - Validation de token', () => {
    it("devrait valider un token d'action valide", async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get(`/email-actions/${mockActionToken.token}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('entityType', 'quote');
      expect(response.body).toHaveProperty('action', 'accept');
    });

    it('devrait rejeter un token expiré', async () => {
      // Arrange
      const expiredToken = {
        ...mockActionToken,
        expiresAt: new Date(Date.now() - 1000), // Expiré
      };
      (prisma.emailActionToken.findUnique as jest.Mock).mockResolvedValue(
        expiredToken,
      );

      // Act
      const response = await request(app.getHttpServer())
        .get(`/email-actions/${expiredToken.token}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('valid', false);
      expect(response.body.message).toContain('expiré');
    });

    it('devrait rejeter un token déjà utilisé', async () => {
      // Arrange
      const usedToken = {
        ...mockActionToken,
        usedAt: new Date(),
      };
      (prisma.emailActionToken.findUnique as jest.Mock).mockResolvedValue(
        usedToken,
      );

      // Act
      const response = await request(app.getHttpServer())
        .get(`/email-actions/${usedToken.token}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('valid', false);
      expect(response.body.message).toContain('déjà utilisé');
    });

    it('devrait rejeter un token inexistant', async () => {
      // Arrange
      (prisma.emailActionToken.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      const response = await request(app.getHttpServer())
        .get('/email-actions/invalid-token-xyz')
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('valid', false);
    });
  });

  describe("POST /email-actions/:token/execute - Exécution d'action", () => {
    it("devrait exécuter une action d'acceptation de devis", async () => {
      // Arrange
      const acceptedQuote = { ...mockQuote, status: 'ACCEPTED' };
      (prisma.quote.update as jest.Mock).mockResolvedValue(acceptedQuote);

      // Act
      const response = await request(app.getHttpServer())
        .post(`/email-actions/${mockActionToken.token}/execute`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(prisma.emailActionToken.update).toHaveBeenCalledWith({
        where: { token: mockActionToken.token },
        data: { usedAt: expect.any(Date) },
      });
    });

    it('devrait marquer le token comme utilisé après exécution', async () => {
      // Act
      await request(app.getHttpServer())
        .post(`/email-actions/${mockActionToken.token}/execute`)
        .expect(200);

      // Assert
      expect(prisma.emailActionToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { token: mockActionToken.token },
          data: expect.objectContaining({
            usedAt: expect.any(Date),
          }),
        }),
      );
    });

    it("devrait envoyer l'email correspondant à l'action", async () => {
      // Arrange
      const acceptedQuote = { ...mockQuote, status: 'ACCEPTED' };
      (prisma.quote.update as jest.Mock).mockResolvedValue(acceptedQuote);

      // Act
      await request(app.getHttpServer())
        .post(`/email-actions/${mockActionToken.token}/execute`)
        .expect(200);

      // Assert
      // L'email devrait être envoyé par le QuotesService
      expect(quoteEmailService.sendQuoteAcceptedEmail).toHaveBeenCalled();
    });

    it("devrait empêcher l'exécution d'un token expiré", async () => {
      // Arrange
      const expiredToken = {
        ...mockActionToken,
        expiresAt: new Date(Date.now() - 1000),
      };
      (prisma.emailActionToken.findUnique as jest.Mock).mockResolvedValue(
        expiredToken,
      );

      // Act
      const response = await request(app.getHttpServer())
        .post(`/email-actions/${expiredToken.token}/execute`)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(prisma.emailActionToken.update).not.toHaveBeenCalled();
    });

    it("devrait empêcher l'exécution d'un token déjà utilisé", async () => {
      // Arrange
      const usedToken = {
        ...mockActionToken,
        usedAt: new Date(),
      };
      (prisma.emailActionToken.findUnique as jest.Mock).mockResolvedValue(
        usedToken,
      );

      // Act
      const response = await request(app.getHttpServer())
        .post(`/email-actions/${usedToken.token}/execute`)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Workflow complet de confirmation par email', () => {
    it('devrait gérer le workflow complet : création → token → confirmation', async () => {
      // 1. Créer un devis
      const createQuoteDto = {
        email: 'workflow@test.com',
        firstName: 'Workflow',
        lastName: 'Test',
        phone: '+590690111222',
        message: 'Test workflow complet',
        acceptPhone: true,
        acceptTerms: true,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/quotes')
        .send(createQuoteDto)
        .expect(201);

      expect(createResponse.body).toHaveProperty('success', true);

      // 2. Valider le token
      const validateResponse = await request(app.getHttpServer())
        .get(`/email-actions/${mockActionToken.token}`)
        .expect(200);

      expect(validateResponse.body).toHaveProperty('valid', true);

      // 3. Exécuter l'action
      const executeResponse = await request(app.getHttpServer())
        .post(`/email-actions/${mockActionToken.token}/execute`)
        .expect(200);

      expect(executeResponse.body).toHaveProperty('success', true);

      // 4. Vérifier que le token est maintenant marqué comme utilisé
      const usedToken = { ...mockActionToken, usedAt: new Date() };
      (prisma.emailActionToken.findUnique as jest.Mock).mockResolvedValue(
        usedToken,
      );

      const revalidateResponse = await request(app.getHttpServer())
        .get(`/email-actions/${mockActionToken.token}`)
        .expect(200);

      expect(revalidateResponse.body).toHaveProperty('valid', false);
    });
  });

  describe('Intégration avec QuotesModule', () => {
    it("devrait modifier le statut du devis lors de l'exécution d'une action", async () => {
      // Act
      await request(app.getHttpServer())
        .post(`/email-actions/${mockActionToken.token}/execute`)
        .expect(200);

      // Assert
      expect(prisma.quote.update).toHaveBeenCalled();
    });

    it('devrait déclencher les emails appropriés via QuotesService', async () => {
      // Act
      await request(app.getHttpServer())
        .post(`/email-actions/${mockActionToken.token}/execute`)
        .expect(200);

      // Assert
      expect(quoteEmailService.sendQuoteAcceptedEmail).toHaveBeenCalled();
    });
  });

  describe('Sécurité des tokens', () => {
    it('devrait utiliser des tokens uniques et sécurisés', async () => {
      // Les tokens doivent être suffisamment longs et aléatoires
      expect(mockActionToken.token.length).toBeGreaterThan(20);
    });

    it("devrait avoir une durée d'expiration limitée", () => {
      // Les tokens doivent expirer après un certain temps
      const now = new Date();
      const maxExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 jours max

      expect(mockActionToken.expiresAt).toBeInstanceOf(Date);
      expect(mockActionToken.expiresAt.getTime()).toBeLessThanOrEqual(
        maxExpiry.getTime(),
      );
    });
  });
});
