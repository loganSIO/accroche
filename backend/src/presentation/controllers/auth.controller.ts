import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Login, InvalidCredentialsError } from '../../application/use-cases/login.js';
import { UserPrismaRepository } from '../../infrastructure/repositories/user-prisma.repository.js';
import { BcryptPasswordHasher } from '../../infrastructure/security/bcrypt-password-hasher.js';
import { LoginDto } from '../dtos/login.dto.js';

@Controller('api/v1/auth')
export class AuthController {
  private readonly login = new Login(new UserPrismaRepository(), new BcryptPasswordHasher());

  constructor(private readonly jwtService: JwtService) {}

  @Post('login')
  async loginHandler(@Body() dto: LoginDto) {
    try {
      const result = await this.login.execute(dto);
      const accessToken = await this.jwtService.signAsync({ sub: result.userId });

      return {
        data: { accessToken, userId: result.userId },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      };
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }
}