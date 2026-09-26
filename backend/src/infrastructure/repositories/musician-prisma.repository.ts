import type {
  MusicianRepository,
  CreateMusicianInput,
} from '../../application/ports/musician.repository.js';
import type { MusicianCandidate, Zone } from '../../domain/entities/musician.entity.js';
import { prisma } from '../prisma.client.js';
import { toMusicianCandidate } from '../mappers/musician.mapper.js';
import { distanceKm } from '../geo/distance.js';

export class MusicianPrismaRepository implements MusicianRepository {
  private readonly includeRelations = {
    instruments: true,
    styles: true,
    availabilities: true,
    zone: true,
  } as const;

  async findByUserId(userId: string): Promise<MusicianCandidate | null> {
    const record = await prisma.musicianProfile.findUnique({
      where: { userId },
      include: this.includeRelations,
    });
    return record ? toMusicianCandidate(record) : null;
  }

  async createForUser(userId: string, input: Omit<CreateMusicianInput, 'email' | 'password' | 'city'>): Promise<MusicianCandidate> {
    const record = await prisma.$transaction(async (tx) => {
      const zone = await tx.zone.create({ data: input.zone });
      return tx.musicianProfile.create({
        data: {
          userId,
          zoneId: zone.id,
          musicianName: input.musicianName ?? '',
          status: input.status.toUpperCase() as 'AMATEUR' | 'PRO',
          objective: input.objective ?? [],
          bio: input.bio,
          instruments: { create: input.instruments },
          styles: { create: input.styles.map((style) => ({ style })) },
          availabilities: { create: input.availabilities },
        },
        include: this.includeRelations,
      });
    });
    return toMusicianCandidate(record);
  }

  async updateForUser(userId: string, input: Partial<Omit<CreateMusicianInput, 'email' | 'password' | 'city'>>): Promise<MusicianCandidate | null> {
    const existing = await prisma.musicianProfile.findUnique({ where: { userId } });
    if (!existing) return null;

    const record = await prisma.$transaction(async (tx) => {
      let zoneId = existing.zoneId;
      if (input.zone) {
        const zone = await tx.zone.update({ where: { id: existing.zoneId }, data: input.zone });
        zoneId = zone.id;
      }
      if (input.instruments !== undefined) {
        await tx.musicianInstrument.deleteMany({ where: { musicianProfileId: existing.id } });
      }
      if (input.styles !== undefined) {
        await tx.musicianStyle.deleteMany({ where: { musicianProfileId: existing.id } });
      }
      if (input.availabilities !== undefined) {
        await tx.availability.deleteMany({ where: { musicianProfileId: existing.id } });
      }
      return tx.musicianProfile.update({
        where: { id: existing.id },
        data: {
          ...(input.musicianName !== undefined ? { musicianName: input.musicianName } : {}),
          ...(input.status ? { status: input.status.toUpperCase() as 'AMATEUR' | 'PRO' } : {}),
          ...(input.objective !== undefined ? { objective: input.objective } : {}),
          ...(input.bio !== undefined ? { bio: input.bio } : {}),
          ...(input.zone ? { zoneId } : {}),
          ...(input.instruments !== undefined ? { instruments: { create: input.instruments } } : {}),
          ...(input.styles !== undefined ? { styles: { create: input.styles.map((style) => ({ style })) } } : {}),
          ...(input.availabilities !== undefined ? { availabilities: { create: input.availabilities } } : {}),
        },
        include: this.includeRelations,
      });
    });
    return toMusicianCandidate(record);
  }

  async findById(id: string): Promise<MusicianCandidate | null> {
    const record = await prisma.musicianProfile.findUnique({
      where: { id },
      include: {
        ...this.includeRelations,
      },
    });

    if (!record) {
      return null;
    }

    return toMusicianCandidate(record);
  }

  async findNearZone(zone: Zone): Promise<MusicianCandidate[]> {
    const records = await prisma.musicianProfile.findMany({
      include: {
        instruments: true,
        styles: true,
        availabilities: true,
        zone: true,
      },
    });

    return records
      .map(toMusicianCandidate)
      .filter((musician) => distanceKm(zone, musician.zone) <= zone.rayonKm);
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
          musicianName: input.musicianName ?? '',
          status: input.status.toUpperCase() as 'AMATEUR' | 'PRO',
          objective: input.objective ?? [],
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