export type MatchStatus = 'propose' | 'contacte' | 'ignore';
export interface MatchSubScores {
  instrument: number; style: number; zone: number; disponibilite: number; niveau: number;
}
export interface Match {
  id?: string; positionId: string; scoreGlobal: number; sousScores: MatchSubScores; statut: MatchStatus | string;
}
