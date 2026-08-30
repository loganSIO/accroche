import type { GroupRepository, CreateGroupInput, GroupCandidate } from '../ports/group.repository.js';

export class CreateGroupProfile {
  constructor(private readonly groupRepository: GroupRepository) {}

  async execute(input: CreateGroupInput): Promise<GroupCandidate> {
    return this.groupRepository.create(input);
  }
}