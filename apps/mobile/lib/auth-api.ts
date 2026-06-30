import { apiFetch } from './api';
import type { AuthSession, AuthUser, LoginParams, RegisterParams } from './auth.types';

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

export function loginGoogle(params: { idToken: string }): Promise<AuthSession> {
  return apiFetch<AuthSession>('/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}
