import type { MusicianCandidate, NiveauMusicien } from '../../domain/entities/musician.entity.js';
import type {
  MusicianProfile,
  MusicianInstrument,
  MusicianStyle,
  Availability,
  MusicianShowcaseGroup,
  Zone,
} from '@prisma/client';

type MusicianProfileWithRelations = MusicianProfile & {
  instruments: MusicianInstrument[];
  styles: MusicianStyle[];
  availabilities: Availability[];
  showcaseGroups?: MusicianShowcaseGroup[];
  zone: Zone;
};

// Convertit le modèle Prisma (normalisé en plusieurs tables) vers l'entité
// pure du domaine. Seul ce mapper connaît la forme exacte des tables Prisma.
export function toMusicianCandidate(record: MusicianProfileWithRelations): MusicianCandidate {
  return {
    id: record.id,
    musicianName: record.musicianName,
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
    objective: record.objective,
    bio: record.bio ?? undefined,
    showcaseGroups: (record.showcaseGroups ?? []).map((group) => ({
      name: group.name,
      city: group.city,
      position: group.position,
      status: group.status.toLowerCase() as 'association' | 'professionnel',
      description: group.description,
    })),
  };
}