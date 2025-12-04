import { Test, TestingModule } from '@nestjs/testing';
import { BackofficeController } from '../../src/backoffice/backoffice.controller';
import { AppointmentsService } from '../../src/appointments/appointments.service';
import { QuotesService } from '../../src/quotes/quotes.service';
import { QueueMonitorService } from '../../src/queue/queue-monitor.service';
import { AppointmentStatus } from '@prisma/client';

describe('BackofficeController', () => {
  let controller: BackofficeController;
  let appointmentsService: jest.Mocked<AppointmentsService>;
  let quotesService: jest.Mocked<QuotesService>;
  let queueMonitorService: jest.Mocked<QueueMonitorService>;

  const mockUser = {
    sub: 'user-123',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
  };

  const mockAppointment = {
    id: 'appointment-123',
    contactId: 'contact-123',
    requestedAt: new Date('2024-01-15T10:00:00Z'),
    scheduledAt: new Date('2024-01-15T10:00:00Z'),
    status: 'PENDING' as AppointmentStatus,
    confirmedAt: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    contact: {
      id: 'contact-123',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      phone: '+590690123456',
    },
  };

  const mockQuote = {
    id: 'quote-123',
    contactId: 'contact-123',
    projectDescription: 'Installation portail automatique',
    status: 'PENDING' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    contact: {
      id: 'contact-123',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      phone: '+590690123456',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackofficeController],
      providers: [
        {
          provide: AppointmentsService,
          useValue: {
            findAllAdmin: jest.fn(),
            getUpcomingAdmin: jest.fn(),
            getStatsAdmin: jest.fn(),
            findOneAdmin: jest.fn(),
            updateStatusAdmin: jest.fn(),
            rescheduleAdmin: jest.fn(),
            deleteAdmin: jest.fn(),
            sendReminderAdmin: jest.fn(),
            proposeRescheduleAdmin: jest.fn(),
          } as any,
        },
        {
          provide: QuotesService,
          useValue: {
            findAllWithFilters: jest.fn(),
            getStats: jest.fn(),
            findOne: jest.fn(),
            updateQuote: jest.fn(),
            updateStatus: jest.fn(),
            acceptQuote: jest.fn(),
            rejectQuote: jest.fn(),
          } as any,
        },
        {
          provide: QueueMonitorService,
          useValue: {
            getQueueStats: jest.fn(),
            getQueueHealth: jest.fn(),
          } as any,
        },
      ],
    }).compile();

    controller = module.get<BackofficeController>(BackofficeController);
    appointmentsService = module.get(AppointmentsService);
    quotesService = module.get(QuotesService);
    queueMonitorService = module.get(QueueMonitorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  describe('Gestion des rendez-vous', () => {
    describe('getAppointments', () => {
      it('devrait récupérer tous les rendez-vous', async () => {
        // Arrange
        const appointments = [mockAppointment];
        appointmentsService.findAllAdmin.mockResolvedValue(appointments as any);

        // Act
        const result = await controller.getAppointments();

        // Assert
        expect(result).toEqual(appointments);
        expect(appointmentsService.findAllAdmin).toHaveBeenCalledWith(
          undefined,
        );
      });

      it('devrait récupérer les rendez-vous avec un statut spécifique', async () => {
        // Arrange
        const status = 'PENDING' as AppointmentStatus;
        const appointments = [mockAppointment];
        appointmentsService.findAllAdmin.mockResolvedValue(appointments as any);

        // Act
        const result = await controller.getAppointments(status);

        // Assert
        expect(result).toEqual(appointments);
        expect(appointmentsService.findAllAdmin).toHaveBeenCalledWith(status);
      });
    });

    describe('getPendingAppointments', () => {
      it('devrait récupérer les rendez-vous en attente', async () => {
        // Arrange
        const appointments = [mockAppointment];
        appointmentsService.findAllAdmin.mockResolvedValue(appointments as any);

        // Act
        const result = await controller.getPendingAppointments();

        // Assert
        expect(result).toEqual(appointments);
        expect(appointmentsService.findAllAdmin).toHaveBeenCalledWith(
          'PENDING',
        );
      });
    });

    describe('getUpcomingAppointments', () => {
      it('devrait récupérer les rendez-vous à venir avec 7 jours par défaut', async () => {
        // Arrange
        const appointments = [mockAppointment];
        appointmentsService.getUpcomingAdmin.mockResolvedValue(
          appointments as any,
        );

        // Act
        const result = await controller.getUpcomingAppointments();

        // Assert
        expect(result).toEqual(appointments);
        expect(appointmentsService.getUpcomingAdmin).toHaveBeenCalledWith(7);
      });

      it('devrait récupérer les rendez-vous à venir avec un nombre de jours spécifique', async () => {
        // Arrange
        const days = '14';
        const appointments = [mockAppointment];
        appointmentsService.getUpcomingAdmin.mockResolvedValue(
          appointments as any,
        );

        // Act
        const result = await controller.getUpcomingAppointments(days);

        // Assert
        expect(result).toEqual(appointments);
        expect(appointmentsService.getUpcomingAdmin).toHaveBeenCalledWith(14);
      });
    });

    describe('getStats', () => {
      it('devrait récupérer les statistiques des rendez-vous', async () => {
        // Arrange
        const stats = { total: 10, pending: 5, confirmed: 3, cancelled: 2 };
        appointmentsService.getStatsAdmin.mockResolvedValue(stats as any);

        // Act
        const result = await controller.getStats();

        // Assert
        expect(result).toEqual(stats);
        expect(appointmentsService.getStatsAdmin).toHaveBeenCalled();
      });
    });

    describe('getAppointment', () => {
      it('devrait récupérer un rendez-vous par ID', async () => {
        // Arrange
        const id = 'appointment-123';
        appointmentsService.findOneAdmin.mockResolvedValue(
          mockAppointment as any,
        );

        // Act
        const result = await controller.getAppointment(id);

        // Assert
        expect(result).toEqual(mockAppointment);
        expect(appointmentsService.findOneAdmin).toHaveBeenCalledWith(id);
      });
    });

    describe('updateAppointmentStatus', () => {
      it("devrait mettre à jour le statut d'un rendez-vous", async () => {
        // Arrange
        const id = 'appointment-123';
        const data = { status: 'CONFIRMED' as AppointmentStatus };
        const updatedAppointment = { ...mockAppointment, status: 'CONFIRMED' };
        appointmentsService.updateStatusAdmin.mockResolvedValue(
          updatedAppointment as any,
        );

        // Act
        const result = await controller.updateAppointmentStatus(id, data);

        // Assert
        expect(result).toEqual(updatedAppointment);
        expect(appointmentsService.updateStatusAdmin).toHaveBeenCalledWith(
          id,
          data,
        );
      });

      it('devrait mettre à jour le statut avec une date programmée', async () => {
        // Arrange
        const id = 'appointment-123';
        const data = {
          status: 'CONFIRMED' as AppointmentStatus,
          scheduledAt: '2024-01-20T14:00:00Z',
        };
        const updatedAppointment = { ...mockAppointment, status: 'CONFIRMED' };
        appointmentsService.updateStatusAdmin.mockResolvedValue(
          updatedAppointment as any,
        );

        // Act
        const result = await controller.updateAppointmentStatus(id, data);

        // Assert
        expect(result).toEqual(updatedAppointment);
        expect(appointmentsService.updateStatusAdmin).toHaveBeenCalledWith(
          id,
          data,
        );
      });
    });

    describe('rescheduleAppointment', () => {
      it('devrait reprogrammer un rendez-vous', async () => {
        // Arrange
        const id = 'appointment-123';
        const data = { scheduledAt: '2024-01-20T14:00:00Z' };
        const rescheduledAppointment = {
          ...mockAppointment,
          scheduledAt: new Date(data.scheduledAt),
        };
        appointmentsService.rescheduleAdmin.mockResolvedValue(
          rescheduledAppointment as any,
        );

        // Act
        const result = await controller.rescheduleAppointment(id, data);

        // Assert
        expect(result).toEqual(rescheduledAppointment);
        expect(appointmentsService.rescheduleAdmin).toHaveBeenCalledWith(
          id,
          data,
        );
      });
    });

    describe('deleteAppointment', () => {
      it('devrait supprimer un rendez-vous', async () => {
        // Arrange
        const id = 'appointment-123';
        appointmentsService.deleteAdmin.mockResolvedValue(undefined);

        // Act
        const result = await controller.deleteAppointment(id);

        // Assert
        expect(result).toEqual({ message: 'Rendez-vous supprimé avec succès' });
        expect(appointmentsService.deleteAdmin).toHaveBeenCalledWith(id);
      });
    });

    describe('sendReminder', () => {
      it('devrait envoyer un rappel', async () => {
        // Arrange
        const id = 'appointment-123';
        const reminderResult = { message: 'Rappel envoyé avec succès' };
        appointmentsService.sendReminderAdmin.mockResolvedValue(
          reminderResult as any,
        );

        // Act
        const result = await controller.sendReminder(id);

        // Assert
        expect(result).toEqual(reminderResult);
        expect(appointmentsService.sendReminderAdmin).toHaveBeenCalledWith(id);
      });
    });

    describe('proposeReschedule', () => {
      it('devrait proposer une reprogrammation', async () => {
        // Arrange
        const id = 'appointment-123';
        const data = { newScheduledAt: '2024-01-20T14:00:00Z' };
        const proposalResult = {
          message: 'Proposition de reprogrammation envoyée',
        };
        appointmentsService.proposeRescheduleAdmin.mockResolvedValue(
          proposalResult as any,
        );

        // Act
        const result = await controller.proposeReschedule(id, data);

        // Assert
        expect(result).toEqual(proposalResult);
        expect(appointmentsService.proposeRescheduleAdmin).toHaveBeenCalledWith(
          id,
          data.newScheduledAt,
        );
      });
    });
  });

  describe('Gestion des devis', () => {
    describe('getQuotes', () => {
      it('devrait récupérer les devis avec pagination par défaut', async () => {
        // Arrange
        const quotes = {
          quotes: [mockQuote],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        };
        quotesService.findAllWithFilters.mockResolvedValue(quotes as any);

        // Act
        const result = await controller.getQuotes();

        // Assert
        expect(result).toEqual(quotes);
        expect(quotesService.findAllWithFilters).toHaveBeenCalledWith(1, 10, {
          status: undefined,
          search: undefined,
        });
      });

      it('devrait récupérer les devis avec filtres', async () => {
        // Arrange
        const page = '2';
        const limit = '20';
        const status = 'PENDING';
        const search = 'portail';
        const quotes = {
          quotes: [mockQuote],
          total: 1,
          page: 2,
          limit: 20,
          totalPages: 1,
        };
        quotesService.findAllWithFilters.mockResolvedValue(quotes as any);

        // Act
        const result = await controller.getQuotes(page, limit, status, search);

        // Assert
        expect(result).toEqual(quotes);
        expect(quotesService.findAllWithFilters).toHaveBeenCalledWith(2, 20, {
          status,
          search,
        });
      });
    });

    describe('getQuotesStats', () => {
      it('devrait récupérer les statistiques des devis', async () => {
        // Arrange
        const stats = { total: 10, pending: 5, accepted: 3, rejected: 2 };
        quotesService.getStats.mockResolvedValue(stats as any);

        // Act
        const result = await controller.getQuotesStats();

        // Assert
        expect(result).toEqual(stats);
        expect(quotesService.getStats).toHaveBeenCalled();
      });
    });

    describe('getQuote', () => {
      it('devrait récupérer un devis par ID', async () => {
        // Arrange
        const id = 'quote-123';
        quotesService.findOne.mockResolvedValue(mockQuote as any);

        // Act
        const result = await controller.getQuote(id);

        // Assert
        expect(result).toEqual(mockQuote);
        expect(quotesService.findOne).toHaveBeenCalledWith(id);
      });
    });

    describe('updateQuote', () => {
      it('devrait mettre à jour un devis', async () => {
        // Arrange
        const id = 'quote-123';
        const updateData = {
          status: 'PROCESSING',
          quoteDocument: 'document.pdf',
        };
        const updatedQuote = { ...mockQuote, ...updateData };
        quotesService.updateQuote.mockResolvedValue(updatedQuote as any);

        // Act
        const result = await controller.updateQuote(id, updateData);

        // Assert
        expect(result).toEqual(updatedQuote);
        expect(quotesService.updateQuote).toHaveBeenCalledWith(id, updateData);
      });
    });

    describe('updateQuoteStatus', () => {
      it("devrait mettre à jour le statut d'un devis", async () => {
        // Arrange
        const id = 'quote-123';
        const data = {
          status: 'PROCESSING',
          data: { document: 'doc.pdf' },
        };
        const updatedQuote = { ...mockQuote, status: 'PROCESSING' };
        quotesService.updateStatus.mockResolvedValue(updatedQuote as any);

        // Act
        const result = await controller.updateQuoteStatus(id, data);

        // Assert
        expect(result).toEqual(updatedQuote);
        expect(quotesService.updateStatus).toHaveBeenCalledWith(
          id,
          data.status,
          data.data,
        );
      });
    });

    describe('acceptQuote', () => {
      it('devrait accepter un devis', async () => {
        // Arrange
        const id = 'quote-123';
        const body = { document: 'document.pdf', validUntil: '2024-02-15' };
        const acceptedQuote = { ...mockQuote, status: 'ACCEPTED' };
        quotesService.acceptQuote.mockResolvedValue(acceptedQuote as any);

        // Act
        const result = await controller.acceptQuote(id, body);

        // Assert
        expect(result).toEqual(acceptedQuote);
        expect(quotesService.acceptQuote).toHaveBeenCalledWith(id, body);
      });
    });

    describe('rejectQuote', () => {
      it('devrait rejeter un devis', async () => {
        // Arrange
        const id = 'quote-123';
        const body = { rejectionReason: 'Prix trop élevé' };
        const rejectedQuote = { ...mockQuote, status: 'REJECTED' };
        quotesService.rejectQuote.mockResolvedValue(rejectedQuote as any);

        // Act
        const result = await controller.rejectQuote(id, body);

        // Assert
        expect(result).toEqual(rejectedQuote);
        expect(quotesService.rejectQuote).toHaveBeenCalledWith(
          id,
          body.rejectionReason,
        );
      });
    });
  });

  describe('Dashboard global', () => {
    describe('getDashboard', () => {
      it('devrait récupérer le dashboard avec toutes les statistiques', async () => {
        // Arrange
        const appointmentStats = {
          total: 10,
          pending: 5,
          confirmed: 3,
          cancelled: 2,
        };
        const quoteStats = { total: 8, pending: 4, accepted: 2, rejected: 2 };
        appointmentsService.getStatsAdmin.mockResolvedValue(
          appointmentStats as any,
        );
        quotesService.getStats.mockResolvedValue(quoteStats as any);

        // Act
        const result = await controller.getDashboard();

        // Assert
        expect(result).toEqual({
          appointments: appointmentStats,
          quotes: quoteStats,
        });
        expect(appointmentsService.getStatsAdmin).toHaveBeenCalled();
        expect(quotesService.getStats).toHaveBeenCalled();
      });
    });

    describe('getProfile', () => {
      it("devrait récupérer le profil de l'utilisateur", async () => {
        // Arrange
        const req = { user: mockUser };

        // Act
        const result = await controller.getProfile(req);

        // Assert
        expect(result).toEqual({
          id: mockUser.sub,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
        });
      });
    });
  });

  describe('Gestion des queues', () => {
    describe('getQueueStats', () => {
      it('devrait récupérer les statistiques de la queue', async () => {
        // Arrange
        const stats = {
          waiting: 5,
          active: 2,
          completed: 100,
          failed: 3,
        };
        queueMonitorService.getQueueStats.mockResolvedValue(stats as any);

        // Act
        const result = await controller.getQueueStats();

        // Assert
        expect(result).toEqual(stats);
        expect(queueMonitorService.getQueueStats).toHaveBeenCalled();
      });
    });

    describe('getQueueHealth', () => {
      it("devrait récupérer l'état de santé de la queue", async () => {
        // Arrange
        const health = {
          status: 'healthy',
          message: 'Queue fonctionne normalement',
          details: {
            waiting: 5,
            active: 2,
            completed: 100,
            failed: 3,
          },
        };
        queueMonitorService.getQueueHealth.mockResolvedValue(health as any);

        // Act
        const result = await controller.getQueueHealth();

        // Assert
        expect(result).toEqual(health);
        expect(queueMonitorService.getQueueHealth).toHaveBeenCalled();
      });
    });
  });
});
