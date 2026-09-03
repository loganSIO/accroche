import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { GroupPrismaRepository } from '../../infrastructure/repositories/group-prisma.repository.js';

// Couche Présentation : lecture simple, aucune règle métier à orchestrer,
// donc appel direct au repository — même convention que MusiciansController.
@Controller('api/v1/groups')
export class GroupsController {
  private readonly groupRepository = new GroupPrismaRepository();

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
}