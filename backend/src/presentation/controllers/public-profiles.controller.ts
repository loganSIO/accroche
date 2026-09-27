import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PublicProfilePrismaRepository } from '../../infrastructure/repositories/public-profile-prisma.repository.js';

@Controller('api/v1/profiles')
export class PublicProfilesController {
  private readonly profiles = new PublicProfilePrismaRepository();

  @Get('public')
  async list() {
    return this.response(await this.profiles.findAll());
  }

  @Get('public/musicians/:id')
  async getMusician(@Param('id') id: string) {
    const musician = await this.profiles.findMusicianById(id);
    if (!musician) throw new NotFoundException(`Musicien ${id} introuvable.`);
    return this.response(musician);
  }

  @Get('public/groups/:id')
  async getGroup(@Param('id') id: string) {
    const group = await this.profiles.findGroupById(id);
    if (!group) throw new NotFoundException(`Groupe ${id} introuvable.`);
    return this.response(group);
  }

  private response<T>(data: T) {
    return { data, meta: { timestamp: new Date().toISOString(), version: 'v1' } };
  }
}
