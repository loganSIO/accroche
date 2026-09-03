import { Body, Controller, Post } from '@nestjs/common';
import { CreateMusicianProfile } from '../../application/use-cases/create-musician-profile.js';
import { MusicianPrismaRepository } from '../../infrastructure/repositories/musician-prisma.repository.js';
import { CreateMusicianDto } from '../dtos/create-musician.dto.js';
import { BcryptPasswordHasher } from '../../infrastructure/security/bcrypt-password-hasher.js';

@Controller('api/v1/musicians')
export class CreateMusicianController {
  private readonly createMusicianProfile = new CreateMusicianProfile(new MusicianPrismaRepository(), new BcryptPasswordHasher());

  @Post()
  async create(@Body() dto: CreateMusicianDto) {
    const musician = await this.createMusicianProfile.execute({
      email: dto.email,
      password: dto.password,
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