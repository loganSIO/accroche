import { request } from './client';
import type { Match } from '../types/match';
export const getMatches = (musicianId: string) => request<Match[]>(`/musicians/${encodeURIComponent(musicianId)}/matches`);
