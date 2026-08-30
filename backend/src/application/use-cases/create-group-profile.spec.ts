import { describe, expect, it, vi } from 'vitest';
import { CreateGroupProfile } from './create-group-profile.js';
import type { GroupRepository, CreateGroupInput, GroupCandidate } from '../ports/group.repository.js';

function buildInput(overrides: Partial<CreateGroupInput> = {}): CreateGroupInput {
  return {
    email: 'groupe@example.com',
    password: 'motdepasse123',
    city: 'Strasbourg',
    name: 'Les Trois Accords',
    styles: ['rock'],
    status: 'association',
    audioLinks: [],
    zone: { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' },
    ...overrides,
  };
}

describe('CreateGroupProfile', () => {
  it('délègue la création au repository et retourne le profil créé', async () => {
    const createdGroup: GroupCandidate = {
      id: 'group-1',
      name: 'Les Trois Accords',
      styles: ['rock'],
      status: 'association',
      description: null,
      audioLinks: [],
      zone: { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' },
    };

    const repository: GroupRepository = {
      findById: vi.fn(),
      create: vi.fn().mockResolvedValue(createdGroup),
    };

    const useCase = new CreateGroupProfile(repository);
    const input = buildInput();
    const result = await useCase.execute(input);

    expect(repository.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(createdGroup);
  });
});