import { prisma } from '../prisma.client.js';
import type {
  RefreshTokenRepository,
  StoredRefreshToken,
} from '../../application/ports/refresh-token.repository.js';

export class RefreshTokenPrismaRepository implements RefreshTokenRepository {
  async create(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<StoredRefreshToken> {
    return prisma.refreshToken.create({ data: input });
  }

  async findByHash(tokenHash: string): Promise<StoredRefreshToken | null> {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async revoke(id: string): Promise<void> {
    await prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  }
}
