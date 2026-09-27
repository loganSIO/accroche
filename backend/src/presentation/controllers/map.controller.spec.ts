import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../infrastructure/prisma.client.js';
import { MapController } from './map.controller.js';

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

describe('MapController (intégration réelle avec Postgres)', () => {
  const controller = new MapController();

  beforeEach(cleanDatabase);
  afterEach(cleanDatabase);

  it('retourne un tableau vide sans données en base', async () => {
    const result = await controller.getClusters();

    expect(result.data).toEqual([]);
    expect(result.meta.version).toBe('v1');
  });

  it('agrège plusieurs profils de la même ville en un seul cluster, sans exposer de position individuelle', async () => {
    const zoneA = await prisma.zone.create({
      data: { latitude: 48.58, longitude: 7.75, rayonKm: 10, ville: 'Strasbourg' },
    });
    const zoneB = await prisma.zone.create({
      data: { latitude: 48.56, longitude: 7.76, rayonKm: 15, ville: 'Strasbourg' },
    });

    const userA = await prisma.user.create({ data: { email: 'a@example.com', password: 'hash', city: 'Strasbourg' } });
    await prisma.musicianProfile.create({
      data: { userId: userA.id, zoneId: zoneA.id, status: 'AMATEUR', objective: [] },
    });

    const userB = await prisma.user.create({ data: { email: 'b@example.com', password: 'hash', city: 'Strasbourg' } });
    await prisma.groupProfile.create({
      data: { userId: userB.id, zoneId: zoneB.id, name: 'Les Accords', styles: [], status: 'ASSOCIATION' },
    });

    const result = await controller.getClusters();

    expect(result.data).toHaveLength(1);
    expect(result.data[0].ville).toBe('Strasbourg');
    expect(result.data[0].musicianCount).toBe(1);
    expect(result.data[0].groupCount).toBe(1);
    // Le centroïde doit être la moyenne des deux zones, jamais l'une ou l'autre exactement.
    expect(result.data[0].latitude).toBe(48.57);
    expect(result.data[0].longitude).toBe(7.76);
    expect(result.data[0].latitude).not.toBe(zoneA.latitude);
    expect(result.data[0].latitude).not.toBe(zoneB.latitude);
  });

  it('sépare les clusters par ville', async () => {
    const zoneStrasbourg = await prisma.zone.create({
      data: { latitude: 48.58, longitude: 7.75, rayonKm: 10, ville: 'Strasbourg' },
    });
    const zoneMulhouse = await prisma.zone.create({
      data: { latitude: 47.75, longitude: 7.34, rayonKm: 10, ville: 'Mulhouse' },
    });

    const userA = await prisma.user.create({ data: { email: 'c@example.com', password: 'hash', city: 'Strasbourg' } });
    await prisma.musicianProfile.create({
      data: { userId: userA.id, zoneId: zoneStrasbourg.id, status: 'AMATEUR', objective: [] },
    });

    const userB = await prisma.user.create({ data: { email: 'd@example.com', password: 'hash', city: 'Mulhouse' } });
    await prisma.musicianProfile.create({
      data: { userId: userB.id, zoneId: zoneMulhouse.id, status: 'PRO', objective: [] },
    });

    const result = await controller.getClusters();

    expect(result.data).toHaveLength(2);
    const villes = result.data.map((c) => c.ville).sort();
    expect(villes).toEqual(['Mulhouse', 'Strasbourg']);
  });
});