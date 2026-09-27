import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { MatchPrismaRepository } from '../../infrastructure/repositories/match-prisma.repository.js';
import { MusicianPrismaRepository } from '../../infrastructure/repositories/musician-prisma.repository.js';
import { PublicProfilePrismaRepository } from '../../infrastructure/repositories/public-profile-prisma.repository.js';
import type { MatchResponseDto } from '../dtos/match-response.dto.js';

// Couche Présentation : traduit les requêtes HTTP vers l'infrastructure.
// Pour ces endpoints, on appelle directement le repository (lecture
// simple, aucune règle métier à orchestrer). Les endpoints d'écriture
// passeront par un use case de la couche Application, comme
// RecalculateMatchesForMusician.
@Controller('api/v1/musicians')
export class MusiciansController {
  private readonly matchRepository = new MatchPrismaRepository();
  private readonly musicianRepository = new MusicianPrismaRepository();
  private readonly publicProfiles = new PublicProfilePrismaRepository();

  @Get(':id')
  async getById(@Param('id') id: string) {
    const musician = await this.publicProfiles.findMusicianById(id);

    if (!musician) {
      throw new NotFoundException(`Musicien ${id} introuvable.`);
    }

    return {
      data: musician,
      meta: { timestamp: new Date().toISOString(), version: 'v1' },
    };
  }

  @Get(':id/matches')
  async getMatches(@Param('id') id: string): Promise<{ data: MatchResponseDto[]; meta: { timestamp: string; version: string } }> {
    const matches = await this.matchRepository.findByMusicianId(id);
    return {
      data: matches.map((m) => ({
        positionId: m.positionId,
        scoreGlobal: m.scoreGlobal,
        sousScores: m.sousScores,
        statut: m.statut,
      })),
      meta: { timestamp: new Date().toISOString(), version: 'v1' },
    };
  }
}