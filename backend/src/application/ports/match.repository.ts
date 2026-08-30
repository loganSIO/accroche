import type { MatchResult } from '../../domain/entities/match.entity.js';

export interface PersistedMatch extends MatchResult {
  musicianId: string;
  positionId: string;
}

export interface MatchRepository {
  // Écrit ou met à jour le match pour cette paire musicien/poste — jamais de
  // création de match côté client, uniquement via ce use case interne.
  upsert(match: PersistedMatch): Promise<void>;
}