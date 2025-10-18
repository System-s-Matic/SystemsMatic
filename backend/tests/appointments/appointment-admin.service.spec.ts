import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentAdminService } from '../../src/appointments/services/appointment-admin.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { MailService } from '../../src/mail/mail.service';
import { AppointmentCrudService } from '../../src/appointments/services/appointment-crud.service';
import { AppointmentValidationService } from '../../src/appointments/services/appointment-validation.service';
import { AppointmentReminderService } from '../../src/appointments/services/appointment-reminder.service';
import { AppointmentStatus } from '@prisma/client';

describe('AppointmentAdminService', () => {
  let service: AppointmentAdminService;
  let prismaService: jest.Mocked<PrismaService>;
  let mailService: jest.Mocked<MailService>;
  let crudService: jest.Mocked<AppointmentCrudService>;
  let validationService: jest.Mocked<AppointmentValidationService>;
  let reminderService: jest.Mocked<AppointmentReminderService>;

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
    requestedAt: new Date('2024-01-15T10:00:00Z'),
    scheduledAt: null,
    status: 'PENDING' as AppointmentStatus,
    confirmedAt: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    contact: mockContact,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentAdminService,
        {
          provide: PrismaService,
          useValue: {
            emailLog: {
              create: jest.fn(),
            },
          } as any,
        },
        {
          provide: MailService,
          useValue: {
            sendAppointmentConfirmation: jest.fn(),
            sendAppointmentCancelled: jest.fn(),
            sendAppointmentReminder: jest.fn(),
            sendAppointmentRescheduleProposal: jest.fn(),
          } as any,
        },
        {
          provide: AppointmentCrudService,
          useValue: {
            findByIdAdmin: jest.fn(),
            updateStatus: jest.fn(),
            delete: jest.fn(),
            findUpcoming: jest.fn(),
            countByStatus: jest.fn(),
          } as any,
        },
        {
          provide: AppointmentValidationService,
          useValue: {
            validateReminder: jest.fn(),
            validateReschedule: jest.fn(),
            validateRescheduleDate: jest.fn(),
          } as any,
        },
        {
          provide: AppointmentReminderService,
          useValue: {
            updateReminder: jest.fn(),
            deleteReminder: jest.fn(),
          } as any,
        },
      ],
    }).compile();

    service = module.get<AppointmentAdminService>(AppointmentAdminService);
    prismaService = module.get(PrismaService);
    mailService = module.get(MailService);
    crudService = module.get(AppointmentCrudService);
    validationService = module.get(AppointmentValidationService);
    reminderService = module.get(AppointmentReminderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('updateStatus', () => {
    it('devrait mettre à jour le statut avec confirmation automatique', async () => {
      // Arrange
      const id = 'appointment-123';
      const data = { status: AppointmentStatus.CONFIRMED };
      const updatedAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: mockAppointment.requestedAt,
        confirmedAt: expect.any(Date),
      };

      crudService.findByIdAdmin.mockResolvedValue(mockAppointment as any);
      crudService.updateStatus.mockResolvedValue(updatedAppointment as any);
      reminderService.updateReminder.mockResolvedValue(undefined);
      mailService.sendAppointmentConfirmation.mockResolvedValue(undefined);

      // Act
      const result = await service.updateStatus(id, data);

      // Assert
      expect(result).toEqual(updatedAppointment);
      expect(crudService.findByIdAdmin).toHaveBeenCalledWith(id);
      expect(crudService.updateStatus).toHaveBeenCalledWith(id, {
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: mockAppointment.requestedAt,
        confirmedAt: expect.any(Date),
      });
      expect(reminderService.updateReminder).toHaveBeenCalledWith(
        updatedAppointment.id,
        updatedAppointment.scheduledAt,
      );
      expect(mailService.sendAppointmentConfirmation).toHaveBeenCalledWith(
        updatedAppointment,
      );
    });

    it('devrait mettre à jour le statut avec date programmée', async () => {
      // Arrange
      const id = 'appointment-123';
      const data = {
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: '2024-01-20T14:00:00Z',
      };
      const updatedAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: new Date(data.scheduledAt),
        confirmedAt: expect.any(Date),
      };

      crudService.findByIdAdmin.mockResolvedValue(mockAppointment as any);
      crudService.updateStatus.mockResolvedValue(updatedAppointment as any);
      reminderService.updateReminder.mockResolvedValue(undefined);
      mailService.sendAppointmentConfirmation.mockResolvedValue(undefined);

      // Act
      const result = await service.updateStatus(id, data);

      // Assert
      expect(result).toEqual(updatedAppointment);
      expect(crudService.updateStatus).toHaveBeenCalledWith(id, {
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: new Date(data.scheduledAt),
        confirmedAt: expect.any(Date),
      });
    });

    it('devrait annuler un rendez-vous', async () => {
      // Arrange
      const id = 'appointment-123';
      const data = { status: AppointmentStatus.CANCELLED };
      const updatedAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
      };

      crudService.findByIdAdmin.mockResolvedValue(mockAppointment as any);
      crudService.updateStatus.mockResolvedValue(updatedAppointment as any);
      reminderService.deleteReminder.mockResolvedValue(undefined);
      mailService.sendAppointmentCancelled.mockResolvedValue(undefined);

      // Act
      const result = await service.updateStatus(id, data);

      // Assert
      expect(result).toEqual(updatedAppointment);
      expect(reminderService.deleteReminder).toHaveBeenCalledWith(id);
      expect(mailService.sendAppointmentCancelled).toHaveBeenCalledWith(
        updatedAppointment,
      );
    });
  });

  describe('cancelAppointment', () => {
    it('devrait annuler un rendez-vous', async () => {
      // Arrange
      const id = 'appointment-123';
      const updatedAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
        cancelledAt: expect.any(Date),
      };

      reminderService.deleteReminder.mockResolvedValue(undefined);
      crudService.updateStatus.mockResolvedValue(updatedAppointment as any);
      mailService.sendAppointmentCancelled.mockResolvedValue(undefined);

      // Act
      const result = await service.cancelAppointment(id);

      // Assert
      expect(result).toEqual(updatedAppointment);
      expect(reminderService.deleteReminder).toHaveBeenCalledWith(id);
      expect(crudService.updateStatus).toHaveBeenCalledWith(id, {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: expect.any(Date),
      });
      expect(mailService.sendAppointmentCancelled).toHaveBeenCalledWith(
        updatedAppointment,
      );
    });
  });

  describe('reschedule', () => {
    it('devrait reprogrammer un rendez-vous', async () => {
      // Arrange
      const id = 'appointment-123';
      const data = { scheduledAt: '2024-01-20T14:00:00Z' };
      const updatedAppointment = {
        ...mockAppointment,
        scheduledAt: new Date(data.scheduledAt),
        status: AppointmentStatus.CONFIRMED,
        confirmedAt: expect.any(Date),
      };

      reminderService.deleteReminder.mockResolvedValue(undefined);
      crudService.updateStatus.mockResolvedValue(updatedAppointment as any);
      reminderService.updateReminder.mockResolvedValue(undefined);
      mailService.sendAppointmentConfirmation.mockResolvedValue(undefined);

      // Act
      const result = await service.reschedule(id, data);

      // Assert
      expect(result).toEqual(updatedAppointment);
      expect(reminderService.deleteReminder).toHaveBeenCalledWith(id);
      expect(crudService.updateStatus).toHaveBeenCalledWith(id, {
        scheduledAt: new Date(data.scheduledAt),
        status: AppointmentStatus.CONFIRMED,
        confirmedAt: expect.any(Date),
      });
      expect(reminderService.updateReminder).toHaveBeenCalledWith(
        updatedAppointment.id,
        updatedAppointment.scheduledAt,
      );
      expect(mailService.sendAppointmentConfirmation).toHaveBeenCalledWith(
        updatedAppointment,
      );
    });
  });

  describe('delete', () => {
    it('devrait supprimer un rendez-vous', async () => {
      // Arrange
      const id = 'appointment-123';

      reminderService.deleteReminder.mockResolvedValue(undefined);
      crudService.delete.mockResolvedValue(undefined);

      // Act
      await service.delete(id);

      // Assert
      expect(reminderService.deleteReminder).toHaveBeenCalledWith(id);
      expect(crudService.delete).toHaveBeenCalledWith(id);
    });
  });

  describe('sendReminder', () => {
    it('devrait envoyer un rappel manuel', async () => {
      // Arrange
      const id = 'appointment-123';

      crudService.findByIdAdmin.mockResolvedValue(mockAppointment as any);
      validationService.validateReminder.mockReturnValue(undefined);
      mailService.sendAppointmentReminder.mockResolvedValue(undefined);
      jest.mocked(prismaService.emailLog.create).mockResolvedValue({} as any);

      // Act
      const result = await service.sendReminder(id);

      // Assert
      expect(result).toEqual({ message: 'Rappel envoyé avec succès' });
      expect(crudService.findByIdAdmin).toHaveBeenCalledWith(id);
      expect(validationService.validateReminder).toHaveBeenCalledWith(
        mockAppointment,
      );
      expect(mailService.sendAppointmentReminder).toHaveBeenCalledWith(
        mockAppointment,
      );
      expect(prismaService.emailLog.create).toHaveBeenCalledWith({
        data: {
          appointmentId: mockAppointment.id,
          to: mockAppointment.contact.email,
          subject: 'Rappel de rendez-vous',
          template: 'reminder',
          meta: { sentBy: 'admin' },
        },
      });
    });
  });

  describe('proposeReschedule', () => {
    it('devrait proposer une reprogrammation', async () => {
      // Arrange
      const id = 'appointment-123';
      const newScheduledAt = '2024-01-20T14:00:00Z';
      const proposedDate = { toDate: () => new Date(newScheduledAt) } as any;
      const updatedAppointment = {
        ...mockAppointment,
        scheduledAt: new Date(newScheduledAt),
        status: AppointmentStatus.RESCHEDULED,
        confirmedAt: expect.any(Date),
      };

      crudService.findByIdAdmin.mockResolvedValue(mockAppointment as any);
      validationService.validateReschedule.mockReturnValue(undefined);
      validationService.validateRescheduleDate.mockReturnValue(proposedDate);
      crudService.updateStatus.mockResolvedValue(updatedAppointment as any);
      reminderService.updateReminder.mockResolvedValue(undefined);
      mailService.sendAppointmentRescheduleProposal.mockResolvedValue(
        undefined,
      );
      jest.mocked(prismaService.emailLog.create).mockResolvedValue({} as any);

      // Act
      const result = await service.proposeReschedule(id, newScheduledAt);

      // Assert
      expect(result).toEqual({
        message: 'Proposition de reprogrammation envoyée',
      });
      expect(crudService.findByIdAdmin).toHaveBeenCalledWith(id);
      expect(validationService.validateReschedule).toHaveBeenCalledWith(
        mockAppointment,
      );
      expect(validationService.validateRescheduleDate).toHaveBeenCalledWith(
        newScheduledAt,
      );
      expect(crudService.updateStatus).toHaveBeenCalledWith(id, {
        scheduledAt: proposedDate.toDate(),
        status: AppointmentStatus.RESCHEDULED,
        confirmedAt: expect.any(Date),
      });
      expect(reminderService.updateReminder).toHaveBeenCalledWith(
        updatedAppointment.id,
        updatedAppointment.scheduledAt,
      );
      expect(
        mailService.sendAppointmentRescheduleProposal,
      ).toHaveBeenCalledWith(updatedAppointment);
      expect(prismaService.emailLog.create).toHaveBeenCalledWith({
        data: {
          appointmentId: mockAppointment.id,
          to: mockAppointment.contact.email,
          subject: 'Proposition de reprogrammation',
          template: 'reschedule_proposal',
          meta: { sentBy: 'admin' },
        },
      });
    });
  });

  describe('getUpcoming', () => {
    it('devrait récupérer les rendez-vous à venir', async () => {
      // Arrange
      const days = 7;
      const upcomingAppointments = [mockAppointment];

      crudService.findUpcoming.mockResolvedValue(upcomingAppointments as any);

      // Act
      const result = await service.getUpcoming(days);

      // Assert
      expect(result).toEqual(upcomingAppointments);
      expect(crudService.findUpcoming).toHaveBeenCalledWith(days);
    });

    it('devrait utiliser 7 jours par défaut', async () => {
      // Arrange
      const upcomingAppointments = [mockAppointment];

      crudService.findUpcoming.mockResolvedValue(upcomingAppointments as any);

      // Act
      const result = await service.getUpcoming();

      // Assert
      expect(result).toEqual(upcomingAppointments);
      expect(crudService.findUpcoming).toHaveBeenCalledWith(7);
    });
  });

  describe('getStats', () => {
    it('devrait récupérer les statistiques', async () => {
      // Arrange
      const stats = {
        PENDING: 5,
        CONFIRMED: 10,
        CANCELLED: 2,
      };

      crudService.countByStatus.mockResolvedValue(stats as any);

      // Act
      const result = await service.getStats();

      // Assert
      expect(result).toEqual(stats);
      expect(crudService.countByStatus).toHaveBeenCalled();
    });
  });
});
