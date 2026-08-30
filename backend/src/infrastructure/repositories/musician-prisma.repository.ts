import type { MusicianRepository } from '../../application/ports/musician.repository.js';
import type { MusicianCandidate } from '../../domain/entities/musician.entity.js';
import { prisma } from '../prisma.client.js';
import { toMusicianCandidate } from '../mappers/musician.mapper.js';

// Adapter concret — implémente le port défini côté Application.
// C'est la seule couche du projet qui importe Prisma directement.
export class MusicianPrismaRepository implements MusicianRepository {
  async findById(id: string): Promise<MusicianCandidate | null> {
    const record = await prisma.musicianProfile.findUnique({
      where: { id },
      include: {
        instruments: true,
        styles: true,
        availabilities: true,
        zone: true,
      },
    });

    if (!record) {
      return null;
    }

    return toMusicianCandidate(record);
  }
}