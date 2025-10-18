import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentReminderService } from '../../src/appointments/services/appointment-reminder.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ReminderScheduler } from '../../src/appointments/queues/reminder.scheduler';

describe('AppointmentReminderService', () => {
  let service: AppointmentReminderService;
  let prismaService: jest.Mocked<PrismaService>;
  let reminderScheduler: jest.Mocked<ReminderScheduler>;

  const mockReminder = {
    id: 'reminder-123',
    appointmentId: 'appointment-123',
    dueAt: new Date('2024-01-14T10:00:00Z'),
    providerRef: 'job-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentReminderService,
        {
          provide: PrismaService,
          useValue: {
            reminder: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          } as any,
        },
        {
          provide: ReminderScheduler,
          useValue: {
            scheduleReminder: jest.fn(),
            cancelReminder: jest.fn(),
          } as any,
        },
      ],
    }).compile();

    service = module.get<AppointmentReminderService>(
      AppointmentReminderService,
    );
    prismaService = module.get(PrismaService);
    reminderScheduler = module.get(ReminderScheduler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('createReminder', () => {
    it('devrait créer un rappel avec succès', async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const scheduledAt = new Date('2024-01-15T10:00:00Z');
      const jobId = 'job-123';

      jest
        .mocked(prismaService.reminder.create)
        .mockResolvedValue(mockReminder as any);
      reminderScheduler.scheduleReminder.mockResolvedValue(jobId);
      jest.mocked(prismaService.reminder.update).mockResolvedValue({
        ...mockReminder,
        providerRef: jobId,
      } as any);

      // Act
      const result = await service.createReminder(appointmentId, scheduledAt);

      // Assert
      expect(result).toEqual(mockReminder);
      expect(prismaService.reminder.create).toHaveBeenCalledWith({
        data: {
          appointmentId,
          dueAt: new Date('2024-01-14T10:00:00Z'), // 24h avant
        },
      });
      expect(reminderScheduler.scheduleReminder).toHaveBeenCalledWith({
        id: appointmentId,
        scheduledAt,
      });
      expect(prismaService.reminder.update).toHaveBeenCalledWith({
        where: { id: mockReminder.id },
        data: { providerRef: jobId },
      });
    });

    it('devrait créer un rappel sans jobId', async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const scheduledAt = new Date('2024-01-15T10:00:00Z');

      jest
        .mocked(prismaService.reminder.create)
        .mockResolvedValue(mockReminder as any);
      reminderScheduler.scheduleReminder.mockResolvedValue(null);

      // Act
      const result = await service.createReminder(appointmentId, scheduledAt);

      // Assert
      expect(result).toEqual(mockReminder);
      expect(prismaService.reminder.update).not.toHaveBeenCalled();
    });
  });

  describe('updateReminder', () => {
    it('devrait mettre à jour un rappel existant', async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const scheduledAt = new Date('2024-01-15T10:00:00Z');
      const jobId = 'new-job-123';

      jest
        .mocked(prismaService.reminder.findUnique)
        .mockResolvedValue(mockReminder as any);
      reminderScheduler.cancelReminder.mockResolvedValue(undefined);
      reminderScheduler.scheduleReminder.mockResolvedValue(jobId);
      jest.mocked(prismaService.reminder.update).mockResolvedValue({
        ...mockReminder,
        providerRef: jobId,
      } as any);

      // Act
      const result = await service.updateReminder(appointmentId, scheduledAt);

      // Assert
      expect(result).toEqual(mockReminder);
      expect(prismaService.reminder.findUnique).toHaveBeenCalledWith({
        where: { appointmentId },
      });
      expect(reminderScheduler.cancelReminder).toHaveBeenCalledWith(
        mockReminder.providerRef,
      );
      expect(reminderScheduler.scheduleReminder).toHaveBeenCalledWith({
        id: appointmentId,
        scheduledAt,
      });
      expect(prismaService.reminder.update).toHaveBeenCalledWith({
        where: { id: mockReminder.id },
        data: {
          dueAt: new Date('2024-01-14T10:00:00Z'),
          providerRef: jobId,
        },
      });
    });

    it("devrait créer un nouveau rappel si aucun n'existe", async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const scheduledAt = new Date('2024-01-15T10:00:00Z');

      jest.mocked(prismaService.reminder.findUnique).mockResolvedValue(null);
      jest
        .mocked(prismaService.reminder.create)
        .mockResolvedValue(mockReminder as any);
      reminderScheduler.scheduleReminder.mockResolvedValue('job-123');
      jest
        .mocked(prismaService.reminder.update)
        .mockResolvedValue(mockReminder as any);

      // Act
      const result = await service.updateReminder(appointmentId, scheduledAt);

      // Assert
      expect(result).toEqual(mockReminder);
      expect(prismaService.reminder.create).toHaveBeenCalledWith({
        data: {
          appointmentId,
          dueAt: new Date('2024-01-14T10:00:00Z'),
        },
      });
    });

    it('devrait mettre à jour un rappel sans providerRef', async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const scheduledAt = new Date('2024-01-15T10:00:00Z');
      const reminderWithoutRef = { ...mockReminder, providerRef: null };

      jest
        .mocked(prismaService.reminder.findUnique)
        .mockResolvedValue(reminderWithoutRef as any);
      reminderScheduler.scheduleReminder.mockResolvedValue('job-123');
      jest
        .mocked(prismaService.reminder.update)
        .mockResolvedValue(reminderWithoutRef as any);

      // Act
      const result = await service.updateReminder(appointmentId, scheduledAt);

      // Assert
      expect(result).toEqual(reminderWithoutRef);
      expect(reminderScheduler.cancelReminder).not.toHaveBeenCalled();
    });
  });

  describe('deleteReminder', () => {
    it('devrait supprimer un rappel avec providerRef', async () => {
      // Arrange
      const appointmentId = 'appointment-123';

      jest
        .mocked(prismaService.reminder.findUnique)
        .mockResolvedValue(mockReminder as any);
      reminderScheduler.cancelReminder.mockResolvedValue(undefined);
      jest
        .mocked(prismaService.reminder.delete)
        .mockResolvedValue(mockReminder as any);

      // Act
      const result = await service.deleteReminder(appointmentId);

      // Assert
      expect(result).toEqual(mockReminder);
      expect(prismaService.reminder.findUnique).toHaveBeenCalledWith({
        where: { appointmentId },
      });
      expect(reminderScheduler.cancelReminder).toHaveBeenCalledWith(
        mockReminder.providerRef,
      );
      expect(prismaService.reminder.delete).toHaveBeenCalledWith({
        where: { id: mockReminder.id },
      });
    });

    it('devrait supprimer un rappel sans providerRef', async () => {
      // Arrange
      const appointmentId = 'appointment-123';
      const reminderWithoutRef = { ...mockReminder, providerRef: null };

      jest
        .mocked(prismaService.reminder.findUnique)
        .mockResolvedValue(reminderWithoutRef as any);
      jest
        .mocked(prismaService.reminder.delete)
        .mockResolvedValue(reminderWithoutRef as any);

      // Act
      const result = await service.deleteReminder(appointmentId);

      // Assert
      expect(result).toEqual(reminderWithoutRef);
      expect(reminderScheduler.cancelReminder).not.toHaveBeenCalled();
      expect(prismaService.reminder.delete).toHaveBeenCalledWith({
        where: { id: reminderWithoutRef.id },
      });
    });

    it("devrait gérer le cas où aucun rappel n'existe", async () => {
      // Arrange
      const appointmentId = 'appointment-123';

      jest.mocked(prismaService.reminder.findUnique).mockResolvedValue(null);

      // Act
      const result = await service.deleteReminder(appointmentId);

      // Assert
      expect(result).toBeNull();
      expect(reminderScheduler.cancelReminder).not.toHaveBeenCalled();
      expect(prismaService.reminder.delete).not.toHaveBeenCalled();
    });
  });

  describe('findByAppointmentId', () => {
    it('devrait récupérer un rappel par ID de rendez-vous', async () => {
      // Arrange
      const appointmentId = 'appointment-123';

      jest
        .mocked(prismaService.reminder.findUnique)
        .mockResolvedValue(mockReminder as any);

      // Act
      const result = await service.findByAppointmentId(appointmentId);

      // Assert
      expect(result).toEqual(mockReminder);
      expect(prismaService.reminder.findUnique).toHaveBeenCalledWith({
        where: { appointmentId },
      });
    });

    it("devrait retourner null si aucun rappel n'existe", async () => {
      // Arrange
      const appointmentId = 'appointment-123';

      jest.mocked(prismaService.reminder.findUnique).mockResolvedValue(null);

      // Act
      const result = await service.findByAppointmentId(appointmentId);

      // Assert
      expect(result).toBeNull();
      expect(prismaService.reminder.findUnique).toHaveBeenCalledWith({
        where: { appointmentId },
      });
    });
  });
});
