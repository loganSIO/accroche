import type { OpenPositionCandidate } from '../../domain/entities/open-position.entity.js';
import type { Zone } from '../../domain/entities/musician.entity.js';

export interface OpenPositionRepository {
  // Postes ouverts dont la zone recoupe potentiellement celle du musicien.
  // Le filtrage géographique précis reste un détail d'implémentation
  // (SQL/PostGIS côté infrastructure) ; ce port ne l'impose pas.
  findOpenPositionsNearZone(zone: Zone): Promise<OpenPositionCandidate[]>;
}