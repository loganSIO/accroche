// DTO de sortie pour GET /positions/:id/matches — symétrique de
// MatchResponseDto mais orienté "quel musicien a matché" plutôt que
// "quel poste a matché", puisque le poste est déjà connu via l'URL.
export class PositionMatchResponseDto {
  musicianId!: string;
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