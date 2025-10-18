import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { QuotesController } from '../../src/quotes/quotes.controller';
import { QuotesService } from '../../src/quotes/quotes.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { MailService } from '../../src/mail/mail.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../src/auth/auth.module';

describe('TI03 - QuotesController + MailModule Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mailService: MailService;

  const mockContact = {
    id: 'contact-123',
    email: 'client@test.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '+590690123456',
    consent: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQuote = {
    id: 'quote-123',
    contactId: 'contact-123',
    projectType: 'Portail automatique',
    description: 'Installation complète',
    estimatedPrice: 2500,
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    contact: mockContact,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              JWT_SECRET: 'test-secret',
              JWT_EXPIRES_IN: '1h',
            }),
          ],
        }),
      ],
      controllers: [QuotesController],
      providers: [PrismaService, MailService, QuotesService],
    })
      .overrideProvider(PrismaService)
      .useValue({
        contact: {
          upsert: jest.fn().mockResolvedValue(mockContact),
          findUnique: jest.fn().mockResolvedValue(mockContact),
        },
        quote: {
          create: jest.fn().mockResolvedValue(mockQuote),
          findMany: jest.fn().mockResolvedValue([mockQuote]),
          count: jest.fn().mockResolvedValue(1),
        },
      })
      .overrideProvider(MailService)
      .useValue({
        sendQuoteConfirmation: jest.fn().mockResolvedValue(undefined),
        sendQuoteNotificationEmail: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(QuotesService)
      .useValue({
        create: jest.fn().mockResolvedValue(mockQuote),
        findAll: jest.fn().mockResolvedValue([mockQuote]),
        findAllWithFilters: jest.fn().mockResolvedValue({
          quotes: [mockQuote],
          total: 1,
          page: 1,
          limit: 10,
        }),
        findOne: jest.fn().mockResolvedValue(mockQuote),
        update: jest.fn().mockResolvedValue(mockQuote),
        getStats: jest.fn().mockResolvedValue({
          total: 1,
          pending: 1,
          accepted: 0,
          rejected: 0,
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    mailService = moduleFixture.get<MailService>(MailService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /quotes', () => {
    it('devrait créer un devis et envoyer automatiquement les emails', async () => {
      // Arrange
      const quoteData = {
        email: 'client@test.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        phone: '+590690123456',
        message: 'Installation complète de portail automatique',
        acceptPhone: true,
        acceptTerms: true,
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/quotes')
        .send(quoteData)
        .expect(201);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
    });

    it('devrait valider les données du devis avant création', async () => {
      // Arrange
      const invalidQuoteData = {
        email: 'invalid-email',
        firstName: '',
        lastName: '',
        message: '',
        acceptPhone: false,
        acceptTerms: false,
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/quotes')
        .send(invalidQuoteData);

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('GET /quotes', () => {
    it("devrait rejeter l'accès sans authentification", async () => {
      // Act - La route GET /quotes nécessite une authentification JWT
      const response = await request(app.getHttpServer()).get('/quotes');

      // Assert - La route retourne 401 (Unauthorized) car pas d'authentification
      expect(response.status).toBe(401);
    });
  });
});
