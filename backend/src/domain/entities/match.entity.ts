// Sous-scores stockés/exposés séparément — jamais uniquement le total.
// Nécessaire pour l'affichage détaillé ("90% — instrument ✓ style ✓ zone ✓")
// et pour permettre une pondération personnalisable plus tard sans rejouer
// le calcul depuis zéro.

export interface MatchSubScores {
  instrument: number;
  style: number;
  zone: number;
  disponibilite: number;
  niveau: number;
}

export interface MatchResult {
  scoreGlobal: number;
  sousScores: MatchSubScores;
}