import type { GroupRepository, CreateGroupInput, GroupCandidate } from '../../application/ports/group.repository.js';
import { prisma } from '../prisma.client.js';
import { toGroupCandidate } from '../mappers/group.mapper.js';

export class GroupPrismaRepository implements GroupRepository {
  async findByUserId(userId: string): Promise<GroupCandidate[]> {
    const records = await prisma.groupProfile.findMany({
      where: { userId },
      include: { zone: true, positions: { select: { instrumentRecherche: true, niveauAttendu: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return records.map(toGroupCandidate);
  }

  async createForUser(userId: string, input: Omit<CreateGroupInput, 'email' | 'password' | 'city'>): Promise<GroupCandidate> {
    const record = await prisma.$transaction(async (tx) => {
      const zone = await tx.zone.create({ data: input.zone });
      return tx.groupProfile.create({
        data: {
          userId,
          zoneId: zone.id,
          name: input.name,
          styles: input.styles,
          status: input.status.toUpperCase() as 'ASSOCIATION' | 'PROFESSIONNEL',
          description: input.description,
          audioLinks: input.audioLinks,
          positions: {
            create: input.requestedInstruments.map((position) => ({
              ownerType: 'GROUP' as const,
              instrumentRecherche: position.instrument,
              niveauAttendu: position.niveau,
            })),
          },
        },
        include: { zone: true, positions: { select: { instrumentRecherche: true, niveauAttendu: true } } },
      });
    });
    return toGroupCandidate(record);
  }

  async updateForUser(
    groupId: string,
    userId: string,
    input: Partial<Omit<CreateGroupInput, 'email' | 'password' | 'city'>>,
  ): Promise<GroupCandidate | null> {
    const existing = await prisma.groupProfile.findFirst({ where: { id: groupId, userId } });
    if (!existing) return null;

    const record = await prisma.$transaction(async (tx) => {
      if (input.zone) {
        await tx.zone.update({ where: { id: existing.zoneId }, data: input.zone });
      }
      return tx.groupProfile.update({
        where: { id: groupId },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.styles !== undefined ? { styles: input.styles } : {}),
          ...(input.status !== undefined ? { status: input.status.toUpperCase() as 'ASSOCIATION' | 'PROFESSIONNEL' } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.audioLinks !== undefined ? { audioLinks: input.audioLinks } : {}),
        },
        include: { zone: true, positions: { select: { instrumentRecherche: true, niveauAttendu: true } } },
      });
    });
    return toGroupCandidate(record);
  }

  async deleteForUser(groupId: string, userId: string): Promise<boolean> {
    const result = await prisma.groupProfile.deleteMany({ where: { id: groupId, userId } });
    return result.count === 1;
  }

  async findById(id: string): Promise<GroupCandidate | null> {
    const record = await prisma.groupProfile.findUnique({
      where: { id },
      include: { zone: true, positions: { select: { instrumentRecherche: true, niveauAttendu: true } } },
    });

    return record ? toGroupCandidate(record) : null;
  }

  async belongsToUser(id: string, userId: string): Promise<boolean> {
    const group = await prisma.groupProfile.findFirst({ where: { id, userId }, select: { id: true } });
    return group !== null;
  }

  async create(input: CreateGroupInput): Promise<GroupCandidate> {
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

      return tx.groupProfile.create({
        data: {
          userId: user.id,
          zoneId: zone.id,
          name: input.name,
          styles: input.styles,
          status: input.status.toUpperCase() as 'ASSOCIATION' | 'PROFESSIONNEL',
          description: input.description,
          audioLinks: input.audioLinks,
        },
        include: { zone: true, positions: { select: { instrumentRecherche: true, niveauAttendu: true } } },
      });
    });

    return toGroupCandidate(record);
  }
}