import { apiFetch } from './api';
import type {
  AuthSession,
  AuthUser,
  LoginParams,
  RegisterParams,
  UpdateProfileParams,
} from './auth.types';

export function register(params: RegisterParams): Promise<AuthSession> {
  return apiFetch<AuthSession>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

export function login(params: LoginParams): Promise<AuthSession> {
  return apiFetch<AuthSession>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

export function getMe(token: string): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me', { token });
}

export function updateProfile(token: string, params: UpdateProfileParams): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    token,
  });
}

export function logout(refreshToken: string, accessToken?: string | null): Promise<void> {
  return apiFetch<void>('/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    token: accessToken,
    retryOnUnauthorized: false,
  });
}
