import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Middleware pour parser les cookies
  app.use(cookieParser());

  // Configuration CORS
  const allowedOrigins =
    process.env.NODE_ENV === 'production'
      ? ['https://systemsmatic.netlify.app']
      : ['http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      console.log('CORS - Request origin:', origin);
      console.log('CORS - Allowed origins:', allowedOrigins);
      console.log('CORS - Environment:', process.env.NODE_ENV);

      // Autoriser les requêtes sans origin (comme Postman, curl, etc.)
      if (!origin) {
        console.log('CORS - No origin, allowing');
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
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    credentials: true,
    optionsSuccessStatus: 200, // Support pour les navigateurs legacy
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
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api`);
}

bootstrap();
