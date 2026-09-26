import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: { userId: string };
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token d’accès manquant.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub?: string }>(
        authorization.slice('Bearer '.length),
      );
      if (!payload.sub) {
        throw new UnauthorizedException('Token d’accès invalide.');
      }
      request.user = { userId: payload.sub };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token d’accès invalide.');
    }
  }
}
