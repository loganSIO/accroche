import { request } from './client';
import type { GroupStatus, MemberStatus, PositionLevel } from './users';

export interface PublicMusicianProfile {
  id: string;
  type: 'musician';
  createdAt: string;
  musicianName: string;
  status: MemberStatus;
  instruments: { instrument: string; niveau: PositionLevel }[];
  styles: string[];
  bio?: string;
  city: string;
  showcaseGroups: {
    name: string;
    city: string;
    position: string;
    status: GroupStatus;
    description: string;
  }[];
}

export interface PublicGroupProfile {
  id: string;
  type: 'group';
  createdAt: string;
  name: string;
  styles: string[];
  status: GroupStatus;
  description?: string;
  audioLinks: string[];
  city: string;
  requestedInstruments: { instrument: string; niveau: PositionLevel }[];
}

export interface PublicProfiles {
  musicians: PublicMusicianProfile[];
  groups: PublicGroupProfile[];
}

export const listPublicProfiles = () => request<PublicProfiles>('/profiles/public');
