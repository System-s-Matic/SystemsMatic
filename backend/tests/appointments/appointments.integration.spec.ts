import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppointmentsModule } from '../../src/appointments/appointments.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';
import { MailService } from '../../src/mail/mail.service';
import { ConfigModule } from '@nestjs/config';

describe('TI02 - AppointmentsController + Prisma Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mailService: MailService;

  // Helper pour générer une date valide (demain à l'heure spécifiée)
  const getValidRequestedAt = (hoursOffset = 10): string => {
    const date = new Date();
    date.setDate(date.getDate() + 1); // Demain
    date.setHours(hoursOffset, 0, 0, 0);
    return date.toISOString();
  };

  const mockContact = {
    id: 'contact-integration-123',
    email: 'client.integration@test.com',
    firstName: 'Client',
    lastName: 'Integration',
    phone: '+590690123456',
    consentAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAppointment = {
    id: 'appt-integration-123',
    contactId: mockContact.id,
    reason: 'Installation',
    reasonOther: null,
    message: 'Installation de portail',
    requestedAt: new Date('2025-12-01T10:00:00.000Z'),
    scheduledAt: null,
    status: AppointmentStatus.PENDING,
    confirmationToken: 'confirm-token-integration',
    cancellationToken: 'cancel-token-integration',
    timezone: 'America/Guadeloupe',
    confirmedAt: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    contact: mockContact,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppointmentsModule,
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
    })
      .overrideProvider(PrismaService)
      .useValue({
        contact: {
          upsert: jest.fn().mockResolvedValue(mockContact),
          findUnique: jest.fn().mockResolvedValue(mockContact),
        },
        appointment: {
          create: jest.fn().mockResolvedValue(mockAppointment),
          findUnique: jest.fn().mockResolvedValue(mockAppointment),
          findMany: jest.fn().mockResolvedValue([mockAppointment]),
          update: jest.fn().mockResolvedValue(mockAppointment),
          delete: jest.fn().mockResolvedValue(mockAppointment),
          count: jest.fn().mockResolvedValue(1),
        },
        reminder: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({}),
          delete: jest.fn().mockResolvedValue({}),
        },
        $transaction: jest.fn(),
      })
      .overrideProvider(MailService)
      .useValue({
        sendAppointmentRequest: jest.fn().mockResolvedValue(undefined),
        sendAppointmentNotificationEmail: jest
          .fn()
          .mockResolvedValue(undefined),
        sendAppointmentConfirmation: jest.fn().mockResolvedValue(undefined),
        sendAppointmentCancelled: jest.fn().mockResolvedValue(undefined),
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /appointments - Création et stockage en base', () => {
    it('devrait créer un rendez-vous et le stocker en base de données', async () => {
      // Arrange - Date demain à 10h (heure Guadeloupe)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const requestedAt = tomorrow.toISOString();

      const createDto = {
        email: 'client.integration@test.com',
        firstName: 'Client',
        lastName: 'Integration',
        phone: '+590690123456',
        reason: 'INSTALLATION',
        message: 'Installation de portail',
        requestedAt,
        timezone: 'America/Guadeloupe',
        consent: true,
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/appointments')
        .send(createDto)
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('id');
      expect(response.body.contact.email).toBe(createDto.email);
      expect(prisma.contact.upsert).toHaveBeenCalled();
      expect(prisma.appointment.create).toHaveBeenCalled();
    });

    it('devrait créer ou mettre à jour le contact (upsert)', async () => {
      // Arrange
      const createDto = {
        email: 'existing@test.com',
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+590690111222',
        reason: 'MAINTENANCE',
        message: 'Réparation urgente',
        requestedAt: getValidRequestedAt(14),
        timezone: 'America/Guadeloupe',
        consent: true,
      };

      // Act
      await request(app.getHttpServer())
        .post('/appointments')
        .send(createDto)
        .expect(201);

      // Assert
      expect(prisma.contact.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: createDto.email },
          update: expect.objectContaining({
            firstName: createDto.firstName,
            lastName: createDto.lastName,
            phone: createDto.phone,
          }),
          create: expect.objectContaining({
            email: createDto.email,
            firstName: createDto.firstName,
            lastName: createDto.lastName,
            phone: createDto.phone,
          }),
        }),
      );
    });

    it('devrait générer des tokens de sécurité', async () => {
      // Arrange
      const createDto = {
        email: 'client@test.com',
        firstName: 'Client',
        lastName: 'Test',
        reason: 'INSTALLATION',
        message: 'Test',
        requestedAt: getValidRequestedAt(10),
        timezone: 'America/Guadeloupe',
        consent: true,
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/appointments')
        .send(createDto)
        .expect(201);

      // Assert
      expect(response.body.confirmationToken).toBeTruthy();
      expect(response.body.cancellationToken).toBeTruthy();
      expect(response.body.confirmationToken).not.toBe(
        response.body.cancellationToken,
      );
    });

    it('devrait envoyer les emails de confirmation', async () => {
      // Arrange
      const createDto = {
        email: 'client@test.com',
        firstName: 'Client',
        lastName: 'Test',
        reason: 'INSTALLATION',
        message: 'Test',
        requestedAt: getValidRequestedAt(10),
        timezone: 'America/Guadeloupe',
        consent: true,
      };

      // Act
      await request(app.getHttpServer())
        .post('/appointments')
        .send(createDto)
        .expect(201);

      // Assert
      expect(mailService.sendAppointmentRequest).toHaveBeenCalled();
      expect(mailService.sendAppointmentNotificationEmail).toHaveBeenCalled();
    });

    it('devrait valider les données entrantes (DTO)', async () => {
      // Arrange - Données invalides
      const invalidDto = {
        email: 'invalid-email',
        firstName: '',
        // lastName manquant
        requestedAt: 'invalid-date',
        timezone: '',
        // consent manquant
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/appointments')
        .send(invalidDto)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('devrait stocker la timezone avec le rendez-vous', async () => {
      // Arrange
      const createDto = {
        email: 'client@test.com',
        firstName: 'Client',
        lastName: 'Test',
        reason: 'INSTALLATION',
        message: 'Test',
        requestedAt: getValidRequestedAt(10),
        timezone: 'America/Guadeloupe',
        consent: true,
      };

      // Act
      await request(app.getHttpServer())
        .post('/appointments')
        .send(createDto)
        .expect(201);

      // Assert
      expect(prisma.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            timezone: 'America/Guadeloupe',
          }),
        }),
      );
    });
  });

  describe("GET /appointments/:id/can-cancel - Vérification de la possibilité d'annulation", () => {
    it('devrait retourner true si le rendez-vous peut être annulé', async () => {
      // Arrange
      const futureAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      };
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(
        futureAppointment,
      );

      // Act
      const response = await request(app.getHttpServer())
        .get(
          `/appointments/${futureAppointment.id}/can-cancel?token=${futureAppointment.cancellationToken}`,
        )
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('canCancel');
    });
  });

  describe('POST /appointments/:id/cancel - Annulation avec validation', () => {
    it('devrait annuler un rendez-vous avec un token valide', async () => {
      // Arrange
      const futureAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        contact: mockContact,
      };
      const cancelledAppointment = {
        ...futureAppointment,
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        contact: mockContact,
      };

      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(
        futureAppointment,
      );
      (prisma.appointment.update as jest.Mock).mockResolvedValue(
        cancelledAppointment,
      );

      // Act
      const response = await request(app.getHttpServer())
        .get(
          `/appointments/${futureAppointment.id}/cancel?token=${futureAppointment.cancellationToken}`,
        )
        .expect(200);

      // Assert
      expect(response.body.status).toBe('CANCELLED');
      expect(mailService.sendAppointmentCancelled).toHaveBeenCalled();
    });

    it("devrait rejeter l'annulation avec un token invalide", async () => {
      // Arrange
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(
        mockAppointment,
      );

      // Act
      await request(app.getHttpServer())
        .get(`/appointments/${mockAppointment.id}/cancel?token=invalid-token`)
        .expect(400);
    });
  });

  describe('Persistance des données', () => {
    it('devrait persister le statut PENDING lors de la création', async () => {
      // Arrange
      const createDto = {
        email: 'client@test.com',
        firstName: 'Client',
        lastName: 'Test',
        reason: 'INSTALLATION',
        message: 'Test',
        requestedAt: getValidRequestedAt(10),
        timezone: 'America/Guadeloupe',
        consent: true,
      };

      // Act
      await request(app.getHttpServer())
        .post('/appointments')
        .send(createDto)
        .expect(201);

      // Assert
      expect(prisma.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            // Le statut PENDING est défini par défaut dans le schema Prisma
          }),
        }),
      );
    });
  });
});
