import type { MatchRepository, PersistedMatch } from '../../application/ports/match.repository.js';
import { prisma } from '../prisma.client.js';
import { toPrismaMatchData } from '../mappers/match.mapper.js';

export class MatchPrismaRepository implements MatchRepository {
  async upsert(match: PersistedMatch): Promise<void> {
    const data = toPrismaMatchData(match);

    // Un match par paire (musicien, poste) — recalculer met à jour l'existant
    // plutôt que d'en créer un doublon. Contrainte @@unique déjà posée dans
    // le schéma Prisma.
    await prisma.match.upsert({
      where: {
        musicianId_positionId: {
          musicianId: match.musicianId,
          positionId: match.positionId,
        },
      },
      create: data,
      update: data,
    });
  }
}