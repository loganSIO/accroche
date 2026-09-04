export interface MapCluster {
  ville: string;
  latitude: number;   // centroïde des zones agrégées, jamais la position d'un profil individuel
  longitude: number;  // idem
  musicianCount: number;
  groupCount: number;
}

export interface MapRepository {
  // Agrège par ville plutôt que par Zone individuelle — une Zone
  // correspond à un seul profil, donc l'exposer telle quelle
  // révélerait sa position exacte. Cf. principe de confidentialité
  // du MVP : "pas de position exacte tant qu'il n'y a pas de match".
  getClusters(): Promise<MapCluster[]>;
}