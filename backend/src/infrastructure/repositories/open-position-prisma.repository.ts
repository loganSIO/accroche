import type {
  OpenPositionRepository,
  CreateOpenPositionForGroupInput,
} from '../../application/ports/open-position.repository.js';
import type { OpenPositionCandidate } from '../../domain/entities/open-position.entity.js';
import type { Zone } from '../../domain/entities/musician.entity.js';
import { prisma } from '../prisma.client.js';
import { toOpenPositionCandidate } from '../mappers/open-position.mapper.js';

// Distance à vol d'oiseau — même formule que le domaine, dupliquée
// volontairement ici pour ne pas créer de dépendance entre Infrastructure
// et une fonction interne du Domaine. À factoriser dans un utilitaire
// partagé si la duplication devient gênante.
function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export class OpenPositionPrismaRepository implements OpenPositionRepository {
  async findOpenPositionsNearZone(zone: Zone): Promise<OpenPositionCandidate[]> {
    const records = await prisma.openPosition.findMany({
      where: { statut: 'OUVERT' },
      include: {
        groupProfile: { include: { zone: true } },
        foundingProfile: { include: { zone: true } },
      },
    });

    return records
      .map(toOpenPositionCandidate)
      .filter((position) => distanceKm(zone, position.zone) <= zone.rayonKm);
  }

  async createForGroup(input: CreateOpenPositionForGroupInput): Promise<OpenPositionCandidate> {
    const record = await prisma.openPosition.create({
      data: {
        ownerType: 'GROUP',
        groupProfileId: input.groupProfileId,
        instrumentRecherche: input.instrumentRecherche,
        niveauAttendu: input.niveauAttendu,
      },
      include: {
        groupProfile: { include: { zone: true } },
        foundingProfile: { include: { zone: true } },
      },
    });

    return toOpenPositionCandidate(record);
  }
}