import type {
  PublicGroupProfile,
  PublicMusicianProfile,
  PublicProfileRepository,
} from '../../application/ports/public-profile.repository.js';
import { prisma } from '../prisma.client.js';

const musicianRelations = {
  instruments: true,
  styles: true,
  showcaseGroups: true,
  zone: true,
} as const;

const groupRelations = {
  zone: true,
  positions: {
    where: { statut: 'OUVERT' as const },
    select: { instrumentRecherche: true, niveauAttendu: true },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

export class PublicProfilePrismaRepository implements PublicProfileRepository {
  async findAll() {
    const [musicians, groups] = await Promise.all([
      prisma.musicianProfile.findMany({ include: musicianRelations, orderBy: { createdAt: 'asc' } }),
      prisma.groupProfile.findMany({ include: groupRelations, orderBy: { createdAt: 'asc' } }),
    ]);

    return {
      musicians: musicians.map(toPublicMusician),
      groups: groups.map(toPublicGroup),
    };
  }

  async findMusicianById(id: string) {
    const record = await prisma.musicianProfile.findUnique({
      where: { id },
      include: musicianRelations,
    });
    return record ? toPublicMusician(record) : null;
  }

  async findGroupById(id: string) {
    const record = await prisma.groupProfile.findUnique({
      where: { id },
      include: groupRelations,
    });
    return record ? toPublicGroup(record) : null;
  }
}

function toPublicMusician(record: {
  id: string;
  createdAt: Date;
  musicianName: string;
  status: 'AMATEUR' | 'PRO';
  bio: string | null;
  instruments: { instrument: string; niveau: string }[];
  styles: { style: string }[];
  showcaseGroups: {
    name: string;
    city: string;
    position: string;
    status: 'ASSOCIATION' | 'PROFESSIONNEL';
    description: string;
  }[];
  zone: { ville: string };
}): PublicMusicianProfile {
  return {
    id: record.id,
    type: 'musician',
    createdAt: record.createdAt.toISOString(),
    musicianName: record.musicianName,
    status: record.status.toLowerCase() as PublicMusicianProfile['status'],
    instruments: record.instruments.map(({ instrument, niveau }) => ({ instrument, niveau })),
    styles: record.styles.map(({ style }) => style),
    bio: record.bio ?? undefined,
    city: record.zone.ville,
    showcaseGroups: record.showcaseGroups.map((group) => ({
      ...group,
      status: group.status.toLowerCase() as 'association' | 'professionnel',
    })),
  };
}

function toPublicGroup(record: {
  id: string;
  createdAt: Date;
  name: string;
  styles: string[];
  status: 'ASSOCIATION' | 'PROFESSIONNEL';
  description: string | null;
  audioLinks: string[];
  zone: { ville: string };
  positions: { instrumentRecherche: string; niveauAttendu: string }[];
}): PublicGroupProfile {
  return {
    id: record.id,
    type: 'group',
    createdAt: record.createdAt.toISOString(),
    name: record.name,
    styles: record.styles,
    status: record.status.toLowerCase() as PublicGroupProfile['status'],
    description: record.description ?? undefined,
    audioLinks: record.audioLinks,
    city: record.zone.ville,
    requestedInstruments: record.positions.map((position) => ({
      instrument: position.instrumentRecherche,
      niveau: position.niveauAttendu,
    })),
  };
}
