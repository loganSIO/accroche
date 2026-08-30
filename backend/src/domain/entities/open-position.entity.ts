import type { NiveauMusicien, Zone } from './musician.entity.js';

export interface OpenPositionCandidate {
  id: string;
  instrumentRecherche: string;
  niveauAttendu: NiveauMusicien;
  stylesGroupe: string[];
  zone: Zone;
}