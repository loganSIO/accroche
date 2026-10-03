import type {
  MatchRepository,
  PersistedMatch,
  MatchWithStatus,
} from '../../application/ports/match.repository.js';
import { prisma } from '../prisma.client.js';
import { toPrismaMatchData } from '../mappers/match.mapper.js';

export class MatchPrismaRepository implements MatchRepository {
  async upsert(match: PersistedMatch): Promise<void> {
    const data = toPrismaMatchData(match);

    await prisma.match.upsert({
      where: {
        musicianId_positionId: {
          musicianId: match.musicianId,
          positionId: match.positionId,
        },
      },
      create: data,
      update: data,
    });
  }

  async findByMusicianId(musicianId: string): Promise<MatchWithStatus[]> {
    const musician = await prisma.musicianProfile.findUnique({
      where: { id: musicianId },
      select: { userId: true },
    });
    if (!musician) return [];
    const records = await prisma.match.findMany({
      where: {
        musicianId,
        scoreGlobal: { gt: 50 },
        NOT: {
          OR: [
            { position: { groupProfile: { userId: musician.userId } } },
            { position: { foundingProfile: { founderMusicianId: musicianId } } },
          ],
        },
      },
      orderBy: { scoreGlobal: 'desc' },
      take: 5,
    });

    return records.map((record) => ({
      id: record.id,
      musicianId: record.musicianId,
      positionId: record.positionId,
      scoreGlobal: record.scoreGlobal,
      statut: record.statut,
      sousScores: {
        instrument: record.scoreInstrument,
        style: record.scoreStyle,
        zone: record.scoreZone,
        disponibilite: record.scoreDisponibilite,
        niveau: record.scoreNiveau,
      },
    }));
  }

  async findByPositionId(positionId: string): Promise<MatchWithStatus[]> {
  const records = await prisma.match.findMany({
    where: { positionId, scoreGlobal: { gt: 50 } },
    orderBy: { scoreGlobal: 'desc' },
    take: 5,
  });

  return records.map((record) => ({
    id: record.id,
    musicianId: record.musicianId,
    positionId: record.positionId,
    scoreGlobal: record.scoreGlobal,
    statut: record.statut,
    sousScores: {
      instrument: record.scoreInstrument,
      style: record.scoreStyle,
      zone: record.scoreZone,
      disponibilite: record.scoreDisponibilite,
      niveau: record.scoreNiveau,
    },
  }));
}
}