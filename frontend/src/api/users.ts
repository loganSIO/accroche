import { request } from './client';
import type { GroupProfile, MusicianProfile } from '../types/profile';

export type CreateMusicianInput = Omit<MusicianProfile, 'id' | 'user'> & { email: string; password: string };
export type CreateGroupInput = Omit<GroupProfile, 'id' | 'user'> & { email: string; password: string };
export const createMusician = (input: CreateMusicianInput) => request<MusicianProfile>('/musicians', { method: 'POST', body: JSON.stringify(input) });
export const createGroup = (input: CreateGroupInput) => request<GroupProfile>('/groups', { method: 'POST', body: JSON.stringify(input) });
