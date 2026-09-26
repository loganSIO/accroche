import { request, type AuthSession } from './client';

export const login = (email: string, password: string) =>
  request<AuthSession>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const logout = (refreshToken: string) =>
  request<{ success: boolean }>('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) });

export const getCurrentUser = () => request<{ id: string; email: string }>('/users/me');
