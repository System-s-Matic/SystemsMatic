import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuthModule } from '../../src/auth/auth.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

describe('TI01 - AuthController + Service Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testAdmin = {
    email: 'admin@test.com',
    password: 'password123',
    firstName: 'Admin',
    lastName: 'Test',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              JWT_SECRET: 'test-secret',
              JWT_EXPIRES_IN: '1h',
            }),
          ],
        }),
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({
        adminUser: {
          findUnique: jest.fn(),
          update: jest.fn(),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('devrait connecter un utilisateur avec des identifiants valides', async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash(testAdmin.password, 10);
      const adminWithHash = {
        ...testAdmin,
        password: hashedPassword,
        id: 'admin-123',
        isActive: true,
        role: 'ADMIN',
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(
        adminWithHash,
      );
      (prisma.adminUser.update as jest.Mock).mockResolvedValue(adminWithHash);

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testAdmin.email,
          password: testAdmin.password,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('devrait rejeter des identifiants invalides', async () => {
      // Arrange
      (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid@test.com',
          password: 'wrongpassword',
        });

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('devrait déconnecter un utilisateur', async () => {
      // Act
      const response = await request(app.getHttpServer()).post('/auth/logout');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });
});
