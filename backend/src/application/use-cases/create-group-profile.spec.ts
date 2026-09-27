import { describe, expect, it, vi } from 'vitest';
import { CreateGroupProfile } from './create-group-profile.js';
import type { GroupRepository, CreateGroupInput, GroupCandidate } from '../ports/group.repository.js';
import type { PasswordHasher } from '../ports/password-hasher.js';

function buildInput(overrides: Partial<CreateGroupInput> = {}): CreateGroupInput {
  return {
    email: 'groupe@example.com',
    password: 'motdepasse123',
    city: 'Strasbourg',
    name: 'Les Testeurs',
    styles: ['rock'],
    status: 'association',
    description: 'Un groupe de test',
    audioLinks: [],
    zone: { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' },
    requestedInstruments: [{ instrument: 'basse', niveau: 'intermediaire' }],
    ...overrides,
  };
}

describe('CreateGroupProfile', () => {
  it('hache le mot de passe avant de déléguer la création au repository', async () => {
    const createdProfile = { id: 'group-1' } as GroupCandidate;
    const repository: GroupRepository = {
      findById: vi.fn(),
      belongsToUser: vi.fn(),
      create: vi.fn().mockResolvedValue(createdProfile),
    };
    const passwordHasher: PasswordHasher = {
      hash: vi.fn().mockResolvedValue('hash-simule'),
    };
    const useCase = new CreateGroupProfile(repository, passwordHasher);
    const input = buildInput();

    const result = await useCase.execute(input);

    expect(passwordHasher.hash).toHaveBeenCalledWith('motdepasse123');
    expect(repository.create).toHaveBeenCalledWith({ ...input, password: 'hash-simule' });
    expect(result).toEqual(createdProfile);
  });

  it('ne transmet jamais le mot de passe en clair au repository', async () => {
    const repository: GroupRepository = {
      findById: vi.fn(),
      belongsToUser: vi.fn(),
      create: vi.fn().mockResolvedValue({} as GroupCandidate),
    };
    const passwordHasher: PasswordHasher = {
      hash: vi.fn().mockResolvedValue('hash-simule'),
    };
    const useCase = new CreateGroupProfile(repository, passwordHasher);

    await useCase.execute(buildInput({ password: 'secret-en-clair' }));

    const createCallArg = (repository.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCallArg.password).not.toBe('secret-en-clair');
  });
});