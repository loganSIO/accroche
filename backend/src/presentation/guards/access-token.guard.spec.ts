import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from 'vitest';
import { AccessTokenGuard } from './access-token.guard.js';

function contextWithAuthorization(authorization?: string): ExecutionContext {
  const request = { headers: authorization ? { authorization } : {} };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
}

describe('AccessTokenGuard', () => {
  it('rejette une requête sans bearer token', async () => {
    const guard = new AccessTokenGuard(new JwtService({ secret: 'test-secret' }));

    await expect(guard.canActivate(contextWithAuthorization())).rejects.toThrow(UnauthorizedException);
  });

  it('extrait l’identité d’un token valide', async () => {
    const jwt = new JwtService({ secret: 'test-secret' });
    const guard = new AccessTokenGuard(jwt);
    const request = { headers: {}, user: undefined as { userId: string } | undefined };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
    const token = await jwt.signAsync({ sub: 'user-1' });
    request.headers = { authorization: `Bearer ${token}` };

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ userId: 'user-1' });
  });
});
