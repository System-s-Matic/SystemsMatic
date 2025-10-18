import { Test, TestingModule } from '@nestjs/testing';
import { ReminderProcessor } from '../../src/appointments/queues/reminder.processor';
import { PrismaService } from '../../src/prisma/prisma.service';
import { MailService } from '../../src/mail/mail.service';
import { Job } from 'bullmq';

describe('ReminderProcessor', () => {
  let processor: ReminderProcessor;
  let prismaService: jest.Mocked<PrismaService>;
  let mailService: jest.Mocked<MailService>;

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
    scheduledAt: new Date('2024-01-15T10:00:00Z'),
    status: 'CONFIRMED' as const,
    confirmedAt: new Date(),
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    contact: mockContact,
  };

  const mockJob = {
    data: { appointmentId: 'appointment-123' },
  } as Job<{ appointmentId: string }>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReminderProcessor,
        {
          provide: PrismaService,
          useValue: {
            appointment: {
              findUnique: jest.fn(),
            },
            emailLog: {
              create: jest.fn(),
            },
            reminder: {
              update: jest.fn(),
            },
          } as any,
        },
        {
          provide: MailService,
          useValue: {
            sendAppointmentReminder: jest.fn(),
          } as any,
        },
      ],
    }).compile();

    processor = module.get<ReminderProcessor>(ReminderProcessor);
    prismaService = module.get(PrismaService);
    mailService = module.get(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devrait être défini', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('devrait traiter un rappel avec succès', async () => {
      // Arrange
      jest
        .mocked(prismaService.appointment.findUnique)
        .mockResolvedValue(mockAppointment as any);
      mailService.sendAppointmentReminder.mockResolvedValue(undefined);
      jest.mocked(prismaService.emailLog.create).mockResolvedValue({} as any);
      jest.mocked(prismaService.reminder.update).mockResolvedValue({} as any);

      // Act
      await processor.process(mockJob);

      // Assert
      expect(prismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        include: { contact: true },
      });
      expect(mailService.sendAppointmentReminder).toHaveBeenCalledWith(
        mockAppointment,
      );
      expect(prismaService.emailLog.create).toHaveBeenCalledWith({
        data: {
          appointmentId: 'appointment-123',
          to: mockAppointment.contact.email,
          subject: 'Rappel de rendez-vous',
          template: 'reminder',
          meta: { sentBy: 'system' },
        },
      });
      expect(prismaService.reminder.update).toHaveBeenCalledWith({
        where: { appointmentId: 'appointment-123' },
        data: { sentAt: expect.any(Date) },
      });
    });

    it("devrait ignorer le traitement si le rendez-vous n'existe pas", async () => {
      // Arrange
      jest.mocked(prismaService.appointment.findUnique).mockResolvedValue(null);

      // Act
      await processor.process(mockJob);

      // Assert
      expect(prismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        include: { contact: true },
      });
      expect(mailService.sendAppointmentReminder).not.toHaveBeenCalled();
      expect(prismaService.emailLog.create).not.toHaveBeenCalled();
      expect(prismaService.reminder.update).not.toHaveBeenCalled();
    });

    it("devrait gérer les erreurs lors de l'envoi d'email", async () => {
      // Arrange
      const error = new Error('Email service unavailable');
      jest
        .mocked(prismaService.appointment.findUnique)
        .mockResolvedValue(mockAppointment as any);
      mailService.sendAppointmentReminder.mockRejectedValue(error);

      // Act & Assert
      await expect(processor.process(mockJob)).rejects.toThrow(error);
      expect(prismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        include: { contact: true },
      });
      expect(mailService.sendAppointmentReminder).toHaveBeenCalledWith(
        mockAppointment,
      );
      expect(prismaService.emailLog.create).not.toHaveBeenCalled();
      expect(prismaService.reminder.update).not.toHaveBeenCalled();
    });

    it('devrait gérer les erreurs lors de la création du log', async () => {
      // Arrange
      const error = new Error('Database error');
      jest
        .mocked(prismaService.appointment.findUnique)
        .mockResolvedValue(mockAppointment as any);
      mailService.sendAppointmentReminder.mockResolvedValue(undefined);
      jest.mocked(prismaService.emailLog.create).mockRejectedValue(error);

      // Act & Assert
      await expect(processor.process(mockJob)).rejects.toThrow(error);
      expect(prismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        include: { contact: true },
      });
      expect(mailService.sendAppointmentReminder).toHaveBeenCalledWith(
        mockAppointment,
      );
      expect(prismaService.emailLog.create).toHaveBeenCalledWith({
        data: {
          appointmentId: 'appointment-123',
          to: mockAppointment.contact.email,
          subject: 'Rappel de rendez-vous',
          template: 'reminder',
          meta: { sentBy: 'system' },
        },
      });
      expect(prismaService.reminder.update).not.toHaveBeenCalled();
    });

    it('devrait gérer les erreurs lors de la mise à jour du rappel', async () => {
      // Arrange
      const error = new Error('Database error');
      jest
        .mocked(prismaService.appointment.findUnique)
        .mockResolvedValue(mockAppointment as any);
      mailService.sendAppointmentReminder.mockResolvedValue(undefined);
      jest.mocked(prismaService.emailLog.create).mockResolvedValue({} as any);
      jest.mocked(prismaService.reminder.update).mockRejectedValue(error);

      // Act & Assert
      await expect(processor.process(mockJob)).rejects.toThrow(error);
      expect(prismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        include: { contact: true },
      });
      expect(mailService.sendAppointmentReminder).toHaveBeenCalledWith(
        mockAppointment,
      );
      expect(prismaService.emailLog.create).toHaveBeenCalledWith({
        data: {
          appointmentId: 'appointment-123',
          to: mockAppointment.contact.email,
          subject: 'Rappel de rendez-vous',
          template: 'reminder',
          meta: { sentBy: 'system' },
        },
      });
      expect(prismaService.reminder.update).toHaveBeenCalledWith({
        where: { appointmentId: 'appointment-123' },
        data: { sentAt: expect.any(Date) },
      });
    });
  });
});
