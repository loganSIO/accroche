import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { GroupPrismaRepository } from '../../infrastructure/repositories/group-prisma.repository.js';
import { OpenPositionPrismaRepository } from '../../infrastructure/repositories/open-position-prisma.repository.js';
import { MusicianPrismaRepository } from '../../infrastructure/repositories/musician-prisma.repository.js';
import { MatchPrismaRepository } from '../../infrastructure/repositories/match-prisma.repository.js';
import { CreateOpenPositionForGroup, GroupNotFoundError } from '../../application/use-cases/open-position-for-group.js';
import { RecalculateMatchesForMusician } from '../../application/use-cases/recalculate-matches-for-musician.js';
import { RecalculateMatchesForNewPosition } from '../../application/use-cases/recalculate-matches-for-new-position.js';
import { CreateOpenPositionDto } from '../dtos/create-open-position.dto.js';
import { UpdateGroupProfileDto } from '../dtos/group-profile.dto.js';
import { AccessTokenGuard, type AuthenticatedRequest } from '../guards/access-token.guard.js';

@Controller('api/v1/groups')
export class GroupsController {
  private readonly groupRepository = new GroupPrismaRepository();
  private readonly createOpenPositionForGroup = new CreateOpenPositionForGroup(
    new OpenPositionPrismaRepository(),
    new GroupPrismaRepository(),
  );
  private readonly recalculateMatchesForMusician = new RecalculateMatchesForMusician(
    new MusicianPrismaRepository(),
    new OpenPositionPrismaRepository(),
    new MatchPrismaRepository(),
  );
  private readonly recalculateMatchesForNewPosition = new RecalculateMatchesForNewPosition(
    new MusicianPrismaRepository(),
    this.recalculateMatchesForMusician,
  );

  @Get(':id')
  async getById(@Param('id') id: string) {
    const group = await this.groupRepository.findById(id);
    if (!group) {
      throw new NotFoundException(`Groupe ${id} introuvable.`);
    }

    return {
      data: group,
      meta: { timestamp: new Date().toISOString(), version: 'v1' },
    };
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard)
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateGroupProfileDto,
  ) {
    const group = await this.groupRepository.updateForUser(id, request.user.userId, dto);
    if (!group) throw new NotFoundException(`Groupe ${id} introuvable.`);
    return {
      data: group,
      meta: { timestamp: new Date().toISOString(), version: 'v1' },
    };
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard)
  async remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    const deleted = await this.groupRepository.deleteForUser(id, request.user.userId);
    if (!deleted) throw new NotFoundException(`Groupe ${id} introuvable.`);
    return {
      data: { success: true },
      meta: { timestamp: new Date().toISOString(), version: 'v1' },
    };
  }

  @Post(':groupId/positions')
  async createPosition(@Param('groupId') groupId: string, @Body() dto: CreateOpenPositionDto) {
    try {
      const position = await this.createOpenPositionForGroup.execute({
        groupProfileId: groupId,
        instrumentRecherche: dto.instrument,
        niveauAttendu: dto.niveau as 'debutant' | 'intermediaire' | 'avance' | 'expert',
      });

      await this.recalculateMatchesForNewPosition.execute(position);

      return {
        data: position,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      };
    } catch (error) {
      if (error instanceof GroupNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}