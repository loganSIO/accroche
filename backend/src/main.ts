import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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