import { useCallback, useState } from 'react';

export interface AuthState { userId: string | null; isAuthenticated: boolean; }

export function useAuth(): AuthState & { signIn: (userId: string) => void; signOut: () => void } {
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('accroche.userId'));
  const signIn = useCallback((nextUserId: string) => {
    localStorage.setItem('accroche.userId', nextUserId);
    setUserId(nextUserId);
  }, []);
  const signOut = useCallback(() => {
    localStorage.removeItem('accroche.userId');
    setUserId(null);
  }, []);
  return { userId, isAuthenticated: userId !== null, signIn, signOut };
}
