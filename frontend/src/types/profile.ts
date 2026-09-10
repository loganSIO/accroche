import type { GroupStatus, MemberStatus, Zone } from './user';
import type { PositionLevel } from '../api/users';

export interface Instrument { instrument: string; niveau: PositionLevel; }
export interface Availability { jourSemaine: string; creneauxJournee: 'matin' | 'apres-midi' | 'soir'; }
export interface MusicianProfile {
  id: string; zone: Zone; status: MemberStatus;
  instruments: Instrument[]; styles: string[]; availabilities: Availability[];
}
export interface GroupProfile {
  id: string; zone: Zone; name: string; styles: string[];
  status: GroupStatus; description?: string; audioLinks: string[];
}
export interface FoundingProfile {
  id: string; founderMusicianId: string; zone: Zone; styles: string[]; description?: string;
}
