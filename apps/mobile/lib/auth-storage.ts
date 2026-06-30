import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { AuthSession } from './auth.types';

const ACCESS_TOKEN_KEY = 'ascend_access_token';
const REFRESH_TOKEN_KEY = 'ascend_refresh_token';

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function getAccessToken(): Promise<string | null> {
  return getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_TOKEN_KEY);
}

export async function setAccessToken(token: string): Promise<void> {
  await setItem(ACCESS_TOKEN_KEY, token);
}

export async function setRefreshToken(token: string): Promise<void> {
  await setItem(REFRESH_TOKEN_KEY, token);
}

export async function setSession(session: AuthSession): Promise<void> {
  await setAccessToken(session.accessToken);
  if (session.refreshToken) {
    await setRefreshToken(session.refreshToken);
  }
}

export async function clearAccessToken(): Promise<void> {
  await deleteItem(ACCESS_TOKEN_KEY);
}

export async function clearRefreshToken(): Promise<void> {
  await deleteItem(REFRESH_TOKEN_KEY);
}

export async function clearSession(): Promise<void> {
  await Promise.all([clearAccessToken(), clearRefreshToken()]);
}
