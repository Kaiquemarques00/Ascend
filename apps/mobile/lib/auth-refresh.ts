import type { AuthSession } from './auth.types';
import { clearSession, getRefreshToken, setSession } from './auth-storage';

function getApiBaseUrl(): string {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured');
  }
  return baseUrl.replace(/\/$/, '');
}

let refreshInFlight: Promise<AuthSession | null> | null = null;

export async function refreshSession(): Promise<AuthSession | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await clearSession();
        return null;
      }

      const session = (await response.json()) as AuthSession;
      await setSession(session);
      return session;
    } catch {
      await clearSession();
      return null;
    }
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}
