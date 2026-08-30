import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../prisma.client.js';
import { MusicianPrismaRepository } from './musician-prisma.repository.js';

describe('MusicianPrismaRepository (intégration réelle avec Postgres)', () => {
  const repository = new MusicianPrismaRepository();

  // Nettoyage systématique avant/après chaque test pour ne jamais dépendre
  // d'un état laissé par un test précédent.
  beforeEach(async () => {
    await prisma.match.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.musicianStyle.deleteMany();
    await prisma.musicianInstrument.deleteMany();
    await prisma.musicianProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.zone.deleteMany();
  });

  afterEach(async () => {
    await prisma.match.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.musicianStyle.deleteMany();
    await prisma.musicianInstrument.deleteMany();
    await prisma.musicianProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.zone.deleteMany();
  });

  it('retourne null si le musicien n\'existe pas', async () => {
    const result = await repository.findById('id-inexistant');
    expect(result).toBeNull();
  });

  it('retourne un musicien avec toutes ses relations correctement mappées', async () => {
    const zone = await prisma.zone.create({
      data: { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' },
    });

    const user = await prisma.user.create({
      data: { email: 'test@example.com', password: 'hash', city: 'Strasbourg' },
    });

    const musician = await prisma.musicianProfile.create({
      data: {
        userId: user.id,
        zoneId: zone.id,
        status: 'AMATEUR',
        objective: ['join_group'],
        instruments: { create: [{ instrument: 'guitare', niveau: 'avance' }] },
        styles: { create: [{ style: 'rock' }] },
        availabilities: { create: [{ jourSemaine: 'mardi', creneauxJournee: 'soir' }] },
      },
    });

    const result = await repository.findById(musician.id);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(musician.id);
    expect(result?.instruments).toEqual([{ instrument: 'guitare', niveau: 'avance' }]);
    expect(result?.styles).toEqual(['rock']);
    expect(result?.zone.ville).toBe('Strasbourg');
    expect(result?.status).toBe('amateur');
  });
});