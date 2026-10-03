import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = (process.env.FRONTEND_URLS ?? process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (isProduction && allowedOrigins.length === 0) {
    throw new Error('FRONTEND_URL ou FRONTEND_URLS doit être configurée en production.');
  }

  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (typeof origin !== 'string' && !isProduction) {
        callback(null, true);
        return;
      }

      if (typeof origin !== 'string' && isProduction) {
        callback(null, false);
        return;
      }

      const requestOrigin = typeof origin === 'string' ? origin : '';
      if (!isProduction && /^https?:\/\/localhost(?::\d+)?$/.test(requestOrigin)) {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.includes(requestOrigin) ? true : false);
    },
  });

  // Applique automatiquement les règles de validation des DTOs
  // (class-validator) à chaque requête entrante. whitelist retire les champs
  // non déclarés dans le DTO ; forbidNonWhitelisted rejette la requête si des
  // champs inattendus sont envoyés, plutôt que de les ignorer silencieusement.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
