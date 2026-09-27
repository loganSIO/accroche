import { describe, expect, it, vi } from 'vitest';
import { CreateOpenPositionForGroup, GroupNotFoundError } from './open-position-for-group.js';
import type { OpenPositionRepository } from '../ports/open-position.repository.js';
import type { GroupRepository, GroupCandidate } from '../ports/group.repository.js';
import type { OpenPositionCandidate } from '../../domain/entities/open-position.entity.js';

describe('CreateOpenPositionForGroup', () => {
  it('crée le poste si le groupe existe', async () => {
    const existingGroup = { id: 'group-1' } as GroupCandidate;
    const createdPosition = { id: 'position-1' } as OpenPositionCandidate;

    const openPositionRepository: OpenPositionRepository = {
      findOpenPositionsNearZone: vi.fn(),
      createForGroup: vi.fn().mockResolvedValue(createdPosition),
      findByGroupForUser: vi.fn(),
      updateForGroupUser: vi.fn(),
      deleteForGroupUser: vi.fn(),
    };
    const groupRepository: GroupRepository = {
      findById: vi.fn().mockResolvedValue(existingGroup),
      belongsToUser: vi.fn(),
      create: vi.fn(),
    };

    const useCase = new CreateOpenPositionForGroup(openPositionRepository, groupRepository);
    const result = await useCase.execute({
      groupProfileId: 'group-1',
      instrumentRecherche: 'guitare',
      niveauAttendu: 'avance',
    });

    expect(groupRepository.findById).toHaveBeenCalledWith('group-1');
    expect(openPositionRepository.createForGroup).toHaveBeenCalledWith({
      groupProfileId: 'group-1',
      instrumentRecherche: 'guitare',
      niveauAttendu: 'avance',
    });
    expect(result).toEqual(createdPosition);
  });

  it("lève une GroupNotFoundError si le groupe n'existe pas, sans créer le poste", async () => {
    const openPositionRepository: OpenPositionRepository = {
      findOpenPositionsNearZone: vi.fn(),
      createForGroup: vi.fn(),
      findByGroupForUser: vi.fn(),
      updateForGroupUser: vi.fn(),
      deleteForGroupUser: vi.fn(),
    };
    const groupRepository: GroupRepository = {
      findById: vi.fn().mockResolvedValue(null),
      belongsToUser: vi.fn(),
      create: vi.fn(),
    };

    const useCase = new CreateOpenPositionForGroup(openPositionRepository, groupRepository);

    await expect(
      useCase.execute({ groupProfileId: 'id-inexistant', instrumentRecherche: 'guitare', niveauAttendu: 'avance' }),
    ).rejects.toThrow(GroupNotFoundError);
    expect(openPositionRepository.createForGroup).not.toHaveBeenCalled();
  });
});