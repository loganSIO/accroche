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
  });

  it('retourne une erreur si le profil est absent', async () => {
    const request = { user: { userId } } as never;

    await expect(controller.get(request)).rejects.toThrow('Profil musicien introuvable.');
    await expect(controller.update(request, { bio: 'inexistant' })).rejects.toThrow(
      'Profil musicien introuvable.',
    );
  });
});
