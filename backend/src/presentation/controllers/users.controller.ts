import { Controller, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { UserPrismaRepository } from '../../infrastructure/repositories/user-prisma.repository.js';
import { AccessTokenGuard, type AuthenticatedRequest } from '../guards/access-token.guard.js';

@Controller('api/v1/users')
export class UsersController {
  private readonly users = new UserPrismaRepository();

  @Get('me')
  @UseGuards(AccessTokenGuard)
  async me(@Req() request: AuthenticatedRequest) {
    const user = await this.users.findById(request.user.userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }
    return { data: user, meta: { timestamp: new Date().toISOString(), version: 'v1' } };
  }
}
