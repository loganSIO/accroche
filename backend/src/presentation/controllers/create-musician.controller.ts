import { Body, Controller, Post } from '@nestjs/common';
import { CreateMusicianProfile } from '../../application/use-cases/create-musician-profile.js';
import { MusicianPrismaRepository } from '../../infrastructure/repositories/musician-prisma.repository.js';
import { CreateMusicianDto } from '../dtos/create-musician.dto.js';

@Controller('api/v1/musicians')
export class CreateMusicianController {
  private readonly createMusicianProfile = new CreateMusicianProfile(new MusicianPrismaRepository());

  @Post()
  async create(@Body() dto: CreateMusicianDto) {
    const musician = await this.createMusicianProfile.execute({
      email: dto.email,
      password: dto.password, // Note: hashage du mot de passe à ajouter avant la vraie mise en prod
      city: dto.zone.ville,
      status: dto.status as 'amateur' | 'pro',
      bio: dto.bio,
      instruments: dto.instruments,
      styles: dto.styles,
      availabilities: dto.availabilities,
      zone: dto.zone,
    });

    return {
      data: musician,
      meta: { timestamp: new Date().toISOString(), version: 'v1' },
    };
  }
}