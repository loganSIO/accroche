import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../infrastructure/prisma.client.js';
import { RegisterAccountController } from './register-account.controller.js';
import type { RegisterAccountDto } from '../dtos/register-account.dto.js';

async function cleanDatabase() {
  await prisma.match.deleteMany();
  await prisma.openPosition.deleteMany();
  await prisma.foundingProfile.deleteMany();
  await prisma.groupProfile.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.musicianStyle.deleteMany();
  await prisma.musicianInstrument.deleteMany();
  await prisma.musicianProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.zone.deleteMany();
}

function buildDto(overrides: Partial<RegisterAccountDto> = {}): RegisterAccountDto {
  return {
    email: 'multi-role@example.com',
    password: 'motdepasse123',
    zone: { latitude: 48.5734, longitude: 7.7521, rayonKm: 30, ville: 'Strasbourg' },
    musician: {
      status: 'amateur',
      instruments: [{ instrument: 'Guitare', niveau: 'avance' }],
      styles: ['Rock'],
      objective: ['join_group', 'found_group'],
      availabilities: [{ jourSemaine: 'samedi', creneauxJournee: 'soir' }],
      bio: 'Profil polyvalent',
    },
    groups: [
      {
        name: 'Les Accords',
        styles: ['Rock'],
        status: 'association',
        description: 'Premier groupe',
        audioLinks: [],
        requestedInstruments: [{ instrument: 'Basse', niveau: 'intermediaire' }],
      },
      {
        name: 'Projet Funk',
        styles: ['Funk'],
        status: 'professionnel',
        description: 'Second groupe',
        audioLinks: [],
        requestedInstruments: [
          { instrument: 'Batterie', niveau: 'avance' },
          { instrument: 'Clavier', niveau: 'expert' },
        ],
      },
    ],
    ...overrides,
  };
}

describe('RegisterAccountController (intégration réelle avec Postgres)', () => {
  const controller = new RegisterAccountController();

  beforeEach(cleanDatabase);
  afterEach(cleanDatabase);

  it('crée un seul utilisateur avec un musicien et plusieurs groupes', async () => {
    const result = await controller.register(buildDto());

    expect(result.meta.version).toBe('v1');
    expect(result.data.userId).toBeDefined();
    expect(result.data.musicianProfileId).toBeDefined();
    expect(result.data.groupIds).toHaveLength(2);
    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.musicianProfile.count()).toBe(1);
    expect(await prisma.groupProfile.count()).toBe(2);

    const groups = await prisma.groupProfile.findMany({
      where: { userId: result.data.userId },
      include: { positions: true },
      orderBy: { name: 'asc' },
    });
    expect(groups.map((group) => group.name)).toEqual(['Les Accords', 'Projet Funk']);
    expect(groups[0].positions).toHaveLength(1);
    expect(groups[0].positions[0]).toMatchObject({
      ownerType: 'GROUP',
      instrumentRecherche: 'Basse',
      niveauAttendu: 'intermediaire',
      groupProfileId: groups[0].id,
    });
    expect(groups[1].positions).toHaveLength(2);
  });

  it('peut créer un compte avec uniquement des groupes', async () => {
    const result = await controller.register(buildDto({ musician: undefined, groups: [buildDto().groups[0]] }));

    expect(result.data.musicianProfileId).toBeNull();
    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.musicianProfile.count()).toBe(0);
    expect(await prisma.groupProfile.count()).toBe(1);
  });

  it('ne laisse pas de données partielles si un email existe déjà', async () => {
    await controller.register(buildDto({ groups: [] }));

    await expect(controller.register(buildDto({ groups: [{ ...buildDto().groups[0], name: 'Groupe rejeté' }] }))).rejects.toThrow();

    expect(await prisma.user.count()).toBe(1);
    expect(await prisma.groupProfile.count()).toBe(0);
    expect(await prisma.musicianProfile.count()).toBe(1);
  });

  it('hache le mot de passe avant de le stocker en base', async () => {
  const result = await controller.register(buildDto({ password: 'secret-en-clair' }));

  const user = await prisma.user.findUnique({ where: { id: result.data.userId } });

  expect(user?.password).toBeDefined();
  expect(user?.password).not.toBe('secret-en-clair');
  });

  it('déclenche le calcul de match pour le musicien créé si un poste compatible existe déjà', async () => {
  const zone = await prisma.zone.create({
    data: { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' },
  });
  const groupUser = await prisma.user.create({
    data: { email: 'existing-group@example.com', password: 'hash', city: 'Strasbourg' },
  });
  const group = await prisma.groupProfile.create({
    data: { userId: groupUser.id, zoneId: zone.id, name: 'Groupe existant', styles: ['rock'], status: 'ASSOCIATION' },
  });
  await prisma.openPosition.create({
    data: { ownerType: 'GROUP', groupProfileId: group.id, instrumentRecherche: 'guitare', niveauAttendu: 'avance' },
  });

  const dto = buildDto({
    email: 'nouveau-musicien@example.com',
    groups: [],
    musician: {
      status: 'amateur',
      instruments: [{ instrument: 'guitare', niveau: 'avance' }],
      styles: ['Rock'],
      objective: ['join_group'],
      availabilities: [{ jourSemaine: 'samedi', creneauxJournee: 'soir' }],
    },
  });

  await controller.register(dto);

  const matches = await prisma.match.findMany();
  expect(matches).toHaveLength(1);
});
});
