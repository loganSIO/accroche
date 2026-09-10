import { Controller, Get, Param } from '@nestjs/common';
import { MatchPrismaRepository } from '../../infrastructure/repositories/match-prisma.repository.js';
import type { PositionMatchResponseDto } from '../dtos/position-match-response.dto.js';

// Couche Présentation : lecture simple, aucune règle métier à orchestrer,
// donc appel direct au repository — même convention que MusiciansController.
@Controller('api/v1/positions')
export class PositionsController {
  private readonly matchRepository = new MatchPrismaRepository();

  @Get(':id/matches')
  async getMatches(@Param('id') id: string): Promise<{ data: PositionMatchResponseDto[]; meta: { timestamp: string; version: string } }> {
    const matches = await this.matchRepository.findByPositionId(id);

    return {
      data: matches.map((m) => ({
        musicianId: m.musicianId,
        scoreGlobal: m.scoreGlobal,
        sousScores: m.sousScores,
        statut: m.statut,
      })),
      meta: { timestamp: new Date().toISOString(), version: 'v1' },
    };
  }
}