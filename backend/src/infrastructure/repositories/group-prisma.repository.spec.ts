import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../prisma.client.js';
import { GroupPrismaRepository } from './group-prisma.repository.js';
import type { CreateGroupInput } from '../../application/ports/group.repository.js';

async function cleanDatabase() {
  await prisma.openPosition.deleteMany();
  await prisma.groupProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.zone.deleteMany();
}

describe('GroupPrismaRepository (intégration réelle avec Postgres)', () => {
  const repository = new GroupPrismaRepository();

  beforeEach(cleanDatabase);
  afterEach(cleanDatabase);

  it('crée un User, une Zone et un GroupProfile complets et cohérents', async () => {
    const input: CreateGroupInput = {
      email: 'groupe-test@example.com',
      password: 'hash',
      city: 'Strasbourg',
      name: 'Les Trois Accords',
      styles: ['rock', 'indie'],
      status: 'association',
      description: 'Groupe rock strasbourgeois',
      audioLinks: ['https://soundcloud.com/exemple'],
      zone: { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' },
    };

    const result = await repository.create(input);

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Les Trois Accords');
    expect(result.styles).toEqual(['rock', 'indie']);
    expect(result.status).toBe('association');
    expect(result.zone.ville).toBe('Strasbourg');
  });

  it('retourne null si le groupe n\'existe pas', async () => {
    const result = await repository.findById('id-inexistant');
    expect(result).toBeNull();
  });
});