const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1').replace(/\/$/, '');

export interface ApiEnvelope<T> { data: T; meta: { timestamp: string; version: string }; }
export interface ApiErrorBody { error?: { code?: string; message?: string }; }

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) { super(message); this.name = 'ApiError'; this.status = status; }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as ApiErrorBody | null;
    throw new ApiError(body?.error?.message ?? `La requête a échoué (${response.status}).`, response.status);
  }
  const envelope = await response.json() as ApiEnvelope<T>;
  return envelope.data;
}
