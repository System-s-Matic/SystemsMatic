import { validate } from 'class-validator';
import { CreateAppointmentDto } from '../../src/appointments/dto/create-appointments.dto';
import { ConfirmAppointmentDto } from '../../src/appointments/dto/confirm-appointments.dto';
import { AppointmentReason } from '@prisma/client';

describe('TU10 - DTO Validation', () => {
  // Helper pour générer une date valide (demain à l'heure spécifiée)
  const getValidRequestedAt = (hoursOffset = 10): string => {
    const date = new Date();
    date.setDate(date.getDate() + 1); // Demain
    date.setHours(hoursOffset, 0, 0, 0);
    return date.toISOString();
  };

  describe('CreateAppointmentDto', () => {
    it('devrait valider un DTO complet et correct', async () => {
      // Arrange
      const dto = new CreateAppointmentDto();
      dto.firstName = 'Jacques';
      dto.lastName = 'Lefebvre';
      dto.email = 'jacques.lefebvre@test.com';
      dto.phone = '+590690123456';
      dto.reason = AppointmentReason.INSTALLATION;
      dto.message = 'Installation de portail coulissant';
      dto.requestedAt = getValidRequestedAt(10);
      dto.timezone = 'America/Guadeloupe';
      dto.consent = true;

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('devrait rejeter un email invalide', async () => {
      // Arrange
      const dto = new CreateAppointmentDto();
      dto.firstName = 'Jacques';
      dto.lastName = 'Lefebvre';
      dto.email = 'invalid-email';
      dto.phone = '+590690123456';
      dto.requestedAt = getValidRequestedAt(10);
      dto.timezone = 'America/Guadeloupe';
      dto.consent = true;

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('devrait rejeter un firstName vide', async () => {
      // Arrange
      const dto = new CreateAppointmentDto();
      dto.firstName = '';
      dto.lastName = 'Lefebvre';
      dto.email = 'jacques@test.com';
      dto.requestedAt = getValidRequestedAt(10);
      dto.timezone = 'America/Guadeloupe';
      dto.consent = true;

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'firstName')).toBe(true);
    });

    it('devrait rejeter un lastName vide', async () => {
      // Arrange
      const dto = new CreateAppointmentDto();
      dto.firstName = 'Jacques';
      dto.lastName = '';
      dto.email = 'jacques@test.com';
      dto.requestedAt = getValidRequestedAt(10);
      dto.timezone = 'America/Guadeloupe';
      dto.consent = true;

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'lastName')).toBe(true);
    });

    it('devrait rejeter une date invalide', async () => {
      // Arrange
      const dto = new CreateAppointmentDto();
      dto.firstName = 'Jacques';
      dto.lastName = 'Lefebvre';
      dto.email = 'jacques@test.com';
      dto.requestedAt = 'invalid-date';
      dto.timezone = 'America/Guadeloupe';
      dto.consent = true;

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'requestedAt')).toBe(true);
    });

    it('devrait rejeter une timezone vide', async () => {
      // Arrange
      const dto = new CreateAppointmentDto();
      dto.firstName = 'Jacques';
      dto.lastName = 'Lefebvre';
      dto.email = 'jacques@test.com';
      dto.requestedAt = getValidRequestedAt(10);
      dto.timezone = '';
      dto.consent = true;

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'timezone')).toBe(true);
    });

    it('devrait rejeter consent manquant', async () => {
      // Arrange
      const dto = new CreateAppointmentDto();
      dto.firstName = 'Jacques';
      dto.lastName = 'Lefebvre';
      dto.email = 'jacques@test.com';
      dto.requestedAt = getValidRequestedAt(10);
      dto.timezone = 'America/Guadeloupe';
      // consent non défini

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'consent')).toBe(true);
    });

    it('devrait accepter les champs optionnels absents', async () => {
      // Arrange
      const dto = new CreateAppointmentDto();
      dto.firstName = 'Jacques';
      dto.lastName = 'Lefebvre';
      dto.email = 'jacques@test.com';
      dto.requestedAt = getValidRequestedAt(10);
      dto.timezone = 'America/Guadeloupe';
      dto.consent = true;
      // phone, reason, reasonOther, message sont optionnels

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('devrait valider requestedDurationMin si fourni', async () => {
      // Arrange
      const dto = new CreateAppointmentDto();
      dto.firstName = 'Jacques';
      dto.lastName = 'Lefebvre';
      dto.email = 'jacques@test.com';
      dto.requestedAt = getValidRequestedAt(10);
      dto.timezone = 'America/Guadeloupe';
      dto.consent = true;
      dto.requestedDurationMin = 30;

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('devrait rejeter requestedDurationMin < 15', async () => {
      // Arrange
      const dto = new CreateAppointmentDto();
      dto.firstName = 'Jacques';
      dto.lastName = 'Lefebvre';
      dto.email = 'jacques@test.com';
      dto.requestedAt = getValidRequestedAt(10);
      dto.timezone = 'America/Guadeloupe';
      dto.consent = true;
      dto.requestedDurationMin = 10;

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'requestedDurationMin')).toBe(
        true,
      );
    });
  });

  describe('ConfirmAppointmentDto', () => {
    it('devrait valider un DTO correct', async () => {
      // Arrange
      const dto = new ConfirmAppointmentDto();
      dto.scheduledAt = '2025-12-15T14:00:00.000Z';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('devrait rejeter une date invalide', async () => {
      // Arrange
      const dto = new ConfirmAppointmentDto();
      dto.scheduledAt = 'invalid-date';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'scheduledAt')).toBe(true);
    });

    it('devrait rejeter scheduledAt manquant', async () => {
      // Arrange
      const dto = new ConfirmAppointmentDto();
      // scheduledAt non défini

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'scheduledAt')).toBe(true);
    });
  });
});
