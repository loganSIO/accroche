import { request } from './client';

export interface MapCluster {
  ville: string;
  latitude: number;
  longitude: number;
  musicianCount: number;
  groupCount: number;
}

export const getMapClusters = () => request<MapCluster[]>('/map');
