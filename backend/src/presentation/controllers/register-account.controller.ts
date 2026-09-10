import { Body, Controller, Post } from '@nestjs/common';
import { AccountPrismaRepository } from '../../infrastructure/repositories/account-prisma.repository.js';
import { BcryptPasswordHasher } from '../../infrastructure/security/bcrypt-password-hasher.js';
import { MusicianPrismaRepository } from '../../infrastructure/repositories/musician-prisma.repository.js';
import { OpenPositionPrismaRepository } from '../../infrastructure/repositories/open-position-prisma.repository.js';
import { MatchPrismaRepository } from '../../infrastructure/repositories/match-prisma.repository.js';
import { RecalculateMatchesForMusician } from '../../application/use-cases/recalculate-matches-for-musician.js';
import type { RegisterAccountInput } from '../../application/ports/account.repository.js';
import { RegisterAccountDto } from '../dtos/register-account.dto.js';

@Controller('api/v1/accounts')
export class RegisterAccountController {
  private readonly repository = new AccountPrismaRepository(new BcryptPasswordHasher());
  private readonly recalculateMatchesForMusician = new RecalculateMatchesForMusician(
    new MusicianPrismaRepository(),
    new OpenPositionPrismaRepository(),
    new MatchPrismaRepository(),
  );

  @Post()
  async register(@Body() dto: RegisterAccountDto) {
    const result = await this.repository.register(dto as RegisterAccountInput);

    if (result.musicianProfileId) {
      await this.recalculateMatchesForMusician.execute(result.musicianProfileId);
    }

    return { data: result, meta: { timestamp: new Date().toISOString(), version: 'v1' } };
  }
}