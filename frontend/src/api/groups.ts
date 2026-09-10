import { request } from './client';
import type { PositionLevel } from './users';

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

export const createOpenPosition = (groupId: string, input: CreateOpenPositionInput) =>
  request<OpenPosition>(`/groups/${groupId}/positions`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
