import type { OpenPositionCandidate } from '../../domain/entities/open-position.entity.js';
import type { NiveauMusicien, Zone } from '../../domain/entities/musician.entity.js';

export interface CreateOpenPositionForGroupInput {
  groupProfileId: string;
  instrumentRecherche: string;
  niveauAttendu: NiveauMusicien;
}

export interface OpenPositionRepository {
  // Postes ouverts dont la zone recoupe potentiellement celle du musicien.
  // Le filtrage géographique précis reste un détail d'implémentation
  // (SQL/PostGIS côté infrastructure) ; ce port ne l'impose pas.
  findOpenPositionsNearZone(zone: Zone): Promise<OpenPositionCandidate[]>;

  

  // Créé un poste rattaché à un groupe existant. ownerType = GROUP est
  // garanti par construction ici : cette méthode ne peut pas créer de
  // poste rattaché à un FoundingProfile. Cf. décision produit : une
  // méthode/route séparée gérera les postes de type FOUNDING plus tard.
  createForGroup(input: CreateOpenPositionForGroupInput): Promise<OpenPositionCandidate>;
}