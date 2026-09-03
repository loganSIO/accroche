import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../infrastructure/prisma.client.js';
import { GroupsController } from './groups.controller.js';

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

describe('GroupsController.getById (intégration réelle avec Postgres)', () => {
  const controller = new GroupsController();

  beforeEach(cleanDatabase);
  afterEach(cleanDatabase);

  it('retourne le groupe au format {data, meta} quand il existe', async () => {
    const zone = await prisma.zone.create({
      data: { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' },
    });
    const user = await prisma.user.create({
      data: { email: 'g@example.com', password: 'hash', city: 'Strasbourg' },
    });
    const group = await prisma.groupProfile.create({
      data: {
        userId: user.id,
        zoneId: zone.id,
        name: 'Les Accords',
        styles: ['rock'],
        status: 'ASSOCIATION',
        description: 'Un groupe de test',
      },
    });

    const result = await controller.getById(group.id);

    expect(result.meta.version).toBe('v1');
    expect(result.data.id).toBe(group.id);
    expect(result.data.name).toBe('Les Accords');
    expect(result.data.status).toBe('association');
  });

  it("lève une 404 si le groupe n'existe pas", async () => {
    await expect(controller.getById('id-inexistant')).rejects.toThrow('Groupe id-inexistant introuvable.');
  });
});