import type { UserRepository } from '../ports/user.repository.js';
import type { PasswordHasher } from '../ports/password-hasher.js';

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Email ou mot de passe incorrect.');
    this.name = 'InvalidCredentialsError';
  }
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  userId: string;
}

// Orchestration pure : vérifie les identifiants, ne génère aucun token —
// la génération du JWT est un détail de présentation/infrastructure
// (signature, expiration), pas une règle métier. Le controller s'en charge
// via le module @nestjs/jwt une fois l'identité validée ici.
export class Login {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isValid = await this.passwordHasher.compare(input.password, user.passwordHash);

    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    return { userId: user.id };
  }
}