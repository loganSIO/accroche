import type { MapRepository, MapCluster } from '../../application/ports/map.repository.js';
import { prisma } from '../prisma.client.js';

export class MapPrismaRepository implements MapRepository {
  async getClusters(): Promise<MapCluster[]> {
    const zones = await prisma.zone.findMany({
      include: {
        _count: { select: { musicianProfiles: true, groupProfiles: true } },
      },
    });

    const clustersByVille = new Map<string, { latSum: number; lngSum: number; count: number; musicianCount: number; groupCount: number }>();

    for (const zone of zones) {
      const existing = clustersByVille.get(zone.ville) ?? {
        latSum: 0,
        lngSum: 0,
        count: 0,
        musicianCount: 0,
        groupCount: 0,
      };
      clustersByVille.set(zone.ville, {
        latSum: existing.latSum + zone.latitude,
        lngSum: existing.lngSum + zone.longitude,
        count: existing.count + 1,
        musicianCount: existing.musicianCount + zone._count.musicianProfiles,
        groupCount: existing.groupCount + zone._count.groupProfiles,
      });
    }

    return Array.from(clustersByVille.entries()).map(([ville, agg]) => ({
      ville,
      latitude: agg.latSum / agg.count,
      longitude: agg.lngSum / agg.count,
      musicianCount: agg.musicianCount,
      groupCount: agg.groupCount,
    }));
  }
}