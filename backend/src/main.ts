import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as path from 'path';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Middleware pour parser les cookies
  app.use(cookieParser());

  app.use((req, res, next) => {
    if (process.env.MAINTENANCE_MODE === 'true') {
      return res
        .status(503)
        .sendFile(path.join(process.cwd(), 'public', 'maintenance.html'));
    }
    next();
  });

  // Configuration CORS
  const allowedOrigins = [
    'http://localhost:3000',
    'https://systemsmatic.netlify.app',
    'https://systemsmatic.onrender.com',
  ];

  // Ajouter l'origine personnalisée si configurée
  if (process.env.CORS_ORIGIN) {
    allowedOrigins.push(process.env.CORS_ORIGIN);
  }

  console.log('CORS - Environment:', process.env.NODE_ENV);
  console.log('CORS - Allowed origins:', allowedOrigins);
  console.log('CORS - CORS_ORIGIN env:', process.env.CORS_ORIGIN);

  app.enableCors({
    origin: (origin, callback) => {
      console.log('CORS - Request origin:', origin);

      // Autoriser les requêtes sans origin (comme Postman, curl, etc.)
      if (!origin) {
        console.log('CORS - No origin, allowing');
        return callback(null, true);
      }

      // En production, être plus permissif pour éviter les problèmes CORS
      if (process.env.NODE_ENV === 'production') {
        console.log('CORS - Production mode, allowing all origins');
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        console.log('CORS - Origin allowed');
        callback(null, true);
      } else {
        console.log('CORS - Origin not allowed:', origin);
        callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key', 'Cookie'],
    credentials: true,
    optionsSuccessStatus: 200,
  });

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle("System's Matic API")
    .setDescription("API pour l'application System's Matic")
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-admin-key',
        in: 'header',
        description: 'Admin API Key',
      },
      'admin-api-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api`);
}

bootstrap();
