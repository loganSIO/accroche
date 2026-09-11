import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../infrastructure/prisma.client.js';
import { AuthController } from './auth.controller.js';
import bcrypt from 'bcrypt';

async function cleanDatabase() {
  await prisma.match.deleteMany();
  await prisma.openPosition.deleteMany();
  await prisma.groupProfile.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.musicianStyle.deleteMany();
  await prisma.musicianInstrument.deleteMany();
  await prisma.musicianProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.zone.deleteMany();
}

describe('AuthController (intégration réelle avec Postgres)', () => {
  let controller: AuthController;

  beforeEach(async () => {
    await cleanDatabase();
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '1h' } })],
      controllers: [AuthController],
    }).compile();
    controller = moduleRef.get(AuthController);
  });

  afterEach(cleanDatabase);

  it('retourne un access token si les identifiants sont valides', async () => {
    const hashedPassword = await bcrypt.hash('motdepasse123', 10);
    await prisma.user.create({
      data: { email: 'test@example.com', password: hashedPassword, city: 'Strasbourg' },
    });

    const result = await controller.loginHandler({ email: 'test@example.com', password: 'motdepasse123' });

    expect(result.data.accessToken).toBeDefined();
    expect(result.data.userId).toBeDefined();
    expect(result.meta.version).toBe('v1');
  });

  it("lève une 401 si l'email n'existe pas", async () => {
    await expect(
      controller.loginHandler({ email: 'inconnu@example.com', password: 'x' }),
    ).rejects.toThrow('Email ou mot de passe incorrect.');
  });

  it('lève une 401 si le mot de passe est incorrect', async () => {
    const hashedPassword = await bcrypt.hash('bonmotdepasse', 10);
    await prisma.user.create({
      data: { email: 'test2@example.com', password: hashedPassword, city: 'Strasbourg' },
    });

    await expect(
      controller.loginHandler({ email: 'test2@example.com', password: 'mauvais' }),
    ).rejects.toThrow('Email ou mot de passe incorrect.');
  });
});