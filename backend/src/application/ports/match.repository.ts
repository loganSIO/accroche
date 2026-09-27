import type { MatchResult } from '../../domain/entities/match.entity.js';

export interface PersistedMatch extends MatchResult {
  musicianId: string;
  positionId: string;
}

export interface MatchWithStatus extends PersistedMatch {
  id: string;
  statut: string;
}

export interface MatchRepository {
  // Écrit ou met à jour le match pour cette paire musicien/poste — jamais de
  // création de match côté client, uniquement via ce use case interne.
  upsert(match: PersistedMatch): Promise<void>;

  // Lecture des matchs déjà calculés pour un musicien, triés par score
  // décroissant — utilisé par le controller pour l'affichage.
  findByMusicianId(musicianId: string): Promise<MatchWithStatus[]>;

  // Lecture des matchs déjà calculés pour un poste, triés par score
  // décroissant — symétrique de findByMusicianId, utilisé côté groupe pour
  // voir les musiciens compatibles avec un poste donné.
  findByPositionId(positionId: string): Promise<MatchWithStatus[]>;
}