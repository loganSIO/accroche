export interface PublicMusicianProfile {
  id: string;
  type: 'musician';
  createdAt: string;
  musicianName: string;
  status: 'amateur' | 'pro';
  instruments: { instrument: string; niveau: string }[];
  styles: string[];
  bio?: string;
  city: string;
  showcaseGroups: {
    name: string;
    city: string;
    position: string;
    status: 'association' | 'professionnel';
    description: string;
  }[];
}

export interface PublicGroupProfile {
  id: string;
  type: 'group';
  createdAt: string;
  name: string;
  styles: string[];
  status: 'association' | 'professionnel';
  description?: string;
  audioLinks: string[];
  city: string;
  requestedInstruments: { instrument: string; niveau: string }[];
}

export interface PublicProfileRepository {
  findAll(): Promise<{ musicians: PublicMusicianProfile[]; groups: PublicGroupProfile[] }>;
  findMusicianById(id: string): Promise<PublicMusicianProfile | null>;
  findGroupById(id: string): Promise<PublicGroupProfile | null>;
}
