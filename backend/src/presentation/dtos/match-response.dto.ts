// DTO de sortie — la forme exacte exposée au client HTTP. Distinct de
// MatchResult (domaine) : peut évoluer indépendamment (ex: ajouter un champ
// d'affichage) sans toucher à la logique métier.
export class MatchResponseDto {
  id!: string;
  positionId!: string;
  scoreGlobal!: number;
  sousScores!: {
    instrument: number;
    style: number;
    zone: number;
    disponibilite: number;
    niveau: number;
  };
  statut!: string;
}