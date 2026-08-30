import type { GroupRepository, CreateGroupInput, GroupCandidate } from '../../application/ports/group.repository.js';
import { prisma } from '../prisma.client.js';
import { toGroupCandidate } from '../mappers/group.mapper.js';

export class GroupPrismaRepository implements GroupRepository {
  async findById(id: string): Promise<GroupCandidate | null> {
    const record = await prisma.groupProfile.findUnique({
      where: { id },
      include: { zone: true },
    });

    return record ? toGroupCandidate(record) : null;
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
        include: { zone: true },
      });
    });

    return toGroupCandidate(record);
  }
}