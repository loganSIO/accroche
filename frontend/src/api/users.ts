import { request } from './client';

export type PositionLevel = 'debutant' | 'intermediaire' | 'avance' | 'expert';
export type GroupStatus = 'association' | 'professionnel';
export type MemberStatus = 'amateur' | 'pro';
export type MusicianObjective = 'join_group' | 'found_group';

export interface RequestedInstrument {
  instrument: string;
  niveau: PositionLevel;
}

export interface RegisterGroupInput {
  name: string;
  styles: string[];
  status: GroupStatus;
  description?: string;
  audioLinks: string[];
  requestedInstruments: RequestedInstrument[];
}

export interface ZoneInput { latitude: number; longitude: number; rayonKm: number; ville: string; }

export interface RegisterAccountInput {
  email: string;
  password: string;
  zone: ZoneInput;
  musician?: {
    status: MemberStatus;
    instruments: RequestedInstrument[];
    styles: string[];
    objective: MusicianObjective[];
    availabilities: { jourSemaine: string; creneauxJournee: 'matin' | 'apres-midi' | 'soir' }[];
    bio?: string;
  };
  groups: Array<{
    name: string;
    styles: string[];
    status: GroupStatus;
    description?: string;
    audioLinks: string[];
    requestedInstruments: RequestedInstrument[];
  }>;
}
export const registerAccount = (input: RegisterAccountInput) =>
  request<{ userId: string; musicianProfileId: string | null; groupIds: string[] }>('/accounts', { method: 'POST', body: JSON.stringify(input) });

export interface MusicianProfileInput {
  musicianName: string;
  status: MemberStatus;
  instruments: RequestedInstrument[];
  styles: string[];
  objective: MusicianObjective[];
  availabilities: { jourSemaine: string; creneauxJournee: 'matin' | 'apres-midi' | 'soir' }[];
  bio?: string;
  zone: ZoneInput;
}

export interface MusicianProfile extends MusicianProfileInput { id: string; }

export const getMusicianProfile = () => request<MusicianProfile>('/users/me/musician-profile');
export const createMusicianProfile = (input: MusicianProfileInput) =>
  request<MusicianProfile>('/users/me/musician-profile', { method: 'POST', body: JSON.stringify(input) });
export const updateMusicianProfile = (input: Partial<MusicianProfileInput>) =>
  request<MusicianProfile>('/users/me/musician-profile', { method: 'PATCH', body: JSON.stringify(input) });
