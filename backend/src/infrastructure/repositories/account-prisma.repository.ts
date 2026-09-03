import { prisma } from '../prisma.client.js';
import type { RegisterAccountInput } from '../../application/ports/account.repository.js';
import type { PasswordHasher } from '../../application/ports/password-hasher.js';

// TODO: ce repository est appelé directement par le controller, sans passer
// par un use case dédié (contrairement au pattern Port/Use case/Repository
// suivi ailleurs dans le projet — cf. musicien/groupe). À corriger dans une
// PR séparée : extraire un use case RegisterAccount qui orchestre le
// hashage et l'appel au repository, comme CreateMusicianProfile /
// CreateGroupProfile le font déjà.
export class AccountPrismaRepository {
  constructor(private readonly passwordHasher: PasswordHasher) {}

  async register(input: RegisterAccountInput) {
    const hashedPassword = await this.passwordHasher.hash(input.password);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: input.email, password: hashedPassword, city: input.zone.ville },
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