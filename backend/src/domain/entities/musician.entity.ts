// Entité pure du domaine — aucune dépendance à Prisma, NestJS ou toute
// techno d'infrastructure.

export type MemberStatus = 'amateur' | 'pro';

export interface MusicianInstrument {
  instrument: string;
  niveau: NiveauMusicien;
}

export type NiveauMusicien = 'debutant' | 'intermediaire' | 'avance' | 'expert';

export interface Availability {
  jourSemaine: string;
  creneauxJournee: 'matin' | 'apres-midi' | 'soir';
}

export interface MusicianShowcaseGroup {
  name: string;
  city: string;
  position: string;
  status: 'association' | 'professionnel';
  description: string;
}

export interface Zone {
  latitude: number;
  longitude: number;
  rayonKm: number;
  ville: string;
}

export interface MusicianCandidate {
  id: string;
  musicianName: string;
  instruments: MusicianInstrument[];
  styles: string[];
  zone: Zone;
  availabilities: Availability[];
  status: MemberStatus;
  objective?: string[];
  bio?: string;
  showcaseGroups: MusicianShowcaseGroup[];
}