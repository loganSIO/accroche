import { useCallback, useState } from 'react';

export interface AuthState { userId: string | null; isAuthenticated: boolean; }

export function useAuth(): AuthState & { signOut: () => void } {
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('accroche.userId'));
  const signOut = useCallback(() => {
    localStorage.removeItem('accroche.userId');
    setUserId(null);
  }, []);
  return { userId, isAuthenticated: userId !== null, signOut };
}
