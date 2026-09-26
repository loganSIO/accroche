import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { Login, InvalidCredentialsError } from '../../application/use-cases/login.js';
import { UserPrismaRepository } from '../../infrastructure/repositories/user-prisma.repository.js';
import { RefreshTokenPrismaRepository } from '../../infrastructure/repositories/refresh-token-prisma.repository.js';
import { BcryptPasswordHasher } from '../../infrastructure/security/bcrypt-password-hasher.js';
import { LoginDto } from '../dtos/login.dto.js';
import { RefreshTokenDto } from '../dtos/refresh-token.dto.js';

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Controller('api/v1/auth')
export class AuthController {
  private readonly login = new Login(new UserPrismaRepository(), new BcryptPasswordHasher());
  private readonly users = new UserPrismaRepository();
  private readonly refreshTokens = new RefreshTokenPrismaRepository();

  constructor(private readonly jwtService: JwtService) {}

  @Post('login')
  async loginHandler(@Body() dto: LoginDto) {
    try {
      const result = await this.login.execute(dto);
      return this.createSession(result.userId);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }

  @Post('refresh')
  async refreshHandler(@Body() dto: RefreshTokenDto) {
    const stored = await this.refreshTokens.findByHash(hashRefreshToken(dto.refreshToken));
    if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token invalide ou expiré.');
    }

    const user = await this.users.findById(stored.userId);
    if (!user) {
      throw new UnauthorizedException('Refresh token invalide ou expiré.');
    }

    await this.refreshTokens.revoke(stored.id);
    return this.createSession(user.id);
  }

  @Post('logout')
  async logoutHandler(@Body() dto: RefreshTokenDto) {
    const stored = await this.refreshTokens.findByHash(hashRefreshToken(dto.refreshToken));
    if (!stored || stored.revokedAt) {
      throw new UnauthorizedException('Refresh token invalide.');
    }

    await this.refreshTokens.revoke(stored.id);
    return { data: { success: true }, meta: { timestamp: new Date().toISOString(), version: 'v1' } };
  }

  private async createSession(userId: string) {
    const refreshToken = randomBytes(32).toString('base64url');
    await this.refreshTokens.create({
      userId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });
    const accessToken = await this.jwtService.signAsync({ sub: userId });

    return {
      data: { accessToken, refreshToken, userId },
      meta: { timestamp: new Date().toISOString(), version: 'v1' },
    };
  }
}
