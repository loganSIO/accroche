import type { GroupCandidate } from '../../application/ports/group.repository.js';
import type { GroupProfile, Zone } from '@prisma/client';

type GroupProfileWithZone = GroupProfile & { zone: Zone };

export function toGroupCandidate(record: GroupProfileWithZone): GroupCandidate {
  return {
    id: record.id,
    name: record.name,
    styles: record.styles,
    status: record.status.toLowerCase() as 'association' | 'professionnel',
    description: record.description,
    audioLinks: record.audioLinks,
    zone: {
      latitude: record.zone.latitude,
      longitude: record.zone.longitude,
      rayonKm: record.zone.rayonKm,
      ville: record.zone.ville,
    },
  };
}