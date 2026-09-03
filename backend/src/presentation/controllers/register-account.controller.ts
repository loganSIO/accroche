import { Body, Controller, Post } from '@nestjs/common';
import { AccountPrismaRepository } from '../../infrastructure/repositories/account-prisma.repository.js';
import { BcryptPasswordHasher } from '../../infrastructure/security/bcrypt-password-hasher.js';
import type { RegisterAccountInput } from '../../application/ports/account.repository.js';
import { RegisterAccountDto } from '../dtos/register-account.dto.js';

@Controller('api/v1/accounts')
export class RegisterAccountController {
  private readonly repository = new AccountPrismaRepository(new BcryptPasswordHasher());

  @Post()
  async register(@Body() dto: RegisterAccountDto) {
    const result = await this.repository.register(dto as RegisterAccountInput);
    return { data: result, meta: { timestamp: new Date().toISOString(), version: 'v1' } };
  }
}