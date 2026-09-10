import type { MusicianRepository } from '../ports/musician.repository.js';
import type { RecalculateMatchesForMusician } from './recalculate-matches-for-musician.js';
import type { OpenPositionCandidate } from '../../domain/entities/open-position.entity.js';

// Orchestration : un nouveau poste peut concerner plusieurs musiciens déjà
// existants dans la zone. Réutilise RecalculateMatchesForMusician tel quel
// (musicien par musicien) plutôt que de dupliquer sa logique de calcul —
// évite un second chemin de calcul de match à maintenir en parallèle.
export class RecalculateMatchesForNewPosition {
  constructor(
    private readonly musicianRepository: MusicianRepository,
    private readonly recalculateMatchesForMusician: RecalculateMatchesForMusician,
  ) {}

  async execute(position: OpenPositionCandidate): Promise<void> {
    const nearbyMusicians = await this.musicianRepository.findNearZone(position.zone);

    for (const musician of nearbyMusicians) {
      await this.recalculateMatchesForMusician.execute(musician.id);
    }
  }
}