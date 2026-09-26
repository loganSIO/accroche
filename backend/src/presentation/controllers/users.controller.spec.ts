import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../infrastructure/prisma.client.js';
import { UsersController } from './users.controller.js';

async function cleanDatabase() {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    await cleanDatabase();
    controller = new UsersController();
  });

  afterEach(cleanDatabase);

  it('retourne les informations publiques de l’utilisateur connecté', async () => {
    const user = await prisma.user.create({
      data: { email: 'me@example.com', password: 'hash', city: 'Strasbourg' },
    });

    const result = await controller.me({ user: { userId: user.id } } as never);

    expect(result.data).toEqual({ id: user.id, email: user.email });
    expect(result.data).not.toHaveProperty('password');
  });

  it('refuse un utilisateur supprimé', async () => {
    await expect(controller.me({ user: { userId: 'missing' } } as never)).rejects.toThrow(
      'Utilisateur introuvable.',
    );
  });
});
