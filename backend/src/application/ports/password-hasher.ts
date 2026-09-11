export interface PasswordHasher {
  hash(plainPassword: string): Promise<string>;

  // Nécessaire pour l'authentification — compare un mot de passe en clair
  // à un hash déjà stocké, sans jamais avoir à re-hasher pour comparer.
  compare(plainPassword: string, hash: string): Promise<boolean>;
}