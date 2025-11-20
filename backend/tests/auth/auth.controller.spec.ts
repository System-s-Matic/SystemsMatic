import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { Response } from 'express';
import { HttpStatus } from '@nestjs/common';
import {
  getCookieOptions,
  getClearCookieOptions,
} from '../../src/config/cookie.config';

// Mock des fonctions de configuration des cookies
jest.mock('../../src/config/cookie.config', () => ({
  getCookieOptions: jest.fn(() => ({
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24h
  })),
  getClearCookieOptions: jest.fn(() => ({
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  })),
}));

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let mockResponse: jest.Mocked<Response>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'USER',
  };

  const mockAuthResult = {
    access_token: 'jwt-token-123',
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            getProfile: jest.fn(),
          } as any,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    // Mock de la réponse Express
    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('devrait connecter un utilisateur avec succès', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      authService.login.mockResolvedValue(mockAuthResult);

      // Act
      await controller.login(loginDto, mockResponse);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'auth_token',
        mockAuthResult.access_token,
        getCookieOptions(),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'auth_user',
        JSON.stringify(mockAuthResult.user),
        getCookieOptions(),
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Connexion réussie',
        user: mockAuthResult.user,
      });
    });

    it('devrait gérer les erreurs de connexion', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'wrong-password',
      };
      const error = new Error('Identifiants invalides');
      authService.login.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(
        error,
      );
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(mockResponse.cookie).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('devrait inscrire un utilisateur avec succès', async () => {
      // Arrange
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Nouveau',
        lastName: 'Utilisateur',
      };
      authService.register.mockResolvedValue(mockAuthResult);

      // Act
      await controller.register(registerDto, mockResponse);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'auth_token',
        mockAuthResult.access_token,
        getCookieOptions(),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'auth_user',
        JSON.stringify(mockAuthResult.user),
        getCookieOptions(),
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Inscription réussie',
        user: mockAuthResult.user,
      });
    });

    it("devrait gérer les erreurs d'inscription", async () => {
      // Arrange
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Utilisateur',
        lastName: 'Existant',
      };
      const error = new Error('Email déjà utilisé');
      authService.register.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.register(registerDto, mockResponse),
      ).rejects.toThrow(error);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(mockResponse.cookie).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('devrait déconnecter un utilisateur avec succès', async () => {
      // Act
      await controller.logout(mockResponse);

      // Assert
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'auth_token',
        getClearCookieOptions(),
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'auth_user',
        getClearCookieOptions(),
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Déconnexion réussie',
      });
    });
  });

  describe('getProfile', () => {
    it("devrait récupérer le profil de l'utilisateur", async () => {
      // Arrange
      const req = { user: { sub: 'user-123' } };
      authService.getProfile.mockResolvedValue(mockUser as any);

      // Act
      const result = await controller.getProfile(req);

      // Assert
      expect(result).toEqual(mockUser);
      expect(authService.getProfile).toHaveBeenCalledWith('user-123');
    });

    it('devrait gérer les erreurs lors de la récupération du profil', async () => {
      // Arrange
      const req = { user: { sub: 'user-123' } };
      const error = new Error('Utilisateur introuvable');
      authService.getProfile.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getProfile(req)).rejects.toThrow(error);
      expect(authService.getProfile).toHaveBeenCalledWith('user-123');
    });
  });

  describe('Configuration des cookies', () => {
    it('devrait utiliser les bonnes options de cookies pour la connexion', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      authService.login.mockResolvedValue(mockAuthResult);

      // Act
      await controller.login(loginDto, mockResponse);

      // Assert
      expect(getCookieOptions).toHaveBeenCalledTimes(2);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'auth_token',
        mockAuthResult.access_token,
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
        }),
      );
    });

    it('devrait utiliser les bonnes options pour effacer les cookies', async () => {
      // Act
      await controller.logout(mockResponse);

      // Assert
      expect(getClearCookieOptions).toHaveBeenCalledTimes(2);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'auth_token',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
        }),
      );
    });
  });
});
