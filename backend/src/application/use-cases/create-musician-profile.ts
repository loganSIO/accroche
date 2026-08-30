import type { MusicianRepository, CreateMusicianInput } from '../ports/musician.repository.js';
import type { MusicianCandidate } from '../../domain/entities/musician.entity.js';

// Orchestration simple pour l'instant : délègue directement au repository.
// Le use case existe malgré tout comme point d'entrée unique côté
// Application — c'est ici qu'on ajoutera plus tard des règles (ex: envoi
// d'un email de bienvenue, validation métier supplémentaire) sans toucher
// au controller ni au repository.
export class CreateMusicianProfile {
  constructor(private readonly musicianRepository: MusicianRepository) {}

  async execute(input: CreateMusicianInput): Promise<MusicianCandidate> {
    return this.musicianRepository.create(input);
  }
}