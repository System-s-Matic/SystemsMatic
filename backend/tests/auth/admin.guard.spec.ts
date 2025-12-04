import { Test, TestingModule } from '@nestjs/testing';
import { AdminGuard } from '../../src/auth/guards/admin.guard';
import { ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';

interface MockRequest {
  user:
    | {
        id: string;
        email: string;
        role?: string | null;
      }
    | null
    | undefined;
}

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockRequest: MockRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminGuard],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);

    mockRequest = {
      user: null,
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devrait être défini', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it("devrait autoriser l'accès pour un utilisateur ADMIN", () => {
      // Arrange
      mockRequest.user = {
        id: 'user-123',
        email: 'admin@example.com',
        role: 'ADMIN',
      };

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it("devrait autoriser l'accès pour un utilisateur SUPER_ADMIN", () => {
      // Arrange
      mockRequest.user = {
        id: 'user-123',
        email: 'superadmin@example.com',
        role: 'SUPER_ADMIN',
      };

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it("devrait refuser l'accès si l'utilisateur n'est pas authentifié", () => {
      // Arrange
      mockRequest.user = null;

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        new ForbiddenException('Utilisateur non authentifié'),
      );
    });

    it("devrait refuser l'accès si l'utilisateur n'est pas authentifié (undefined)", () => {
      // Arrange
      mockRequest.user = undefined;

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        new ForbiddenException('Utilisateur non authentifié'),
      );
    });

    it("devrait refuser l'accès pour un utilisateur avec un rôle insuffisant (USER)", () => {
      // Arrange
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'USER',
      };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        new ForbiddenException('Accès refusé - Rôle insuffisant'),
      );
    });

    it("devrait refuser l'accès pour un utilisateur avec un rôle insuffisant (MODERATOR)", () => {
      // Arrange
      mockRequest.user = {
        id: 'user-123',
        email: 'moderator@example.com',
        role: 'MODERATOR',
      };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        new ForbiddenException('Accès refusé - Rôle insuffisant'),
      );
    });

    it("devrait refuser l'accès pour un utilisateur avec un rôle invalide", () => {
      // Arrange
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'INVALID_ROLE',
      };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        new ForbiddenException('Accès refusé - Rôle insuffisant'),
      );
    });

    it("devrait refuser l'accès pour un utilisateur sans rôle", () => {
      // Arrange
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        // role manquant
      };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        new ForbiddenException('Accès refusé - Rôle insuffisant'),
      );
    });

    it("devrait refuser l'accès pour un utilisateur avec un rôle null", () => {
      // Arrange
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: null,
      };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        new ForbiddenException('Accès refusé - Rôle insuffisant'),
      );
    });

    it("devrait refuser l'accès pour un utilisateur avec un rôle undefined", () => {
      // Arrange
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: undefined,
      };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        new ForbiddenException('Accès refusé - Rôle insuffisant'),
      );
    });
  });
});
