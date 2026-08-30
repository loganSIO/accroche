import type { PersistedMatch } from '../../application/ports/match.repository.js';
import type { Prisma } from '@prisma/client';

// Convertit un match du domaine (sous-scores nommés explicitement) vers les
// colonnes plates attendues par Prisma.
export function toPrismaMatchData(match: PersistedMatch): Prisma.MatchUncheckedCreateInput {
  return {
    musicianId: match.musicianId,
    positionId: match.positionId,
    scoreGlobal: match.scoreGlobal,
    scoreInstrument: match.sousScores.instrument,
    scoreStyle: match.sousScores.style,
    scoreZone: match.sousScores.zone,
    scoreDisponibilite: match.sousScores.disponibilite,
    scoreNiveau: match.sousScores.niveau,
  };
}