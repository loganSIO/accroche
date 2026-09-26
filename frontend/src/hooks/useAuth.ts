import { useCallback, useState } from 'react';
import { clearSession, readSession, saveSession, type AuthSession } from '../api/client';
import { logout } from '../api/auth';

export interface AuthState { userId: string | null; isAuthenticated: boolean; }

export function useAuth(): AuthState & { signIn: (session: AuthSession) => void; signOut: () => void } {
  const [session, setSession] = useState<AuthSession | null>(readSession);
  const signIn = useCallback((nextSession: AuthSession) => {
    saveSession(nextSession);
    setSession(nextSession);
  }, []);
  const signOut = useCallback(() => {
    const current = readSession();
    if (current) void logout(current.refreshToken).catch(() => undefined);
    clearSession();
    setSession(null);
  }, []);
  return { userId: session?.userId ?? null, isAuthenticated: session !== null, signIn, signOut };
}
