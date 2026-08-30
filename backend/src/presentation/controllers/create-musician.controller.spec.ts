import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../infrastructure/prisma.client.js';
import { CreateMusicianController } from './create-musician.controller.js';
import type { CreateMusicianDto } from '../dtos/create-musician.dto.js';

async function cleanDatabase() {
  await prisma.match.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.musicianStyle.deleteMany();
  await prisma.musicianInstrument.deleteMany();
  await prisma.musicianProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.zone.deleteMany();
}

describe('CreateMusicianController (intégration réelle avec Postgres)', () => {
  const controller = new CreateMusicianController();

  beforeEach(cleanDatabase);
  afterEach(cleanDatabase);

  it('crée un musicien et retourne la réponse au format {data, meta}', async () => {
    const dto: CreateMusicianDto = {
      email: 'e2e@example.com',
      password: 'motdepasse123',
      status: 'amateur',
      instruments: [{ instrument: 'guitare', niveau: 'avance' }],
      styles: ['rock'],
      availabilities: [{ jourSemaine: 'mardi', creneauxJournee: 'soir' }],
      zone: { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' },
    };

    const result = await controller.create(dto);

    expect(result.data.id).toBeDefined();
    expect(result.data.instruments).toEqual([{ instrument: 'guitare', niveau: 'avance' }]);
    expect(result.meta.version).toBe('v1');
  });
});