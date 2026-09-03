import type { GroupStatus, MemberStatus, User, Zone } from './user';

export interface Instrument { instrument: string; niveau: string; }
export interface Availability { jourSemaine: string; creneauxJournee: string; }
export interface MusicianProfile {
  id: string; user: User; zone: Zone; status: MemberStatus; objective: string[];
  bio?: string; instruments: Instrument[]; styles: string[]; availabilities: Availability[];
}
export interface GroupProfile {
  id: string; user: User; zone: Zone; name: string; styles: string[];
  status: GroupStatus; description?: string; audioLinks: string[];
}
export interface FoundingProfile {
  id: string; founderMusicianId: string; zone: Zone; styles: string[]; description?: string;
}
