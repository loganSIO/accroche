import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../infrastructure/prisma.client.js';
import { MusicianProfileController } from './musician-profile.controller.js';

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
  musicianName: 'Nico',
  status: 'amateur' as const,
  instruments: [{ instrument: 'guitare', niveau: 'avance' as const }],
  styles: ['rock'],
  objective: ['join_group' as const],
  availabilities: [{ jourSemaine: 'mardi', creneauxJournee: 'soir' as const }],
  bio: 'Musicien strasbourgeois',
  zone: { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' },
  showcaseGroups: [{
    name: 'Les Accords',
    city: 'Strasbourg',
    position: 'guitare',
    status: 'association' as const,
    description: 'Groupe de vitrine',
  }],
};

describe('MusicianProfileController', () => {
  let controller: MusicianProfileController;
  let userId: string;

  beforeEach(async () => {
    await cleanDatabase();
    const user = await prisma.user.create({
      data: { email: 'profile@example.com', password: 'hash', city: 'Strasbourg' },
    });
    userId = user.id;
    controller = new MusicianProfileController();
  });

  afterEach(cleanDatabase);

  it('crée puis lit le profil du compte authentifié', async () => {
    const request = { user: { userId } } as never;
    const created = await controller.create(request, input);
    const result = await controller.get(request);

    expect(created.data).toMatchObject({ status: 'amateur', bio: input.bio, objective: input.objective });
    expect(result.data).toMatchObject({ id: created.data.id, styles: ['rock'] });
    expect(result.data.zone.ville).toBe('Strasbourg');
    expect(result.data.showcaseGroups).toEqual(input.showcaseGroups);
  });

  it('refuse de créer un second profil pour le même compte', async () => {
    const request = { user: { userId } } as never;
    await controller.create(request, input);

    await expect(controller.create(request, input)).rejects.toThrow(
      'Un profil musicien existe déjà pour cet utilisateur.',
    );
  });

  it('met à jour les champs fournis et remplace les collections', async () => {
    const request = { user: { userId } } as never;
    await controller.create(request, input);

    const result = await controller.update(request, {
      status: 'pro',
      instruments: [{ instrument: 'basse', niveau: 'expert' }],
      styles: ['jazz'],
      bio: 'Profil mis à jour',
    });

    expect(result.data).toMatchObject({
      status: 'pro',
      instruments: [{ instrument: 'basse', niveau: 'expert' }],
      styles: ['jazz'],
      bio: 'Profil mis à jour',
    });
    expect(result.data.availabilities).toEqual(input.availabilities);
    expect(result.data.showcaseGroups).toEqual(input.showcaseGroups);

    const showcaseUpdate = await controller.update(request, {
      showcaseGroups: [{
        name: 'Nouveau groupe',
        city: 'Colmar',
        position: 'basse',
        status: 'professionnel',
        description: 'Nouvelle vitrine',
      }],
    });
    expect(showcaseUpdate.data.showcaseGroups).toEqual([{
      name: 'Nouveau groupe',
      city: 'Colmar',
      position: 'basse',
      status: 'professionnel',
      description: 'Nouvelle vitrine',
    }]);
  });

  it('recalcule les matchs des postes existants après création du profil', async () => {
    const groupUser = await prisma.user.create({
      data: { email: 'group@example.com', password: 'hash', city: 'Strasbourg' },
    });
    const zone = await prisma.zone.create({
      data: { latitude: input.zone.latitude, longitude: input.zone.longitude, rayonKm: 20, ville: 'Strasbourg' },
    });
    const group = await prisma.groupProfile.create({
      data: {
        userId: groupUser.id,
        zoneId: zone.id,
        name: 'Groupe existant',
        styles: ['rock'],
        status: 'ASSOCIATION',
        audioLinks: [],
        positions: {
          create: [{
            ownerType: 'GROUP',
            instrumentRecherche: 'guitare',
            niveauAttendu: 'avance',
          }],
        },
      },
    });

    const request = { user: { userId } } as never;
    await controller.create(request, input);

    const match = await prisma.match.findFirst({
      where: { musicianId: (await prisma.musicianProfile.findUnique({ where: { userId } }))!.id },
      include: { position: true },
    });
    expect(match).toMatchObject({
      position: { groupProfileId: group.id },
      scoreGlobal: 100,
    });
  });

  it('retourne une erreur si le profil est absent', async () => {
    const request = { user: { userId } } as never;

    await expect(controller.get(request)).rejects.toThrow('Profil musicien introuvable.');
    await expect(controller.update(request, { bio: 'inexistant' })).rejects.toThrow(
      'Profil musicien introuvable.',
    );
  });
});
