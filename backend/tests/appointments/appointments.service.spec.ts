import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from '../../src/appointments/appointments.service';
import { MailService } from '../../src/mail/mail.service';
import { AppointmentCrudService } from '../../src/appointments/services/appointment-crud.service';
import { AppointmentValidationService } from '../../src/appointments/services/appointment-validation.service';
import { AppointmentReminderService } from '../../src/appointments/services/appointment-reminder.service';
import { AppointmentAdminService } from '../../src/appointments/services/appointment-admin.service';
import { BadRequestException } from '@nestjs/common';
import { AppointmentStatus, AppointmentReason } from '@prisma/client';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let mailService: MailService;
  let crudService: AppointmentCrudService;
  let validationService: AppointmentValidationService;
  let reminderService: AppointmentReminderService;
  let adminService: AppointmentAdminService;

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

  const mockAppointment = {
    id: 'appt-123',
    contactId: 'contact-123',
    reason: AppointmentReason.INSTALLATION,
    reasonOther: null,
    message: 'Installation de portail automatique',
    requestedAt: new Date('2025-12-01T10:00:00.000Z'),
    scheduledAt: null,
    status: AppointmentStatus.PENDING,
    confirmationToken: 'confirm-token-123',
    cancellationToken: 'cancel-token-123',
    timezone: 'America/Guadeloupe',
    confirmedAt: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    contact: mockContact,
  };

  const mockMailService = {
    sendAppointmentRequest: jest.fn().mockResolvedValue(undefined),
    sendAppointmentNotificationEmail: jest.fn().mockResolvedValue(undefined),
    sendAppointmentConfirmation: jest.fn().mockResolvedValue(undefined),
    sendAppointmentCancelled: jest.fn().mockResolvedValue(undefined),
  };

  const mockCrudService = {
    upsertContact: jest.fn().mockResolvedValue(mockContact),
    create: jest.fn().mockResolvedValue(mockAppointment),
    findByIdAdmin: jest.fn().mockResolvedValue(mockAppointment),
    findByIdWithContact: jest.fn().mockResolvedValue(mockAppointment),
    updateStatus: jest.fn().mockResolvedValue({
      ...mockAppointment,
      status: AppointmentStatus.CONFIRMED,
    }),
    findAllWithStatus: jest.fn().mockResolvedValue([mockAppointment]),
  };

  const mockValidationService = {
    generateSecurityTokens: jest.fn().mockReturnValue({
      confirmationToken: 'confirm-token-123',
      cancellationToken: 'cancel-token-123',
    }),
    processRequestedDate: jest.fn((date) => new Date(date)),
    validateConfirmation: jest.fn(),
    validateCancellation: jest.fn(),
    canCancelAppointment: jest.fn().mockReturnValue(true),
    canCancelCheck: jest
      .fn()
      .mockResolvedValue({ canCancel: true, remainingHours: 48 }),
  };

  const mockReminderService = {
    createReminder: jest.fn().mockResolvedValue(undefined),
    deleteReminder: jest.fn().mockResolvedValue(undefined),
    updateReminder: jest.fn().mockResolvedValue(undefined),
  };

  const mockAdminService = {
    updateStatus: jest.fn(),
    cancelAppointment: jest.fn(),
    reschedule: jest.fn(),
    delete: jest.fn(),
    sendReminder: jest.fn(),
    proposeReschedule: jest.fn(),
    getUpcoming: jest.fn(),
    getStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: AppointmentCrudService,
          useValue: mockCrudService,
        },
        {
          provide: AppointmentValidationService,
          useValue: mockValidationService,
        },
        {
          provide: AppointmentReminderService,
          useValue: mockReminderService,
        },
        {
          provide: AppointmentAdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    mailService = module.get<MailService>(MailService);
    crudService = module.get<AppointmentCrudService>(AppointmentCrudService);
    validationService = module.get<AppointmentValidationService>(
      AppointmentValidationService,
    );
    reminderService = module.get<AppointmentReminderService>(
      AppointmentReminderService,
    );
    adminService = module.get<AppointmentAdminService>(AppointmentAdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('TU03 - create()', () => {
    it('devrait créer un rendez-vous valide avec toutes les données', async () => {
      // Arrange
      const createDto = {
        email: 'client@test.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        phone: '+590690123456',
        reason: AppointmentReason.INSTALLATION,
        reasonOther: null,
        message: 'Installation de portail automatique',
        requestedAt: '2025-12-01T10:00:00.000Z',
        timezone: 'America/Guadeloupe',
        consent: true,
      };

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('appt-123');
      expect(crudService.upsertContact).toHaveBeenCalledWith({
        email: createDto.email,
        firstName: createDto.firstName,
        lastName: createDto.lastName,
        phone: createDto.phone,
        consent: createDto.consent,
      });
      expect(crudService.create).toHaveBeenCalled();
      expect(mailService.sendAppointmentRequest).toHaveBeenCalledWith(
        mockContact,
        mockAppointment,
      );
      expect(mailService.sendAppointmentNotificationEmail).toHaveBeenCalledWith(
        mockContact,
        mockAppointment,
      );
    });

    it('devrait générer les tokens de sécurité', async () => {
      // Arrange
      const createDto = {
        email: 'client@test.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        phone: '+590690123456',
        reason: AppointmentReason.MAINTENANCE,
        reasonOther: null,
        message: 'Réparation urgente',
        requestedAt: '2025-12-01T14:00:00.000Z',
        timezone: 'America/Guadeloupe',
        consent: true,
      };

      // Act
      await service.create(createDto);

      // Assert
      expect(validationService.generateSecurityTokens).toHaveBeenCalled();
    });

    it('devrait traiter la date avec la timezone correcte', async () => {
      // Arrange
      const createDto = {
        email: 'client@test.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        phone: '+590690123456',
        reason: AppointmentReason.INSTALLATION,
        reasonOther: null,
        message: 'Test',
        requestedAt: '2025-12-01T10:00:00.000Z',
        timezone: 'America/Guadeloupe',
        consent: true,
      };

      // Act
      await service.create(createDto);

      // Assert
      expect(validationService.processRequestedDate).toHaveBeenCalledWith(
        createDto.requestedAt,
      );
    });
  });

  describe('TU04 - validateDate()', () => {
    it('devrait empêcher la création avec une date passée', async () => {
      // Arrange
      const pastDate = new Date('2020-01-01T10:00:00.000Z');
      mockValidationService.processRequestedDate.mockImplementation(() => {
        throw new BadRequestException('Date invalide reçue');
      });

      const createDto = {
        email: 'client@test.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        phone: '+590690123456',
        reason: AppointmentReason.INSTALLATION,
        reasonOther: null,
        message: 'Test',
        requestedAt: pastDate.toISOString(),
        timezone: 'America/Guadeloupe',
        consent: true,
      };

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('confirm()', () => {
    it('devrait confirmer un rendez-vous et créer un rappel', async () => {
      // Arrange
      const confirmedAppt = {
        ...mockAppointment,
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: new Date('2025-12-15T14:00:00.000Z'),
        confirmedAt: new Date(),
      };
      mockCrudService.updateStatus.mockResolvedValue(confirmedAppt);

      // Act
      const result = await service.confirm('appt-123', {
        scheduledAt: '2025-12-15T14:00:00.000Z',
      });

      // Assert
      expect(result.status).toBe(AppointmentStatus.CONFIRMED);
      expect(validationService.validateConfirmation).toHaveBeenCalled();
      expect(reminderService.createReminder).toHaveBeenCalledWith(
        confirmedAppt.id,
        confirmedAppt.scheduledAt,
      );
      expect(mailService.sendAppointmentConfirmation).toHaveBeenCalledWith(
        confirmedAppt,
      );
    });
  });

  describe('canCancelAppointment()', () => {
    it('devrait retourner true si le rendez-vous peut être annulé (>24h)', async () => {
      // Arrange
      const appointment = {
        ...mockAppointment,
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // +48h
      };
      mockValidationService.canCancelAppointment.mockReturnValue(true);

      // Act
      const result = service.canCancelAppointment(appointment as any);

      // Assert
      expect(result).toBe(true);
    });

    it('devrait retourner false si le rendez-vous est dans moins de 24h', async () => {
      // Arrange
      const appointment = {
        ...mockAppointment,
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // +12h
      };
      mockValidationService.canCancelAppointment.mockReturnValue(false);

      // Act
      const result = service.canCancelAppointment(appointment as any);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('cancel()', () => {
    it('devrait annuler un rendez-vous et supprimer le rappel', async () => {
      // Arrange
      const cancelledAppt = {
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
      };
      mockCrudService.updateStatus.mockResolvedValue(cancelledAppt);

      // Act
      const result = await service.cancel('appt-123', 'cancel-token-123');

      // Assert
      expect(validationService.validateCancellation).toHaveBeenCalled();
      expect(reminderService.deleteReminder).toHaveBeenCalledWith('appt-123');
      expect(result.status).toBe(AppointmentStatus.CANCELLED);
      expect(mailService.sendAppointmentCancelled).toHaveBeenCalledWith(
        cancelledAppt,
      );
    });

    it('devrait lever une exception avec un token invalide', async () => {
      // Arrange
      mockValidationService.validateCancellation.mockImplementation(() => {
        throw new BadRequestException('Token invalide');
      });

      // Act & Assert
      await expect(service.cancel('appt-123', 'invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it("devrait lever une exception si le rendez-vous n'existe pas", async () => {
      // Arrange
      mockCrudService.findByIdWithContact.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.cancel('appt-123', 'cancel-token-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmByToken()', () => {
    it('devrait confirmer un rendez-vous avec un token valide', async () => {
      // Arrange
      const appointmentWithToken = {
        ...mockAppointment,
        confirmationToken: 'valid-token',
        scheduledAt: new Date('2025-12-15T14:00:00.000Z'),
      };
      mockCrudService.findByIdWithContact.mockResolvedValue(
        appointmentWithToken,
      );
      mockCrudService.updateStatus.mockResolvedValue({
        ...appointmentWithToken,
        status: AppointmentStatus.CONFIRMED,
      });

      // Act
      const result = await service.confirmByToken('appt-123', 'valid-token');

      // Assert
      expect(result.status).toBe(AppointmentStatus.CONFIRMED);
      expect(crudService.findByIdWithContact).toHaveBeenCalledWith('appt-123');
    });

    it('devrait lever une exception avec un token invalide', async () => {
      // Arrange
      const appointmentWithToken = {
        ...mockAppointment,
        confirmationToken: 'valid-token',
        scheduledAt: new Date('2025-12-15T14:00:00.000Z'),
      };
      mockCrudService.findByIdWithContact.mockResolvedValue(
        appointmentWithToken,
      );

      // Act & Assert
      await expect(
        service.confirmByToken('appt-123', 'invalid-token'),
      ).rejects.toThrow(BadRequestException);
    });

    it('devrait lever une exception si aucun rendez-vous trouvé', async () => {
      // Arrange
      mockCrudService.findByIdWithContact.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.confirmByToken('appt-123', 'valid-token'),
      ).rejects.toThrow(BadRequestException);
    });

    it('devrait lever une exception si aucune date programmée', async () => {
      // Arrange
      const appointmentWithoutDate = {
        ...mockAppointment,
        confirmationToken: 'valid-token',
        scheduledAt: null,
      };
      mockCrudService.findByIdWithContact.mockResolvedValue(
        appointmentWithoutDate,
      );

      // Act & Assert
      await expect(
        service.confirmByToken('appt-123', 'valid-token'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('canCancelCheck()', () => {
    it("devrait retourner les informations de vérification d'annulation", async () => {
      // Arrange
      const appointment = {
        ...mockAppointment,
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      };
      mockCrudService.findByIdWithContact.mockResolvedValue(appointment);
      mockValidationService.canCancelCheck.mockResolvedValue({
        canCancel: true,
        remainingHours: 48,
      });

      // Act
      const result = await service.canCancelCheck(
        'appt-123',
        'cancel-token-123',
      );

      // Assert
      expect(result).toEqual({ canCancel: true, remainingHours: 48 });
      expect(crudService.findByIdWithContact).toHaveBeenCalledWith('appt-123');
      expect(validationService.canCancelCheck).toHaveBeenCalledWith(
        appointment,
        'cancel-token-123',
      );
    });

    it("devrait lever une exception si le rendez-vous n'existe pas", async () => {
      // Arrange
      mockCrudService.findByIdWithContact.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.canCancelCheck('appt-123', 'cancel-token-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('acceptReschedule()', () => {
    it('devrait accepter une reprogrammation avec un token valide', async () => {
      // Arrange
      const rescheduledAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.RESCHEDULED,
        confirmationToken: 'valid-token',
        scheduledAt: new Date('2025-12-20T14:00:00.000Z'),
      };
      mockCrudService.findByIdWithContact.mockResolvedValue(
        rescheduledAppointment,
      );
      mockCrudService.updateStatus.mockResolvedValue({
        ...rescheduledAppointment,
        status: AppointmentStatus.CONFIRMED,
        confirmedAt: new Date(),
      });

      // Act
      const result = await service.acceptReschedule('appt-123', 'valid-token');

      // Assert
      expect(result.status).toBe(AppointmentStatus.CONFIRMED);
      expect(reminderService.updateReminder).toHaveBeenCalledWith(
        rescheduledAppointment.id,
        rescheduledAppointment.scheduledAt,
      );
      expect(mailService.sendAppointmentConfirmation).toHaveBeenCalled();
    });

    it("devrait lever une exception si le rendez-vous n'existe pas", async () => {
      // Arrange
      mockCrudService.findByIdWithContact.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.acceptReschedule('appt-123', 'valid-token'),
      ).rejects.toThrow(BadRequestException);
    });

    it('devrait lever une exception avec un token invalide', async () => {
      // Arrange
      const rescheduledAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.RESCHEDULED,
        confirmationToken: 'valid-token',
      };
      mockCrudService.findByIdWithContact.mockResolvedValue(
        rescheduledAppointment,
      );

      // Act & Assert
      await expect(
        service.acceptReschedule('appt-123', 'invalid-token'),
      ).rejects.toThrow(BadRequestException);
    });

    it("devrait lever une exception si le rendez-vous n'est pas en attente de reprogrammation", async () => {
      // Arrange
      const appointment = {
        ...mockAppointment,
        status: AppointmentStatus.CONFIRMED,
        confirmationToken: 'valid-token',
      };
      mockCrudService.findByIdWithContact.mockResolvedValue(appointment);

      // Act & Assert
      await expect(
        service.acceptReschedule('appt-123', 'valid-token'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectReschedule()', () => {
    it('devrait refuser une reprogrammation et annuler le rendez-vous', async () => {
      // Arrange
      const rescheduledAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.RESCHEDULED,
        cancellationToken: 'valid-token',
      };
      mockCrudService.findByIdWithContact.mockResolvedValue(
        rescheduledAppointment,
      );
      mockCrudService.updateStatus.mockResolvedValue({
        ...rescheduledAppointment,
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
      });

      // Act
      const result = await service.rejectReschedule('appt-123', 'valid-token');

      // Assert
      expect(result.status).toBe(AppointmentStatus.CANCELLED);
      expect(reminderService.deleteReminder).toHaveBeenCalledWith('appt-123');
      expect(mailService.sendAppointmentCancelled).toHaveBeenCalled();
    });

    it("devrait lever une exception si le rendez-vous n'existe pas", async () => {
      // Arrange
      mockCrudService.findByIdWithContact.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.rejectReschedule('appt-123', 'valid-token'),
      ).rejects.toThrow(BadRequestException);
    });

    it("devrait lever une exception avec un token d'annulation invalide", async () => {
      // Arrange
      const rescheduledAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.RESCHEDULED,
        cancellationToken: 'valid-token',
      };
      mockCrudService.findByIdWithContact.mockResolvedValue(
        rescheduledAppointment,
      );

      // Act & Assert
      await expect(
        service.rejectReschedule('appt-123', 'invalid-token'),
      ).rejects.toThrow(BadRequestException);
    });

    it("devrait lever une exception si le rendez-vous n'est pas en attente de reprogrammation", async () => {
      // Arrange
      const appointment = {
        ...mockAppointment,
        status: AppointmentStatus.CONFIRMED,
        cancellationToken: 'valid-token',
      };
      mockCrudService.findByIdWithContact.mockResolvedValue(appointment);

      // Act & Assert
      await expect(
        service.rejectReschedule('appt-123', 'valid-token'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Administrative methods', () => {
    it('devrait récupérer tous les rendez-vous avec statut', async () => {
      // Arrange
      mockCrudService.findAllWithStatus.mockResolvedValue([mockAppointment]);

      // Act
      const result = await service.findAllAdmin(AppointmentStatus.PENDING);

      // Assert
      expect(result).toEqual([mockAppointment]);
      expect(crudService.findAllWithStatus).toHaveBeenCalledWith(
        AppointmentStatus.PENDING,
      );
    });

    it('devrait récupérer un rendez-vous par ID', async () => {
      // Act
      const result = await service.findOneAdmin('appt-123');

      // Assert
      expect(result).toBeDefined();
      expect(crudService.findByIdAdmin).toHaveBeenCalledWith('appt-123');
    });

    it("devrait mettre à jour le statut d'un rendez-vous (admin)", async () => {
      // Arrange
      const updateData = {
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: '2025-12-15T14:00:00.000Z',
      };
      mockAdminService.updateStatus.mockResolvedValue({
        ...mockAppointment,
        ...updateData,
      });

      // Act
      const result = await service.updateStatusAdmin('appt-123', updateData);

      // Assert
      expect(result).toBeDefined();
      expect(adminService.updateStatus).toHaveBeenCalledWith(
        'appt-123',
        updateData,
      );
    });

    it('devrait annuler un rendez-vous (admin)', async () => {
      // Arrange
      mockAdminService.cancelAppointment.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
      });

      // Act
      const result = await service.cancelAppointmentAdmin('appt-123');

      // Assert
      expect(result).toBeDefined();
      expect(adminService.cancelAppointment).toHaveBeenCalledWith('appt-123');
    });

    it('devrait reprogrammer un rendez-vous (admin)', async () => {
      // Arrange
      const rescheduleData = { scheduledAt: '2025-12-20T14:00:00.000Z' };
      mockAdminService.reschedule.mockResolvedValue({
        ...mockAppointment,
        scheduledAt: new Date(rescheduleData.scheduledAt),
      });

      // Act
      const result = await service.rescheduleAdmin('appt-123', rescheduleData);

      // Assert
      expect(result).toBeDefined();
      expect(adminService.reschedule).toHaveBeenCalledWith(
        'appt-123',
        rescheduleData,
      );
    });

    it('devrait supprimer un rendez-vous (admin)', async () => {
      // Arrange
      mockAdminService.delete.mockResolvedValue(undefined);

      // Act
      const result = await service.deleteAdmin('appt-123');

      // Assert
      expect(result).toBeUndefined();
      expect(adminService.delete).toHaveBeenCalledWith('appt-123');
    });

    it('devrait envoyer un rappel (admin)', async () => {
      // Arrange
      mockAdminService.sendReminder.mockResolvedValue(undefined);

      // Act
      const result = await service.sendReminderAdmin('appt-123');

      // Assert
      expect(result).toBeUndefined();
      expect(adminService.sendReminder).toHaveBeenCalledWith('appt-123');
    });

    it('devrait proposer une reprogrammation (admin)', async () => {
      // Arrange
      const newScheduledAt = '2025-12-25T14:00:00.000Z';
      mockAdminService.proposeReschedule.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.RESCHEDULED,
      });

      // Act
      const result = await service.proposeRescheduleAdmin(
        'appt-123',
        newScheduledAt,
      );

      // Assert
      expect(result).toBeDefined();
      expect(adminService.proposeReschedule).toHaveBeenCalledWith(
        'appt-123',
        newScheduledAt,
      );
    });

    it('devrait récupérer les rendez-vous à venir (admin)', async () => {
      // Arrange
      const upcomingAppointments = [mockAppointment];
      mockAdminService.getUpcoming.mockResolvedValue(upcomingAppointments);

      // Act
      const result = await service.getUpcomingAdmin(7);

      // Assert
      expect(result).toEqual(upcomingAppointments);
      expect(adminService.getUpcoming).toHaveBeenCalledWith(7);
    });

    it("devrait utiliser 7 jours par défaut si aucun paramètre n'est fourni", async () => {
      // Arrange
      const upcomingAppointments = [mockAppointment];
      mockAdminService.getUpcoming.mockResolvedValue(upcomingAppointments);

      // Act
      const result = await service.getUpcomingAdmin();

      // Assert
      expect(result).toEqual(upcomingAppointments);
      expect(adminService.getUpcoming).toHaveBeenCalledWith(7); // Vérifier que la valeur par défaut est utilisée
    });

    it('devrait récupérer les statistiques (admin)', async () => {
      // Arrange
      const stats = {
        total: 10,
        pending: 3,
        confirmed: 5,
        cancelled: 2,
      };
      mockAdminService.getStats.mockResolvedValue(stats);

      // Act
      const result = await service.getStatsAdmin();

      // Assert
      expect(result).toEqual(stats);
      expect(adminService.getStats).toHaveBeenCalled();
    });
  });
});
