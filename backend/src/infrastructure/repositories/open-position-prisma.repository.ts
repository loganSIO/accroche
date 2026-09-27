import type {
  OpenPositionRepository,
  CreateOpenPositionForGroupInput,
  ManagedOpenPosition,
  UpdateOpenPositionForGroupInput,
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

  async findByGroupForUser(groupProfileId: string, userId: string): Promise<ManagedOpenPosition[]> {
    const records = await prisma.openPosition.findMany({
      where: { groupProfileId, groupProfile: { userId } },
      orderBy: { createdAt: 'asc' },
    });
    return records.map(toManagedOpenPosition);
  }

  async updateForGroupUser(
    groupProfileId: string,
    positionId: string,
    userId: string,
    input: UpdateOpenPositionForGroupInput,
  ): Promise<ManagedOpenPosition | null> {
    const existing = await prisma.openPosition.findFirst({
      where: { id: positionId, groupProfileId, groupProfile: { userId } },
    });
    if (!existing) return null;

    const record = await prisma.openPosition.update({
      where: { id: positionId },
      data: {
        ...(input.instrumentRecherche !== undefined ? { instrumentRecherche: input.instrumentRecherche } : {}),
        ...(input.niveauAttendu !== undefined ? { niveauAttendu: input.niveauAttendu } : {}),
      },
    });
    return toManagedOpenPosition(record);
  }

  async deleteForGroupUser(groupProfileId: string, positionId: string, userId: string): Promise<boolean> {
    const result = await prisma.openPosition.deleteMany({
      where: { id: positionId, groupProfileId, groupProfile: { userId } },
    });
    return result.count === 1;
  }
}

function toManagedOpenPosition(record: {
  id: string;
  instrumentRecherche: string;
  niveauAttendu: string;
  statut: 'OUVERT' | 'POURVU' | 'ANNULE';
}): ManagedOpenPosition {
  return {
    id: record.id,
    instrument: record.instrumentRecherche,
    niveau: record.niveauAttendu as ManagedOpenPosition['niveau'],
    statut: record.statut.toLowerCase() as ManagedOpenPosition['statut'],
  };
}