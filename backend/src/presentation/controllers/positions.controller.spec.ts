import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../infrastructure/prisma.client.js';
import { PositionsController } from './positions.controller.js';

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

describe('PositionsController (intégration réelle avec Postgres)', () => {
  const controller = new PositionsController();

  beforeEach(cleanDatabase);
  afterEach(cleanDatabase);

  it("retourne un tableau vide si le poste n'a aucun match", async () => {
    const result = await controller.getMatches('id-inexistant');
    expect(result.data).toEqual([]);
    expect(result.meta.version).toBe('v1');
  });

  it('retourne les matchs triés par score décroissant, au bon format', async () => {
    const zone = await prisma.zone.create({
      data: { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' },
    });
    const groupUser = await prisma.user.create({
      data: { email: 'g4@example.com', password: 'hash', city: 'Strasbourg' },
    });
    const group = await prisma.groupProfile.create({
      data: { userId: groupUser.id, zoneId: zone.id, name: 'Groupe Test', styles: [], status: 'ASSOCIATION' },
    });
    const position = await prisma.openPosition.create({
      data: { ownerType: 'GROUP', groupProfileId: group.id, instrumentRecherche: 'guitare', niveauAttendu: 'avance' },
    });
    const musicianUser = await prisma.user.create({
      data: { email: 'm4@example.com', password: 'hash', city: 'Strasbourg' },
    });
    const musician = await prisma.musicianProfile.create({
      data: { userId: musicianUser.id, zoneId: zone.id, status: 'AMATEUR', objective: [] },
    });
    await prisma.match.create({
      data: {
        musicianId: musician.id,
        positionId: position.id,
        scoreGlobal: 92,
        scoreInstrument: 100,
        scoreStyle: 90,
        scoreZone: 100,
        scoreDisponibilite: 80,
        scoreNiveau: 100,
      },
    });

    const result = await controller.getMatches(position.id);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual({
      musicianId: musician.id,
      scoreGlobal: 92,
      sousScores: { instrument: 100, style: 90, zone: 100, disponibilite: 80, niveau: 100 },
      statut: 'PROPOSE',
    });
  });
});