import { prisma } from '../prisma.client.js';
import type { RegisterAccountInput } from '../../application/ports/account.repository.js';

export class AccountPrismaRepository {
  async register(input: RegisterAccountInput) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: input.email, password: input.password, city: input.zone.ville },
      });
      const musicianZone = input.musician ? await tx.zone.create({ data: input.zone }) : null;
      const musician = input.musician
        ? await tx.musicianProfile.create({
          data: {
            userId: user.id,
            zoneId: musicianZone!.id,
            status: input.musician.status.toUpperCase() as 'AMATEUR' | 'PRO',
            objective: input.musician.objective,
            bio: input.musician.bio,
            instruments: { create: input.musician.instruments },
            styles: { create: input.musician.styles.map((style) => ({ style })) },
            availabilities: { create: input.musician.availabilities },
          },
        })
        : null;
      const groups = [];
      for (const group of input.groups) {
        const zone = await tx.zone.create({ data: input.zone });
        const created = await tx.groupProfile.create({
          data: {
            userId: user.id,
            zoneId: zone.id,
            name: group.name,
            styles: group.styles,
            status: group.status.toUpperCase() as 'ASSOCIATION' | 'PROFESSIONNEL',
            description: group.description,
            audioLinks: group.audioLinks,
            positions: { create: group.requestedInstruments.map((position) => ({
              ownerType: 'GROUP',
              instrumentRecherche: position.instrument,
              niveauAttendu: position.niveau,
            })) },
          },
        });
        groups.push(created);
      }
      return { userId: user.id, musicianProfileId: musician?.id ?? null, groupIds: groups.map((group) => group.id) };
    });
  }
}
