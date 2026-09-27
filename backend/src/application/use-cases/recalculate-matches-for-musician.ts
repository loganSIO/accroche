import { calculateMatch } from '../../domain/services/calculate-match.service.js';
import type { MusicianRepository } from '../ports/musician.repository.js';
import type { OpenPositionRepository } from '../ports/open-position.repository.js';
import type { MatchRepository } from '../ports/match.repository.js';

// Orchestration pure : récupère le musicien, récupère les postes ouverts en
// zone, appelle le domaine pour scorer chacun, persiste les résultats.
// Ne contient elle-même aucune règle métier (c'est le rôle du domaine),
// ne connaît aucune implémentation concrète (Prisma, etc.), seulement des
// ports/interfaces injectés au constructeur.
export class RecalculateMatchesForMusician {
  constructor(
    private readonly musicianRepository: MusicianRepository,
    private readonly openPositionRepository: OpenPositionRepository,
    private readonly matchRepository: MatchRepository,
  ) {}

  async execute(musicianId: string): Promise<void> {
    const musician = await this.musicianRepository.findById(musicianId);
    if (!musician) {
      return;
    }

    const positions = await this.openPositionRepository.findOpenPositionsNearZone(musician.zone, musician.id);

    for (const position of positions) {
      const result = calculateMatch(musician, position);

      await this.matchRepository.upsert({
        musicianId: musician.id,
        positionId: position.id,
        ...result,
      });
    }
  }
}