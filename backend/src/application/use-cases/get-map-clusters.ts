import type { MapRepository, MapCluster } from '../ports/map.repository.js';

export class GetMapClusters {
  constructor(private readonly mapRepository: MapRepository) {}

  async execute(): Promise<MapCluster[]> {
    return this.mapRepository.getClusters();
  }
}