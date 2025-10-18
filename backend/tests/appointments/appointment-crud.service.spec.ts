import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentCrudService } from '../../src/appointments/services/appointment-crud.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';

describe('AppointmentCrudService', () => {
  let service: AppointmentCrudService;
  let prismaService: jest.Mocked<PrismaService>;

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
    reason: 'Installation',
    reasonOther: null,
    message: 'Installation de portail automatique',
    requestedAt: new Date('2024-01-15T10:00:00Z'),
    timezone: 'America/Guadeloupe',
    status: 'PENDING' as AppointmentStatus,
    scheduledAt: null,
    confirmedAt: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    contact: mockContact,
  };

  const mockCreateDto = {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    phone: '+590690123456',
    reason: 'INSTALLATION' as const,
    reasonOther: null,
    message: 'Installation de portail automatique',
    requestedAt: '2024-01-15T10:00:00Z',
    timezone: 'America/Guadeloupe',
    consent: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentCrudService,
        {
          provide: PrismaService,
          useValue: {
            appointment: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            contact: {
              upsert: jest.fn(),
            },
          } as any,
        },
      ],
    }).compile();

    service = module.get<AppointmentCrudService>(AppointmentCrudService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('devrait créer un rendez-vous avec succès', async () => {
      // Arrange
      const contactId = 'contact-123';
      const tokens = { acceptToken: 'token-123', rejectToken: 'token-456' };
      const processedRequestedAt = new Date('2024-01-15T10:00:00Z');

      jest
        .mocked(prismaService.appointment.create)
        .mockResolvedValue(mockAppointment as any);

      // Act
      const result = await service.create(
        mockCreateDto,
        contactId,
        tokens,
        processedRequestedAt,
      );

      // Assert
      expect(result).toEqual(mockAppointment);
      expect(prismaService.appointment.create).toHaveBeenCalledWith({
        data: {
          contactId,
          reason: mockCreateDto.reason,
          reasonOther: mockCreateDto.reasonOther,
          message: mockCreateDto.message,
          requestedAt: processedRequestedAt,
          timezone: mockCreateDto.timezone,
          ...tokens,
        },
        include: { contact: true },
      });
    });
  });

  describe('findByIdWithContact', () => {
    it('devrait récupérer un rendez-vous par ID avec contact', async () => {
      // Arrange
      const id = 'appointment-123';
      jest
        .mocked(prismaService.appointment.findUnique)
        .mockResolvedValue(mockAppointment as any);

      // Act
      const result = await service.findByIdWithContact(id);

      // Assert
      expect(result).toEqual(mockAppointment);
      expect(prismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: { contact: true },
      });
    });

    it("devrait retourner null si le rendez-vous n'existe pas", async () => {
      // Arrange
      const id = 'non-existent';
      jest.mocked(prismaService.appointment.findUnique).mockResolvedValue(null);

      // Act
      const result = await service.findByIdWithContact(id);

      // Assert
      expect(result).toBeNull();
      expect(prismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: { contact: true },
      });
    });
  });

  describe('findByIdAdmin', () => {
    it('devrait récupérer un rendez-vous par ID (admin)', async () => {
      // Arrange
      const id = 'appointment-123';
      jest
        .mocked(prismaService.appointment.findUnique)
        .mockResolvedValue(mockAppointment as any);

      // Act
      const result = await service.findByIdAdmin(id);

      // Assert
      expect(result).toEqual(mockAppointment);
      expect(prismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: { contact: true },
      });
    });

    it("devrait lever une erreur si le rendez-vous n'existe pas", async () => {
      // Arrange
      const id = 'non-existent';
      jest.mocked(prismaService.appointment.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByIdAdmin(id)).rejects.toThrow(
        "Rendez-vous avec l'ID non-existent non trouvé",
      );
      expect(prismaService.appointment.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: { contact: true },
      });
    });
  });

  describe('findAllWithStatus', () => {
    it('devrait récupérer tous les rendez-vous sans filtre', async () => {
      // Arrange
      const appointments = [mockAppointment];
      jest
        .mocked(prismaService.appointment.findMany)
        .mockResolvedValue(appointments as any);

      // Act
      const result = await service.findAllWithStatus();

      // Assert
      expect(result).toEqual(appointments);
      expect(prismaService.appointment.findMany).toHaveBeenCalledWith({
        where: {},
        include: { contact: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('devrait récupérer les rendez-vous avec un statut spécifique', async () => {
      // Arrange
      const status = 'PENDING' as AppointmentStatus;
      const appointments = [mockAppointment];
      jest
        .mocked(prismaService.appointment.findMany)
        .mockResolvedValue(appointments as any);

      // Act
      const result = await service.findAllWithStatus(status);

      // Assert
      expect(result).toEqual(appointments);
      expect(prismaService.appointment.findMany).toHaveBeenCalledWith({
        where: { status },
        include: { contact: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('updateStatus', () => {
    it("devrait mettre à jour le statut d'un rendez-vous", async () => {
      // Arrange
      const id = 'appointment-123';
      const data = {
        status: 'CONFIRMED' as AppointmentStatus,
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        confirmedAt: new Date(),
      };
      const updatedAppointment = { ...mockAppointment, ...data };
      jest
        .mocked(prismaService.appointment.update)
        .mockResolvedValue(updatedAppointment as any);

      // Act
      const result = await service.updateStatus(id, data);

      // Assert
      expect(result).toEqual(updatedAppointment);
      expect(prismaService.appointment.update).toHaveBeenCalledWith({
        where: { id },
        data,
        include: { contact: true },
      });
    });

    it('devrait mettre à jour le statut avec annulation', async () => {
      // Arrange
      const id = 'appointment-123';
      const data = {
        status: 'CANCELLED' as AppointmentStatus,
        cancelledAt: new Date(),
      };
      const updatedAppointment = { ...mockAppointment, ...data };
      jest
        .mocked(prismaService.appointment.update)
        .mockResolvedValue(updatedAppointment as any);

      // Act
      const result = await service.updateStatus(id, data);

      // Assert
      expect(result).toEqual(updatedAppointment);
      expect(prismaService.appointment.update).toHaveBeenCalledWith({
        where: { id },
        data,
        include: { contact: true },
      });
    });
  });

  describe('delete', () => {
    it('devrait supprimer un rendez-vous', async () => {
      // Arrange
      const id = 'appointment-123';
      jest
        .mocked(prismaService.appointment.delete)
        .mockResolvedValue(mockAppointment as any);

      // Act
      const result = await service.delete(id);

      // Assert
      expect(result).toEqual(mockAppointment);
      expect(prismaService.appointment.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('findUpcoming', () => {
    it('devrait récupérer les rendez-vous à venir avec 7 jours par défaut', async () => {
      // Arrange
      const appointments = [mockAppointment];
      jest
        .mocked(prismaService.appointment.findMany)
        .mockResolvedValue(appointments as any);

      // Act
      const result = await service.findUpcoming();

      // Assert
      expect(result).toEqual(appointments);
      expect(prismaService.appointment.findMany).toHaveBeenCalledWith({
        where: {
          status: AppointmentStatus.CONFIRMED,
          scheduledAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        include: { contact: true },
        orderBy: { scheduledAt: 'asc' },
      });
    });

    it('devrait récupérer les rendez-vous à venir avec un nombre de jours spécifique', async () => {
      // Arrange
      const days = 14;
      const appointments = [mockAppointment];
      jest
        .mocked(prismaService.appointment.findMany)
        .mockResolvedValue(appointments as any);

      // Act
      const result = await service.findUpcoming(days);

      // Assert
      expect(result).toEqual(appointments);
      expect(prismaService.appointment.findMany).toHaveBeenCalledWith({
        where: {
          status: AppointmentStatus.CONFIRMED,
          scheduledAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        include: { contact: true },
        orderBy: { scheduledAt: 'asc' },
      });
    });
  });

  describe('countByStatus', () => {
    it('devrait compter les rendez-vous par statut', async () => {
      // Arrange
      const counts = {
        total: 10,
        pending: 5,
        confirmed: 3,
        cancelled: 1,
        completed: 1,
      };

      jest
        .mocked(prismaService.appointment.count)
        .mockResolvedValueOnce(counts.total)
        .mockResolvedValueOnce(counts.pending)
        .mockResolvedValueOnce(counts.confirmed)
        .mockResolvedValueOnce(counts.cancelled)
        .mockResolvedValueOnce(counts.completed);

      // Act
      const result = await service.countByStatus();

      // Assert
      expect(result).toEqual(counts);
      expect(prismaService.appointment.count).toHaveBeenCalledTimes(5);
      expect(prismaService.appointment.count).toHaveBeenNthCalledWith(1);
      expect(prismaService.appointment.count).toHaveBeenNthCalledWith(2, {
        where: { status: AppointmentStatus.PENDING },
      });
      expect(prismaService.appointment.count).toHaveBeenNthCalledWith(3, {
        where: { status: AppointmentStatus.CONFIRMED },
      });
      expect(prismaService.appointment.count).toHaveBeenNthCalledWith(4, {
        where: { status: AppointmentStatus.CANCELLED },
      });
      expect(prismaService.appointment.count).toHaveBeenNthCalledWith(5, {
        where: { status: AppointmentStatus.COMPLETED },
      });
    });
  });

  describe('upsertContact', () => {
    it('devrait créer un nouveau contact', async () => {
      // Arrange
      const contactData = {
        email: 'nouveau@example.com',
        firstName: 'Nouveau',
        lastName: 'Contact',
        phone: '+590690123456',
        consent: true,
      };
      jest
        .mocked(prismaService.contact.upsert)
        .mockResolvedValue(mockContact as any);

      // Act
      const result = await service.upsertContact(contactData);

      // Assert
      expect(result).toEqual(mockContact);
      expect(prismaService.contact.upsert).toHaveBeenCalledWith({
        where: { email: contactData.email },
        update: {
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          phone: contactData.phone,
          consentAt: expect.any(Date),
        },
        create: {
          email: contactData.email,
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          phone: contactData.phone,
          consentAt: expect.any(Date),
        },
      });
    });

    it('devrait mettre à jour un contact existant', async () => {
      // Arrange
      const contactData = {
        email: 'jean.dupont@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        phone: '+590690123456',
        consent: true,
      };
      jest
        .mocked(prismaService.contact.upsert)
        .mockResolvedValue(mockContact as any);

      // Act
      const result = await service.upsertContact(contactData);

      // Assert
      expect(result).toEqual(mockContact);
      expect(prismaService.contact.upsert).toHaveBeenCalledWith({
        where: { email: contactData.email },
        update: {
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          phone: contactData.phone,
          consentAt: expect.any(Date),
        },
        create: {
          email: contactData.email,
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          phone: contactData.phone,
          consentAt: expect.any(Date),
        },
      });
    });

    it('devrait gérer un contact sans consentement', async () => {
      // Arrange
      const contactData = {
        email: 'jean.dupont@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        phone: '+590690123456',
        consent: false,
      };
      jest
        .mocked(prismaService.contact.upsert)
        .mockResolvedValue(mockContact as any);

      // Act
      const result = await service.upsertContact(contactData);

      // Assert
      expect(result).toEqual(mockContact);
      expect(prismaService.contact.upsert).toHaveBeenCalledWith({
        where: { email: contactData.email },
        update: {
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          phone: contactData.phone,
          consentAt: undefined,
        },
        create: {
          email: contactData.email,
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          phone: contactData.phone,
          consentAt: undefined,
        },
      });
    });

    it('devrait gérer un contact sans téléphone', async () => {
      // Arrange
      const contactData = {
        email: 'jean.dupont@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        consent: true,
      };
      jest
        .mocked(prismaService.contact.upsert)
        .mockResolvedValue(mockContact as any);

      // Act
      const result = await service.upsertContact(contactData);

      // Assert
      expect(result).toEqual(mockContact);
      expect(prismaService.contact.upsert).toHaveBeenCalledWith({
        where: { email: contactData.email },
        update: {
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          phone: undefined,
          consentAt: expect.any(Date),
        },
        create: {
          email: contactData.email,
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          phone: undefined,
          consentAt: expect.any(Date),
        },
      });
    });
  });
});
