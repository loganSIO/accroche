import type { UserRepository, AuthenticatedUser } from '../../application/ports/user.repository.js';
import { prisma } from '../prisma.client.js';

export class UserPrismaRepository implements UserRepository {
  async findByEmail(email: string): Promise<AuthenticatedUser | null> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return null;
    }

    return { id: user.id, email: user.email, passwordHash: user.password };
  }

  async findById(id: string): Promise<Omit<AuthenticatedUser, 'passwordHash'> | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? { id: user.id, email: user.email } : null;
  }
}