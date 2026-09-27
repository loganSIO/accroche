export interface CreateGroupInput {
  email: string;
  password: string;
  city: string;
  name: string;
  styles: string[];
  status: 'association' | 'professionnel';
  description?: string;
  audioLinks: string[];
  zone: { latitude: number; longitude: number; rayonKm: number; ville: string };
  requestedInstruments: { instrument: string; niveau: string }[];
}

export interface GroupCandidate {
  id: string;
  name: string;
  styles: string[];
  status: 'association' | 'professionnel';
  description: string | null;
  audioLinks: string[];
  zone: { latitude: number; longitude: number; rayonKm: number; ville: string };
  requestedInstruments?: { instrument: string; niveau: string }[];
}

export interface GroupRepository {
  findById(id: string): Promise<GroupCandidate | null>;
  create(input: CreateGroupInput): Promise<GroupCandidate>;
}