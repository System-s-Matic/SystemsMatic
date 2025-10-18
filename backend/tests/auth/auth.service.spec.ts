import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt au niveau du module
jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockAdminUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'admin@test.com',
    password: '$2a$10$hashedPassword',
    firstName: 'Admin',
    lastName: 'Test',
    role: 'ADMIN',
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    adminUser: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('TU01 - validateUser (validateAdmin)', () => {
    it('devrait valider un utilisateur admin avec des identifiants corrects', async () => {
      // Arrange
      mockPrismaService.adminUser.findUnique.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.validateUser(
        'admin@test.com',
        'password123',
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe('admin@test.com');
      expect(result.password).toBeUndefined();
      expect(mockPrismaService.adminUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@test.com' },
      });
    });

    it('devrait rejeter un utilisateur avec un mauvais mot de passe', async () => {
      // Arrange
      mockPrismaService.adminUser.findUnique.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await service.validateUser(
        'admin@test.com',
        'wrongpassword',
      );

      // Assert
      expect(result).toBeNull();
    });

    it('devrait rejeter un utilisateur inexistant', async () => {
      // Arrange
      mockPrismaService.adminUser.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.validateUser(
        'unknown@test.com',
        'password123',
      );

      // Assert
      expect(result).toBeNull();
    });

    it('devrait rejeter un utilisateur inactif', async () => {
      // Arrange
      const inactiveUser = { ...mockAdminUser, isActive: false };
      mockPrismaService.adminUser.findUnique.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.validateUser(
        'admin@test.com',
        'password123',
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('TU02 - generateToken', () => {
    it('devrait générer un JWT valide lors du login', async () => {
      // Arrange
      const loginDto = { email: 'admin@test.com', password: 'password123' };
      mockPrismaService.adminUser.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.adminUser.update.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result.access_token).toBe('mock-jwt-token');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockAdminUser.id,
        email: mockAdminUser.email,
        role: mockAdminUser.role,
        firstName: mockAdminUser.firstName,
        lastName: mockAdminUser.lastName,
      });
    });

    it('devrait lever une exception si les identifiants sont incorrects', async () => {
      // Arrange
      const loginDto = { email: 'admin@test.com', password: 'wrongpassword' };
      mockPrismaService.adminUser.findUnique.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('devrait mettre à jour la date de dernière connexion', async () => {
      // Arrange
      const loginDto = { email: 'admin@test.com', password: 'password123' };
      mockPrismaService.adminUser.findUnique.mockResolvedValue(mockAdminUser);
      mockPrismaService.adminUser.update.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      await service.login(loginDto);

      // Assert
      expect(mockPrismaService.adminUser.update).toHaveBeenCalledWith({
        where: { id: mockAdminUser.id },
        data: { lastLogin: expect.any(Date) },
      });
    });
  });

  describe('register', () => {
    it('devrait créer un nouvel utilisateur avec un mot de passe hashé', async () => {
      // Arrange
      const registerDto = {
        email: 'newadmin@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Admin',
        role: 'ADMIN',
      };
      mockPrismaService.adminUser.findUnique.mockResolvedValue(null);
      mockPrismaService.adminUser.create.mockResolvedValue({
        ...mockAdminUser,
        email: registerDto.email,
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result.access_token).toBe('mock-jwt-token');
      expect(mockPrismaService.adminUser.create).toHaveBeenCalledWith({
        data: {
          email: 'newadmin@test.com',
          password: 'hashedPassword',
          firstName: 'New',
          lastName: 'Admin',
          role: 'ADMIN',
        },
      });
    });

    it("devrait lever une exception si l'email existe déjà", async () => {
      // Arrange
      const registerDto = {
        email: 'admin@test.com',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'Test',
        role: 'ADMIN',
      };
      mockPrismaService.adminUser.findUnique.mockResolvedValue(mockAdminUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("devrait utiliser ADMIN comme rôle par défaut si aucun rôle n'est fourni", async () => {
      // Arrange
      const registerDto = {
        email: 'newadmin@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Admin',
        // role non fourni (undefined)
      };
      mockPrismaService.adminUser.findUnique.mockResolvedValue(null);
      mockPrismaService.adminUser.create.mockResolvedValue({
        ...mockAdminUser,
        email: registerDto.email,
        role: 'ADMIN', // Rôle par défaut
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result.access_token).toBe('mock-jwt-token');
      expect(mockPrismaService.adminUser.create).toHaveBeenCalledWith({
        data: {
          email: 'newadmin@test.com',
          password: 'hashedPassword',
          firstName: 'New',
          lastName: 'Admin',
          role: 'ADMIN', // Vérifier que le rôle par défaut est utilisé
        },
      });
    });
  });

  describe('getProfile', () => {
    it("devrait retourner le profil d'un utilisateur", async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const userProfile = {
        id: userId,
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'Test',
        role: 'ADMIN',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
      };
      mockPrismaService.adminUser.findUnique.mockResolvedValue(userProfile);

      // Act
      const result = await service.getProfile(userId);

      // Assert
      expect(result).toEqual(userProfile);
      expect(mockPrismaService.adminUser.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
        },
      });
    });

    it("devrait lever une exception si l'utilisateur n'existe pas", async () => {
      // Arrange
      const userId = 'non-existent-id';
      mockPrismaService.adminUser.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getProfile(userId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
