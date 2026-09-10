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

export interface RegisterAccountInput {
  email: string;
  password: string;
  zone: { latitude: number; longitude: number; rayonKm: number; ville: string };
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
