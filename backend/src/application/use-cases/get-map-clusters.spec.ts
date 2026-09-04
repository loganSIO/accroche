import { describe, expect, it, vi } from 'vitest';
import { GetMapClusters } from './get-map-clusters.js';
import type { MapRepository, MapCluster } from '../ports/map.repository.js';

describe('GetMapClusters', () => {
  it('délègue au repository et retourne les clusters', async () => {
    const clusters: MapCluster[] = [
      { ville: 'Strasbourg', latitude: 48.5734, longitude: 7.7521, musicianCount: 3, groupCount: 1 },
    ];
    const mapRepository: MapRepository = {
      getClusters: vi.fn().mockResolvedValue(clusters),
    };

    const useCase = new GetMapClusters(mapRepository);
    const result = await useCase.execute();

    expect(mapRepository.getClusters).toHaveBeenCalled();
    expect(result).toEqual(clusters);
  });
});