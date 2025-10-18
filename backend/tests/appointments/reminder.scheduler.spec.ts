import { Test, TestingModule } from '@nestjs/testing';
import { ReminderScheduler } from '../../src/appointments/queues/reminder.scheduler';
import { Queue } from 'bullmq';

describe('ReminderScheduler', () => {
  let scheduler: ReminderScheduler;
  let queue: jest.Mocked<Queue>;

  const mockJob = {
    id: 'job-123',
    add: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReminderScheduler,
        {
          provide: 'BullQueue_reminders',
          useValue: mockJob,
        },
      ],
    }).compile();

    scheduler = module.get<ReminderScheduler>(ReminderScheduler);
    queue = module.get('BullQueue_reminders');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devrait être défini', () => {
    expect(scheduler).toBeDefined();
  });

  describe('scheduleReminder', () => {
    it('devrait planifier un rappel avec succès', async () => {
      // Arrange
      const appointment = {
        id: 'appointment-123',
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h dans le futur
      };
      const jobId = 'job-123';

      queue.add.mockResolvedValue({ id: jobId } as any);

      // Act
      const result = await scheduler.scheduleReminder(appointment);

      // Assert
      expect(result).toBe(jobId);
      expect(queue.add).toHaveBeenCalledWith(
        'reminder',
        { appointmentId: appointment.id },
        { delay: expect.any(Number) },
      );
    });

    it('devrait retourner null si scheduledAt est null', async () => {
      // Arrange
      const appointment = {
        id: 'appointment-123',
        scheduledAt: null,
      };

      // Act
      const result = await scheduler.scheduleReminder(appointment);

      // Assert
      expect(result).toBeNull();
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('devrait retourner null si scheduledAt est undefined', async () => {
      // Arrange
      const appointment = {
        id: 'appointment-123',
        scheduledAt: undefined as any,
      };

      // Act
      const result = await scheduler.scheduleReminder(appointment);

      // Assert
      expect(result).toBeNull();
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('devrait retourner null si le délai est négatif (trop tard)', async () => {
      // Arrange
      const appointment = {
        id: 'appointment-123',
        scheduledAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25h dans le passé
      };

      // Act
      const result = await scheduler.scheduleReminder(appointment);

      // Assert
      expect(result).toBeNull();
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('devrait retourner null si le délai est zéro', async () => {
      // Arrange
      const appointment = {
        id: 'appointment-123',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // exactement 24h
      };

      // Act
      const result = await scheduler.scheduleReminder(appointment);

      // Assert
      expect(result).toBeNull();
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('devrait gérer le cas où job.id est undefined', async () => {
      // Arrange
      const appointment = {
        id: 'appointment-123',
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h dans le futur
      };

      queue.add.mockResolvedValue({ id: undefined } as any);

      // Act
      const result = await scheduler.scheduleReminder(appointment);

      // Assert
      expect(result).toBeNull();
      expect(queue.add).toHaveBeenCalledWith(
        'reminder',
        { appointmentId: appointment.id },
        { delay: expect.any(Number) },
      );
    });

    it('devrait gérer le cas où job est null', async () => {
      // Arrange
      const appointment = {
        id: 'appointment-123',
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h dans le futur
      };

      queue.add.mockResolvedValue(null as any);

      // Act & Assert
      await expect(scheduler.scheduleReminder(appointment)).rejects.toThrow();
    });
  });

  describe('cancelReminder', () => {
    it('devrait annuler un rappel avec succès', async () => {
      // Arrange
      const jobId = 'job-123';

      queue.remove.mockResolvedValue(undefined);

      // Act
      await scheduler.cancelReminder(jobId);

      // Assert
      expect(queue.remove).toHaveBeenCalledWith(jobId);
    });

    it('devrait ne rien faire si jobId est null', async () => {
      // Arrange
      const jobId = null;

      // Act
      await scheduler.cancelReminder(jobId);

      // Assert
      expect(queue.remove).not.toHaveBeenCalled();
    });

    it('devrait ne rien faire si jobId est undefined', async () => {
      // Arrange
      const jobId = undefined;

      // Act
      await scheduler.cancelReminder(jobId);

      // Assert
      expect(queue.remove).not.toHaveBeenCalled();
    });

    it('devrait ne rien faire si jobId est une chaîne vide', async () => {
      // Arrange
      const jobId = '';

      // Act
      await scheduler.cancelReminder(jobId);

      // Assert
      expect(queue.remove).not.toHaveBeenCalled();
    });

    it("devrait lever une erreur si le job n'existe pas", async () => {
      // Arrange
      const jobId = 'non-existent-job';

      queue.remove.mockRejectedValue(new Error('Job not found'));

      // Act & Assert
      await expect(scheduler.cancelReminder(jobId)).rejects.toThrow(
        'Job not found',
      );
      expect(queue.remove).toHaveBeenCalledWith(jobId);
    });

    it('devrait lever une erreur si une autre erreur se produit', async () => {
      // Arrange
      const jobId = 'job-123';

      queue.remove.mockRejectedValue(new Error('Queue error'));

      // Act & Assert
      await expect(scheduler.cancelReminder(jobId)).rejects.toThrow(
        'Job not found',
      );
      expect(queue.remove).toHaveBeenCalledWith(jobId);
    });
  });
});
