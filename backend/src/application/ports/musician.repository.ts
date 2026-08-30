import type { MusicianCandidate } from '../../domain/entities/musician.entity.js';

// Port (interface) — l'Application ne connaît que ce contrat, jamais Prisma
// directement. L'implémentation concrète vit dans infrastructure/.
export interface MusicianRepository {
  findById(id: string): Promise<MusicianCandidate | null>;
}