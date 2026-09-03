import bcrypt from 'bcrypt';
import type { PasswordHasher } from '../../application/ports/password-hasher.js';

const SALT_ROUNDS = 10;

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
  }
}