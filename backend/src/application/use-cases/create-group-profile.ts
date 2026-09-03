import type { GroupRepository, CreateGroupInput, GroupCandidate } from '../ports/group.repository.js';
import type { PasswordHasher } from '../ports/password-hasher.js';

export class CreateGroupProfile {
  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateGroupInput): Promise<GroupCandidate> {
    const hashedPassword = await this.passwordHasher.hash(input.password);
    return this.groupRepository.create({ ...input, password: hashedPassword });
  }
}