import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../infrastructure/prisma.client.js';
import { GroupsController } from './groups.controller.js';
import { UserGroupsController } from './user-groups.controller.js';

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

const input = {
  name: 'Les Accords',
  styles: ['rock'],
  status: 'association' as const,
  description: 'Groupe strasbourgeois',
  audioLinks: ['https://example.com/demo.mp3'],
  zone: { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' },
};

describe('UserGroupsController et gestion du propriétaire', () => {
  let userId: string;
  let otherUserId: string;
  let userGroups: UserGroupsController;
  let groups: GroupsController;

  beforeEach(async () => {
    await cleanDatabase();
    const user = await prisma.user.create({
      data: { email: 'owner@example.com', password: 'hash', city: 'Strasbourg' },
    });
    const otherUser = await prisma.user.create({
      data: { email: 'other@example.com', password: 'hash', city: 'Strasbourg' },
    });
    userId = user.id;
    otherUserId = otherUser.id;
    userGroups = new UserGroupsController();
    groups = new GroupsController();
  });

  afterEach(cleanDatabase);

  it('crée et liste les groupes de l’utilisateur connecté', async () => {
    const request = { user: { userId } } as never;
    const created = await userGroups.create(request, input);
    const result = await userGroups.list(request);

    expect(created.data).toMatchObject({ name: input.name, status: 'association' });
    expect(created.data.zone.ville).toBe('Strasbourg');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(created.data.id);
  });

  it('met à jour et supprime uniquement un groupe appartenant à l’utilisateur', async () => {
    const request = { user: { userId } } as never;
    const created = await userGroups.create(request, input);

    const updated = await groups.update(request, created.data.id, {
      name: 'Les Nouveaux Accords',
      styles: ['jazz'],
    });
    expect(updated.data).toMatchObject({ name: 'Les Nouveaux Accords', styles: ['jazz'] });

    await expect(
      groups.update({ user: { userId: otherUserId } } as never, created.data.id, { name: 'Intrus' }),
    ).rejects.toThrow(`Groupe ${created.data.id} introuvable.`);

    const removed = await groups.remove(request, created.data.id);
    expect(removed.data.success).toBe(true);
    await expect(groups.getById(created.data.id)).rejects.toThrow(
      `Groupe ${created.data.id} introuvable.`,
    );
  });

  it('supprime également les postes du groupe, sans créer de membership musicien', async () => {
    const request = { user: { userId } } as never;
    const created = await userGroups.create(request, input);
    await prisma.openPosition.create({
      data: {
        ownerType: 'GROUP',
        groupProfileId: created.data.id,
        instrumentRecherche: 'basse',
        niveauAttendu: 'intermediaire',
      },
    });

    await groups.remove(request, created.data.id);

    expect(await prisma.openPosition.count({ where: { groupProfileId: created.data.id } })).toBe(0);
    expect(await prisma.musicianProfile.count()).toBe(0);
  });
});
