import {
  ConflictException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MusicianPrismaRepository } from '../../infrastructure/repositories/musician-prisma.repository.js';
import { OpenPositionPrismaRepository } from '../../infrastructure/repositories/open-position-prisma.repository.js';
import { MatchPrismaRepository } from '../../infrastructure/repositories/match-prisma.repository.js';
import { RecalculateMatchesForMusician } from '../../application/use-cases/recalculate-matches-for-musician.js';
import { AccessTokenGuard, type AuthenticatedRequest } from '../guards/access-token.guard.js';
import {
  CreateMusicianProfileDto,
  UpdateMusicianProfileDto,
} from '../dtos/musician-profile.dto.js';

@Controller('api/v1/users/me/musician-profile')
@UseGuards(AccessTokenGuard)
export class MusicianProfileController {
  private readonly musicians = new MusicianPrismaRepository();
  private readonly recalculateMatches = new RecalculateMatchesForMusician(
    this.musicians,
    new OpenPositionPrismaRepository(),
    new MatchPrismaRepository(),
  );

  @Get()
  async get(@Req() request: AuthenticatedRequest) {
    const profile = await this.musicians.findByUserId(request.user.userId);
    if (!profile) {
      throw new NotFoundException('Profil musicien introuvable.');
    }
    return this.response(profile);
  }

  @Post()
  async create(@Req() request: AuthenticatedRequest, @Body() dto: CreateMusicianProfileDto) {
    if (await this.musicians.findByUserId(request.user.userId)) {
      throw new ConflictException('Un profil musicien existe déjà pour cet utilisateur.');
    }
    const profile = await this.musicians.createForUser(request.user.userId, dto);
    await this.recalculateMatches.execute(profile.id);
    return this.response(profile);
  }

  @Patch()
  async update(@Req() request: AuthenticatedRequest, @Body() dto: UpdateMusicianProfileDto) {
    const profile = await this.musicians.updateForUser(request.user.userId, dto);
    if (!profile) {
      throw new NotFoundException('Profil musicien introuvable.');
    }
    await this.recalculateMatches.execute(profile.id);
    return this.response(profile);
  }

  private response(profile: Awaited<ReturnType<MusicianPrismaRepository['findById']>>) {
    return {
      data: profile,
      meta: { timestamp: new Date().toISOString(), version: 'v1' },
    };
  }
}
