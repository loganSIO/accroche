import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../infrastructure/prisma.client.js';
import { MusicianPrismaRepository } from '../../infrastructure/repositories/musician-prisma.repository.js';
import { OpenPositionPrismaRepository } from '../../infrastructure/repositories/open-position-prisma.repository.js';
import { MatchPrismaRepository } from '../../infrastructure/repositories/match-prisma.repository.js';
import { RecalculateMatchesForMusician } from './recalculate-matches-for-musician.js';

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

describe('RecalculateMatchesForMusician (intégration réelle avec Postgres)', () => {
  beforeEach(cleanDatabase);
  afterEach(cleanDatabase);

  it('calcule et persiste un vrai match en base pour un musicien et un poste compatibles', async () => {
    const zone = await prisma.zone.create({
      data: { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' },
    });

    const user = await prisma.user.create({
      data: { email: 'guitariste@example.com', password: 'hash', city: 'Strasbourg' },
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

    const groupUser = await prisma.user.create({
      data: { email: 'groupe@example.com', password: 'hash', city: 'Strasbourg' },
    });

    const group = await prisma.groupProfile.create({
      data: {
        userId: groupUser.id,
        zoneId: zone.id,
        name: 'Les Trois Accords',
        styles: ['rock'],
        status: 'ASSOCIATION',
      },
    });

    const position = await prisma.openPosition.create({
      data: {
        ownerType: 'GROUP',
        groupProfileId: group.id,
        instrumentRecherche: 'guitare',
        niveauAttendu: 'avance',
        statut: 'OUVERT',
      },
    });

    const useCase = new RecalculateMatchesForMusician(
      new MusicianPrismaRepository(),
      new OpenPositionPrismaRepository(),
      new MatchPrismaRepository(),
    );

    await useCase.execute(musician.id);

    const savedMatch = await prisma.match.findUnique({
      where: { musicianId_positionId: { musicianId: musician.id, positionId: position.id } },
    });

    expect(savedMatch).not.toBeNull();
    expect(savedMatch?.scoreGlobal).toBe(100);
    expect(savedMatch?.scoreInstrument).toBe(100);
  });
});