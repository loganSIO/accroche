import type {
  MusicianRepository,
  CreateMusicianInput,
} from '../../application/ports/musician.repository.js';
import type { MusicianCandidate } from '../../domain/entities/musician.entity.js';
import { prisma } from '../prisma.client.js';
import { toMusicianCandidate } from '../mappers/musician.mapper.js';

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

  async create(input: CreateMusicianInput): Promise<MusicianCandidate> {
    // Transaction : User, Zone et MusicianProfile (+ relations) doivent
    // exister ensemble ou pas du tout — évite un User orphelin sans profil
    // si une étape échoue en cours de route.
    const record = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: input.email, password: input.password, city: input.city },
      });

      const zone = await tx.zone.create({
        data: {
          latitude: input.zone.latitude,
          longitude: input.zone.longitude,
          rayonKm: input.zone.rayonKm,
          ville: input.zone.ville,
        },
      });

      return tx.musicianProfile.create({
        data: {
          userId: user.id,
          zoneId: zone.id,
          status: input.status.toUpperCase() as 'AMATEUR' | 'PRO',
          objective: [],
          bio: input.bio,
          instruments: { create: input.instruments },
          styles: { create: input.styles.map((style) => ({ style })) },
          availabilities: { create: input.availabilities },
        },
        include: {
          instruments: true,
          styles: true,
          availabilities: true,
          zone: true,
        },
      });
    });

    return toMusicianCandidate(record);
  }
}