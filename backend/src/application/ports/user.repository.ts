export interface AuthenticatedUser {
  id: string;
  email: string;
  passwordHash: string;
}

export interface UserRepository {
  // Nécessaire pour l'authentification — recherche par email, avec le hash
  // du mot de passe inclus (jamais exposé au-delà de la couche application
  // qui fait la comparaison).
  findByEmail(email: string): Promise<AuthenticatedUser | null>;
  findById(id: string): Promise<Omit<AuthenticatedUser, 'passwordHash'> | null>;
}