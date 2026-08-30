import { describe, expect, it, vi } from 'vitest';
import { CreateMusicianProfile } from './create-musician-profile.js';
import type { MusicianRepository, CreateMusicianInput } from '../ports/musician.repository.js';
import type { MusicianCandidate } from '../../domain/entities/musician.entity.js';

function buildInput(overrides: Partial<CreateMusicianInput> = {}): CreateMusicianInput {
  return {
    email: 'test@example.com',
    password: 'motdepasse123',
    city: 'Strasbourg',
    status: 'amateur',
    instruments: [{ instrument: 'guitare', niveau: 'avance' }],
    styles: ['rock'],
    availabilities: [{ jourSemaine: 'mardi', creneauxJournee: 'soir' }],
    zone: { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' },
    ...overrides,
  };
}

describe('CreateMusicianProfile', () => {
  it('délègue la création au repository et retourne le profil créé', async () => {
    const createdProfile: MusicianCandidate = {
      id: 'musician-1',
      instruments: [{ instrument: 'guitare', niveau: 'avance' }],
      styles: ['rock'],
      zone: { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' },
      availabilities: [{ jourSemaine: 'mardi', creneauxJournee: 'soir' }],
      status: 'amateur',
    };

    const repository: MusicianRepository = {
      findById: vi.fn(),
      create: vi.fn().mockResolvedValue(createdProfile),
    };

    const useCase = new CreateMusicianProfile(repository);
    const input = buildInput();
    const result = await useCase.execute(input);

    expect(repository.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(createdProfile);
  });
});