import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../prisma.client.js';
import { MusicianPrismaRepository } from './musician-prisma.repository.js';
import type { CreateMusicianInput } from '../../application/ports/musician.repository.js';

async function cleanDatabase() {
  await prisma.match.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.musicianStyle.deleteMany();
  await prisma.musicianInstrument.deleteMany();
  await prisma.musicianProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.zone.deleteMany();
}

describe('MusicianPrismaRepository.create (intégration réelle avec Postgres)', () => {
  const repository = new MusicianPrismaRepository();

  beforeEach(cleanDatabase);
  afterEach(cleanDatabase);

  it('crée un User, une Zone et un MusicianProfile complets et cohérents', async () => {
    const input: CreateMusicianInput = {
      email: 'nouveau@example.com',
      password: 'hash-du-mot-de-passe',
      city: 'Strasbourg',
      status: 'amateur',
      bio: 'Guitariste depuis 10 ans',
      instruments: [{ instrument: 'guitare', niveau: 'avance' }],
      styles: ['rock', 'indie'],
      availabilities: [{ jourSemaine: 'mardi', creneauxJournee: 'soir' }],
      zone: { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' },
    };

    const result = await repository.create(input);

    expect(result.id).toBeDefined();
    expect(result.instruments).toEqual([{ instrument: 'guitare', niveau: 'avance' }]);
    expect(result.styles).toEqual(['rock', 'indie']);
    expect(result.zone.ville).toBe('Strasbourg');
    expect(result.status).toBe('amateur');

    // Vérifie aussi directement en base que le User a bien été créé lié.
    const userInDb = await prisma.user.findUnique({ where: { email: 'nouveau@example.com' } });
    expect(userInDb).not.toBeNull();
  });
});