import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { GroupPrismaRepository } from '../../infrastructure/repositories/group-prisma.repository.js';
import { OpenPositionPrismaRepository } from '../../infrastructure/repositories/open-position-prisma.repository.js';
import { CreateOpenPositionForGroup, GroupNotFoundError } from '../../application/use-cases/open-position-for-group.js';
import { CreateOpenPositionDto } from '../dtos/create-open-position.dto.js';

// Couche Présentation : lecture simple, aucune règle métier à orchestrer,
// donc appel direct au repository — même convention que MusiciansController.
@Controller('api/v1/groups')
export class GroupsController {
  private readonly groupRepository = new GroupPrismaRepository();
  private readonly createOpenPositionForGroup = new CreateOpenPositionForGroup(
    new OpenPositionPrismaRepository(),
    new GroupPrismaRepository(),
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

  @Post(':groupId/positions')
  async createPosition(@Param('groupId') groupId: string, @Body() dto: CreateOpenPositionDto) {
    try {
      const position = await this.createOpenPositionForGroup.execute({
        groupProfileId: groupId,
        instrumentRecherche: dto.instrument,
        niveauAttendu: dto.niveau as 'debutant' | 'intermediaire' | 'avance' | 'expert',
      });
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