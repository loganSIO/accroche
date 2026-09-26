import { request } from './client';
import type { GroupStatus, PositionLevel, ZoneInput } from './users';

export interface CreateOpenPositionInput {
  instrument: string;
  niveau: PositionLevel;
}

export interface OpenPosition {
  id: string;
  instrumentRecherche: string;
  niveauAttendu: PositionLevel;
  stylesGroupe: string[];
  zone: { latitude: number; longitude: number; rayonKm: number; ville: string };
}

export interface UserGroup {
  id: string;
  name: string;
  styles: string[];
  status: GroupStatus;
  description?: string;
  audioLinks: string[];
  zone: ZoneInput;
}

export interface CreateUserGroupInput {
  name: string;
  styles: string[];
  status: GroupStatus;
  description?: string;
  audioLinks: string[];
  zone: ZoneInput;
}

export const listUserGroups = () => request<UserGroup[]>('/users/me/groups');
export const createUserGroup = (input: CreateUserGroupInput) =>
  request<UserGroup>('/users/me/groups', { method: 'POST', body: JSON.stringify(input) });
export const updateUserGroup = (groupId: string, input: Partial<CreateUserGroupInput>) =>
  request<UserGroup>(`/groups/${groupId}`, { method: 'PATCH', body: JSON.stringify(input) });
export const deleteUserGroup = (groupId: string) =>
  request<{ success: boolean }>(`/groups/${groupId}`, { method: 'DELETE' });

export const createOpenPosition = (groupId: string, input: CreateOpenPositionInput) =>
  request<OpenPosition>(`/groups/${groupId}/positions`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
