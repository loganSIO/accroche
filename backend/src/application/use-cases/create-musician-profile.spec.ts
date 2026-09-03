import { describe, expect, it, vi } from 'vitest';
import { CreateMusicianProfile } from './create-musician-profile.js';
import type { MusicianRepository, CreateMusicianInput } from '../ports/musician.repository.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
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
  it('hache le mot de passe avant de déléguer la création au repository', async () => {
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
    const passwordHasher: PasswordHasher = {
      hash: vi.fn().mockResolvedValue('hash-simule'),
    };
    const useCase = new CreateMusicianProfile(repository, passwordHasher);
    const input = buildInput();

    const result = await useCase.execute(input);

    expect(passwordHasher.hash).toHaveBeenCalledWith('motdepasse123');
    expect(repository.create).toHaveBeenCalledWith({ ...input, password: 'hash-simule' });
    expect(result).toEqual(createdProfile);
  });

  it('ne transmet jamais le mot de passe en clair au repository', async () => {
    const repository: MusicianRepository = {
      findById: vi.fn(),
      create: vi.fn().mockResolvedValue({} as MusicianCandidate),
    };
    const passwordHasher: PasswordHasher = {
      hash: vi.fn().mockResolvedValue('hash-simule'),
    };
    const useCase = new CreateMusicianProfile(repository, passwordHasher);

    await useCase.execute(buildInput({ password: 'secret-en-clair' }));

    const createCallArg = (repository.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCallArg.password).not.toBe('secret-en-clair');
  });
});