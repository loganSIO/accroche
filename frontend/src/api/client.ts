const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1').replace(/\/$/, '');

export interface ApiEnvelope<T> { data: T; meta: { timestamp: string; version: string }; }
export interface ApiErrorBody { error?: { code?: string; message?: string }; }
export interface AuthSession { accessToken: string; refreshToken: string; userId: string; }

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) { super(message); this.name = 'ApiError'; this.status = status; }
}

const ACCESS_TOKEN_KEY = 'accroche.accessToken';
const REFRESH_TOKEN_KEY = 'accroche.refreshToken';

export function readSession(): AuthSession | null {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const userId = localStorage.getItem('accroche.userId');
  return accessToken && refreshToken && userId ? { accessToken, refreshToken, userId } : null;
}

export function saveSession(session: AuthSession) {
  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  localStorage.setItem('accroche.userId', session.userId);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('accroche.userId');
}

async function refreshSession(): Promise<AuthSession | null> {
  const session = readSession();
  if (!session) return null;
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
  if (!response.ok) {
    clearSession();
    return null;
  }
  const envelope = await response.json() as ApiEnvelope<AuthSession>;
  saveSession(envelope.data);
  return envelope.data;
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = readSession();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (session) headers.set('Authorization', `Bearer ${session.accessToken}`);
  let response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401 && session && !path.startsWith('/auth/')) {
    const refreshed = await refreshSession();
    if (refreshed) {
      headers.set('Authorization', `Bearer ${refreshed.accessToken}`);
      response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    }
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null) as ApiErrorBody | null;
    throw new ApiError(body?.error?.message ?? `La requête a échoué (${response.status}).`, response.status);
  }
  const envelope = await response.json() as ApiEnvelope<T>;
  return envelope.data;
}
