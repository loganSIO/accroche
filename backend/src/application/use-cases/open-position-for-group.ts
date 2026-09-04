import type { OpenPositionRepository, CreateOpenPositionForGroupInput } from '../ports/open-position.repository.js';
import type { GroupRepository } from '../ports/group.repository.js';
import type { OpenPositionCandidate } from '../../domain/entities/open-position.entity.js';

export class GroupNotFoundError extends Error {
  constructor(groupId: string) {
    super(`Groupe ${groupId} introuvable.`);
    this.name = 'GroupNotFoundError';
  }
}

// Vérifie que le groupe existe avant de créer le poste — évite une erreur
// Prisma brute (contrainte de clé étrangère) et permet au controller de
// traduire ça en 404 propre plutôt qu'en 500.
export class CreateOpenPositionForGroup {
  constructor(
    private readonly openPositionRepository: OpenPositionRepository,
    private readonly groupRepository: GroupRepository,
  ) {}

  async execute(input: CreateOpenPositionForGroupInput): Promise<OpenPositionCandidate> {
    const group = await this.groupRepository.findById(input.groupProfileId);

    if (!group) {
      throw new GroupNotFoundError(input.groupProfileId);
    }

    return this.openPositionRepository.createForGroup(input);
  }
}