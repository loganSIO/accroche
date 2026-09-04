import { Controller, Get } from '@nestjs/common';
import { MapPrismaRepository } from '../../infrastructure/repositories/map-prisma.repository.js';
import { GetMapClusters } from '../../application/use-cases/get-map-clusters.js';

@Controller('api/v1/map')
export class MapController {
  private readonly getMapClusters = new GetMapClusters(new MapPrismaRepository());

  @Get()
  async getClusters() {
    const clusters = await this.getMapClusters.execute();

    return {
      data: clusters,
      meta: { timestamp: new Date().toISOString(), version: 'v1' },
    };
  }
}