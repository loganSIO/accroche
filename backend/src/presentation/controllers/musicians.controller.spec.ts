import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../infrastructure/prisma.client.js';
import { MusiciansController } from './musicians.controller.js';

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

describe('MusiciansController (intégration réelle avec Postgres)', () => {
  const controller = new MusiciansController();

  beforeEach(cleanDatabase);
  afterEach(cleanDatabase);

  it("retourne un tableau vide si le musicien n'a aucun match", async () => {
    const result = await controller.getMatches('id-inexistant');

    expect(result.data).toEqual([]);
    expect(result.meta.version).toBe('v1');
  });

  it('retourne les matchs triés par score décroissant, au bon format', async () => {
    const zone = await prisma.zone.create({
      data: { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' },
    });
    const user = await prisma.user.create({
      data: { email: 'm@example.com', password: 'hash', city: 'Strasbourg' },
    });
    const musician = await prisma.musicianProfile.create({
      data: { userId: user.id, zoneId: zone.id, status: 'AMATEUR', objective: [] },
    });
    const groupUser = await prisma.user.create({
      data: { email: 'g@example.com', password: 'hash', city: 'Strasbourg' },
    });
    const group = await prisma.groupProfile.create({
      data: { userId: groupUser.id, zoneId: zone.id, name: 'Groupe Test', styles: [], status: 'ASSOCIATION' },
    });
    const position = await prisma.openPosition.create({
      data: { ownerType: 'GROUP', groupProfileId: group.id, instrumentRecherche: 'guitare', niveauAttendu: 'avance' },
    });
    await prisma.match.create({
      data: {
        musicianId: musician.id,
        positionId: position.id,
        scoreGlobal: 87,
        scoreInstrument: 100,
        scoreStyle: 80,
        scoreZone: 100,
        scoreDisponibilite: 100,
        scoreNiveau: 100,
      },
    });

    const result = await controller.getMatches(musician.id);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual({
      positionId: position.id,
      scoreGlobal: 87,
      sousScores: { instrument: 100, style: 80, zone: 100, disponibilite: 100, niveau: 100 },
      statut: 'PROPOSE',
    });
  });
});