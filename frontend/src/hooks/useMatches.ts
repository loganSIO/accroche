import { useEffect, useState } from 'react';
import { getMatches } from '../api/matches';
import type { Match } from '../types/match';

export function useMatches(musicianId: string | null) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(musicianId !== null);
  useEffect(() => {
    if (!musicianId) return;
    getMatches(musicianId).then(setMatches).catch(setError).finally(() => setIsLoading(false));
  }, [musicianId]);
  return { matches: musicianId ? matches : [], error, isLoading };
}
