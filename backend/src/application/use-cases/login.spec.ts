import { describe, expect, it, vi } from 'vitest';
import { Login, InvalidCredentialsError } from './login.js';
import type { UserRepository, AuthenticatedUser } from '../ports/user.repository.js';
import type { PasswordHasher } from '../ports/password-hasher.js';

describe('Login', () => {
  it('retourne le userId si les identifiants sont valides', async () => {
    const user: AuthenticatedUser = { id: 'user-1', email: 'test@example.com', passwordHash: 'hash-stocke' };
    const userRepository: UserRepository = { findByEmail: vi.fn().mockResolvedValue(user) };
    const passwordHasher: PasswordHasher = {
      hash: vi.fn(),
      compare: vi.fn().mockResolvedValue(true),
    };

    const login = new Login(userRepository, passwordHasher);
    const result = await login.execute({ email: 'test@example.com', password: 'motdepasse123' });

    expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(passwordHasher.compare).toHaveBeenCalledWith('motdepasse123', 'hash-stocke');
    expect(result).toEqual({ userId: 'user-1' });
  });

  it("lève InvalidCredentialsError si l'email n'existe pas", async () => {
    const userRepository: UserRepository = { findByEmail: vi.fn().mockResolvedValue(null) };
    const passwordHasher: PasswordHasher = { hash: vi.fn(), compare: vi.fn() };

    const login = new Login(userRepository, passwordHasher);

    await expect(login.execute({ email: 'inconnu@example.com', password: 'x' })).rejects.toThrow(InvalidCredentialsError);
    expect(passwordHasher.compare).not.toHaveBeenCalled();
  });

  it('lève InvalidCredentialsError si le mot de passe est incorrect', async () => {
    const user: AuthenticatedUser = { id: 'user-1', email: 'test@example.com', passwordHash: 'hash-stocke' };
    const userRepository: UserRepository = { findByEmail: vi.fn().mockResolvedValue(user) };
    const passwordHasher: PasswordHasher = { hash: vi.fn(), compare: vi.fn().mockResolvedValue(false) };

    const login = new Login(userRepository, passwordHasher);

    await expect(login.execute({ email: 'test@example.com', password: 'mauvais' })).rejects.toThrow(InvalidCredentialsError);
  });

  it('lève le même message pour email inconnu et mot de passe incorrect (anti-énumération)', async () => {
    const userRepository: UserRepository = { findByEmail: vi.fn().mockResolvedValue(null) };
    const passwordHasher: PasswordHasher = { hash: vi.fn(), compare: vi.fn() };
    const login = new Login(userRepository, passwordHasher);

    let messageEmailInconnu = '';
    try {
      await login.execute({ email: 'inconnu@example.com', password: 'x' });
    } catch (error) {
      messageEmailInconnu = (error as Error).message;
    }

    expect(messageEmailInconnu).toBe('Email ou mot de passe incorrect.');
  });
});