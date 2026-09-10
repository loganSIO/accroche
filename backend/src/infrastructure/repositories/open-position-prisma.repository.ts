import type {
  OpenPositionRepository,
  CreateOpenPositionForGroupInput,
} from '../../application/ports/open-position.repository.js';
import type { OpenPositionCandidate } from '../../domain/entities/open-position.entity.js';
import type { Zone } from '../../domain/entities/musician.entity.js';
import { prisma } from '../prisma.client.js';
import { toOpenPositionCandidate } from '../mappers/open-position.mapper.js';
import { distanceKm } from '../geo/distance.js';

// Distance à vol d'oiseau — même formule que le domaine, dupliquée
// volontairement ici pour ne pas créer de dépendance entre Infrastructure
// et une fonction interne du Domaine. À factoriser dans un utilitaire
// partagé si la duplication devient gênante.

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