import { Body, Controller, Post } from '@nestjs/common';
import { CreateGroupProfile } from '../../application/use-cases/create-group-profile.js';
import { GroupPrismaRepository } from '../../infrastructure/repositories/group-prisma.repository.js';
import { CreateGroupDto } from '../dtos/create-group.dto.js';

@Controller('api/v1/groups')
export class CreateGroupController {
  private readonly createGroupProfile = new CreateGroupProfile(new GroupPrismaRepository());

  @Post()
  async create(@Body() dto: CreateGroupDto) {
    const group = await this.createGroupProfile.execute({
      email: dto.email,
      password: dto.password, // hashage à ajouter avant mise en prod, cf. musicien
      city: dto.zone.ville,
      name: dto.name,
      styles: dto.styles,
      status: dto.status as 'association' | 'professionnel',
      description: dto.description,
      audioLinks: dto.audioLinks,
      zone: dto.zone,
    });

    return {
      data: group,
      meta: { timestamp: new Date().toISOString(), version: 'v1' },
    };
  }
}