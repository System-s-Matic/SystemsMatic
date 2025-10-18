import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentValidationService } from '../../src/appointments/services/appointment-validation.service';
import { BadRequestException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';

describe('AppointmentValidationService', () => {
  let service: AppointmentValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppointmentValidationService],
    }).compile();

    service = module.get<AppointmentValidationService>(
      AppointmentValidationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('TU09 - processRequestedDate (convertToUTC)', () => {
    it('devrait convertir une date locale vers UTC correctement', () => {
      // Arrange
      const localDate = '2025-12-01T10:00:00-04:00'; // Guadeloupe time
      const timezone = 'America/Guadeloupe';

      // Act
      const result = service.processRequestedDate(localDate);

      // Assert
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBeTruthy();
    });

    it('devrait gérer les dates déjà en objet Date', () => {
      // Arrange
      const date = new Date('2025-12-01T14:00:00.000Z');
      const timezone = 'America/Guadeloupe';

      // Act
      const result = service.processRequestedDate(date);

      // Assert
      expect(result).toBeInstanceOf(Date);
      expect(result).toEqual(date);
    });

    it('devrait lever une exception pour une date invalide', () => {
      // Arrange
      const invalidDate = 'invalid-date-string';
      const timezone = 'America/Guadeloupe';

      // Act & Assert
      expect(() => service.processRequestedDate(invalidDate)).toThrow(
        BadRequestException,
      );
    });

    it('devrait préserver la précision temporelle lors de la conversion', () => {
      // Arrange
      const date = '2025-12-01T10:30:45-04:00';
      const timezone = 'America/Guadeloupe';

      // Act
      const result = service.processRequestedDate(date);

      // Assert
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(45);
    });
  });

  describe('canCancelAppointment', () => {
    it('devrait retourner true pour un rendez-vous annulable (>24h)', () => {
      // Arrange
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000); // +48h
      const appointment = {
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: futureDate,
      };

      // Act
      const result = service.canCancelAppointment(appointment);

      // Assert
      expect(result).toBe(true);
    });

    it('devrait retourner false pour un rendez-vous dans moins de 24h', () => {
      // Arrange
      const nearDate = new Date(Date.now() + 12 * 60 * 60 * 1000); // +12h
      const appointment = {
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: nearDate,
      };

      // Act
      const result = service.canCancelAppointment(appointment);

      // Assert
      expect(result).toBe(false);
    });

    it("devrait retourner false si le rendez-vous n'est pas confirmé", () => {
      // Arrange
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const appointment = {
        status: AppointmentStatus.PENDING,
        scheduledAt: futureDate,
      };

      // Act
      const result = service.canCancelAppointment(appointment);

      // Assert
      expect(result).toBe(false);
    });

    it('devrait retourner false si scheduledAt est null', () => {
      // Arrange
      const appointment = {
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: null,
      };

      // Act
      const result = service.canCancelAppointment(appointment);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('validateCancellation', () => {
    it("devrait valider l'annulation avec un token correct et délai >24h", () => {
      // Arrange
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const appointment = {
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: futureDate,
        cancellationToken: 'valid-token',
      };

      // Act & Assert
      expect(() =>
        service.validateCancellation(appointment, 'valid-token'),
      ).not.toThrow();
    });

    it('devrait lever une exception avec un token invalide', () => {
      // Arrange
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const appointment = {
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: futureDate,
        cancellationToken: 'valid-token',
      };

      // Act & Assert
      expect(() =>
        service.validateCancellation(appointment, 'invalid-token'),
      ).toThrow(BadRequestException);
    });

    it('devrait lever une exception si le délai est <24h', () => {
      // Arrange
      const nearDate = new Date(Date.now() + 12 * 60 * 60 * 1000);
      const appointment = {
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: nearDate,
        cancellationToken: 'valid-token',
      };

      // Act & Assert
      expect(() =>
        service.validateCancellation(appointment, 'valid-token'),
      ).toThrow(BadRequestException);
    });

    it("devrait permettre l'annulation d'un rendez-vous RESCHEDULED", () => {
      // Arrange
      const nearDate = new Date(Date.now() + 12 * 60 * 60 * 1000);
      const appointment = {
        status: AppointmentStatus.RESCHEDULED,
        scheduledAt: nearDate,
        cancellationToken: 'valid-token',
      };

      // Act & Assert
      expect(() =>
        service.validateCancellation(appointment, 'valid-token'),
      ).not.toThrow();
    });
  });

  describe('validateConfirmation', () => {
    it("devrait valider la confirmation d'un rendez-vous PENDING", () => {
      // Arrange
      const appointment = {
        status: AppointmentStatus.PENDING,
      };

      // Act & Assert
      expect(() => service.validateConfirmation(appointment)).not.toThrow();
    });

    it("devrait valider la confirmation d'un rendez-vous RESCHEDULED", () => {
      // Arrange
      const appointment = {
        status: AppointmentStatus.RESCHEDULED,
      };

      // Act & Assert
      expect(() => service.validateConfirmation(appointment)).not.toThrow();
    });

    it('devrait lever une exception pour un rendez-vous déjà confirmé', () => {
      // Arrange
      const appointment = {
        status: AppointmentStatus.CONFIRMED,
      };

      // Act & Assert
      expect(() => service.validateConfirmation(appointment)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateRescheduleDate', () => {
    it('devrait valider une date de reprogrammation valide', () => {
      // Arrange
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      futureDate.setHours(10, 0, 0, 0); // 10:00
      const dateStr = futureDate.toISOString();

      // Act
      const result = service.validateRescheduleDate(dateStr);

      // Assert
      expect(result).toBeDefined();
    });

    it("devrait rejeter une date avec moins de 24h d'avance", () => {
      // Arrange
      const nearDate = new Date(Date.now() + 12 * 60 * 60 * 1000);
      const dateStr = nearDate.toISOString();

      // Act & Assert
      expect(() => service.validateRescheduleDate(dateStr)).toThrow(
        BadRequestException,
      );
    });

    it('devrait rejeter une date hors des créneaux autorisés (avant 8h)', () => {
      // Arrange
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      futureDate.setHours(7, 0, 0, 0);
      const dateStr = futureDate.toISOString();

      // Act & Assert
      expect(() => service.validateRescheduleDate(dateStr)).toThrow(
        BadRequestException,
      );
    });

    it('devrait rejeter une date hors des créneaux autorisés (après 17h)', () => {
      // Arrange
      // Créer une date à 18h en heure de Guadeloupe (UTC-4)
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      futureDate.setUTCHours(22, 0, 0, 0); // 22:00 UTC = 18:00 Guadeloupe (UTC-4)
      const dateStr = futureDate.toISOString();

      // Act & Assert
      expect(() => service.validateRescheduleDate(dateStr)).toThrow(
        BadRequestException,
      );
    });

    it('devrait rejeter les minutes non valides (pas 0 ou 30)', () => {
      // Arrange
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      futureDate.setHours(10, 15, 0, 0);
      const dateStr = futureDate.toISOString();

      // Act & Assert
      expect(() => service.validateRescheduleDate(dateStr)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('isValidTimeSlot', () => {
    it('devrait retourner true pour un créneau du matin valide (8h-12h)', () => {
      // Arrange
      const date = new Date('2025-12-01T12:00:00.000Z'); // 8h Guadeloupe

      // Act
      const result = service.isValidTimeSlot(date, 'America/Guadeloupe');

      // Assert
      expect(result).toBe(true);
    });

    it("devrait retourner true pour un créneau d'après-midi valide (14h-17h)", () => {
      // Arrange
      const date = new Date('2025-12-01T18:00:00.000Z'); // 14h Guadeloupe

      // Act
      const result = service.isValidTimeSlot(date, 'America/Guadeloupe');

      // Assert
      expect(result).toBe(true);
    });

    it('devrait retourner false pour un créneau hors horaires', () => {
      // Arrange
      const date = new Date('2025-12-01T00:00:00.000Z'); // 20h Guadeloupe (veille)

      // Act
      const result = service.isValidTimeSlot(date, 'America/Guadeloupe');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('devrait générer un token aléatoire', () => {
      // Act
      const token = service.generateToken();

      // Assert
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(10);
    });

    it('devrait générer des tokens différents à chaque appel', () => {
      // Act
      const token1 = service.generateToken();
      const token2 = service.generateToken();

      // Assert
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateSecurityTokens', () => {
    it("devrait générer à la fois un token de confirmation et d'annulation", () => {
      // Act
      const tokens = service.generateSecurityTokens();

      // Assert
      expect(tokens.confirmationToken).toBeTruthy();
      expect(tokens.cancellationToken).toBeTruthy();
      expect(tokens.confirmationToken).not.toBe(tokens.cancellationToken);
    });
  });
});
