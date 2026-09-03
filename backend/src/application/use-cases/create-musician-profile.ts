import type { MusicianRepository, CreateMusicianInput } from '../ports/musician.repository.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type { MusicianCandidate } from '../../domain/entities/musician.entity.js';

export class CreateMusicianProfile {
  constructor(
    private readonly musicianRepository: MusicianRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateMusicianInput): Promise<MusicianCandidate> {
    const hashedPassword = await this.passwordHasher.hash(input.password);
    return this.musicianRepository.create({ ...input, password: hashedPassword });
  }
}