export interface StoredRefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface RefreshTokenRepository {
  create(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<StoredRefreshToken>;
  findByHash(tokenHash: string): Promise<StoredRefreshToken | null>;
  revoke(id: string): Promise<void>;
}
