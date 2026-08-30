import type { MusicianCandidate, NiveauMusicien } from '../../domain/entities/musician.entity.js';
import type {
  MusicianProfile,
  MusicianInstrument,
  MusicianStyle,
  Availability,
  Zone,
} from '@prisma/client';

type MusicianProfileWithRelations = MusicianProfile & {
  instruments: MusicianInstrument[];
  styles: MusicianStyle[];
  availabilities: Availability[];
  zone: Zone;
};

// Convertit le modèle Prisma (normalisé en plusieurs tables) vers l'entité
// pure du domaine. Seul ce mapper connaît la forme exacte des tables Prisma.
export function toMusicianCandidate(record: MusicianProfileWithRelations): MusicianCandidate {
  return {
    id: record.id,
    instruments: record.instruments.map((i) => ({
      instrument: i.instrument,
      niveau: i.niveau as NiveauMusicien,
    })),
    styles: record.styles.map((s) => s.style),
    zone: {
      latitude: record.zone.latitude,
      longitude: record.zone.longitude,
      rayonKm: record.zone.rayonKm,
      ville: record.zone.ville,
    },
    availabilities: record.availabilities.map((a) => ({
      jourSemaine: a.jourSemaine,
      creneauxJournee: a.creneauxJournee as 'matin' | 'apres-midi' | 'soir',
    })),
    status: record.status.toLowerCase() as 'amateur' | 'pro',
  };
}