import type { OpenPositionCandidate } from '../../domain/entities/open-position.entity.js';
import type { NiveauMusicien } from '../../domain/entities/musician.entity.js';
import type { OpenPosition, GroupProfile, FoundingProfile, Zone } from '@prisma/client';

type OpenPositionWithRelations = OpenPosition & {
  groupProfile: (GroupProfile & { zone: Zone }) | null;
  foundingProfile: (FoundingProfile & { zone: Zone }) | null;
};

// Le poste hérite de la zone et des styles de son propriétaire (groupe ou
// profil fondateur) — c'est pourquoi le mapper doit gérer les deux cas.
export function toOpenPositionCandidate(record: OpenPositionWithRelations): OpenPositionCandidate {
  const owner = record.groupProfile ?? record.foundingProfile;

  if (!owner) {
    throw new Error(
      `OpenPosition ${record.id} n'a ni groupProfile ni foundingProfile — donnée incohérente.`,
    );
  }

  return {
    id: record.id,
    instrumentRecherche: record.instrumentRecherche,
    niveauAttendu: record.niveauAttendu as NiveauMusicien,
    stylesGroupe: record.groupProfile?.styles ?? record.foundingProfile?.styles ?? [],
    zone: {
      latitude: owner.zone.latitude,
      longitude: owner.zone.longitude,
      rayonKm: owner.zone.rayonKm,
      ville: owner.zone.ville,
    },
  };
}