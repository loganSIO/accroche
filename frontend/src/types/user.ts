export type ProfileType = 'musician' | 'group' | 'founding';
export type MemberStatus = 'amateur' | 'pro';
export type GroupStatus = 'association' | 'professionnel';

export interface User {
  id: string;
  email: string;
  city: string;
  createdAt: string;
}

export interface Zone {
  id?: string;
  latitude: number;
  longitude: number;
  rayonKm: number;
  ville: string;
}
