import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../infrastructure/prisma.client.js';
import { CreateGroupController } from './create-group.controller.js';
import type { CreateGroupDto } from '../dtos/create-group.dto.js';

async function cleanDatabase() {
  await prisma.openPosition.deleteMany();
  await prisma.groupProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.zone.deleteMany();
}

describe('CreateGroupController (intégration réelle avec Postgres)', () => {
  const controller = new CreateGroupController();

  beforeEach(cleanDatabase);
  afterEach(cleanDatabase);

  it('crée un groupe et retourne la réponse au format {data, meta}', async () => {
    const dto: CreateGroupDto = {
      email: 'e2e-groupe@example.com',
      password: 'motdepasse123',
      name: 'Groupe Test',
      styles: ['rock'],
      status: 'association',
      audioLinks: [],
      zone: { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' },
    };

    const result = await controller.create(dto);

    expect(result.data.id).toBeDefined();
    expect(result.data.name).toBe('Groupe Test');
    expect(result.meta.version).toBe('v1');
  });
});