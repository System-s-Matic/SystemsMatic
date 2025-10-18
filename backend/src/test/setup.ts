import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';

// Mock PrismaService pour les tests
export const mockPrismaService = {
  appointment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  quote: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  contact: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  adminUser: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  emailActionToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

// Helper pour créer un module de test
export const createTestingModule = async (providers: any[]) => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ...providers,
      {
        provide: PrismaService,
        useValue: mockPrismaService,
      },
    ],
  }).compile();

  return module;
};

// Mock des templates d'email React
jest.mock('../email-templates', () => ({
  AppointmentRequest: jest.fn(),
  AppointmentConfirmation: jest.fn(),
  AppointmentCancelled: jest.fn(),
  AppointmentReminder: jest.fn(),
  QuoteRequest: jest.fn(),
  QuoteConfirmation: jest.fn(),
  QuoteAccepted: jest.fn(),
  QuoteRejected: jest.fn(),
}));

// Mock de React
jest.mock('react', () => ({
  createElement: jest.fn(),
  Fragment: 'Fragment',
}));

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
});
