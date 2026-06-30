import * as SplashScreen from 'expo-splash-screen';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { refreshSession } from '@/lib/auth-refresh';
import {
  getMe,
  login as loginApi,
  logout as logoutApi,
  register as registerApi,
  updateProfile as updateProfileApi,
} from '@/lib/auth-api';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setSession,
} from '@/lib/auth-storage';
import type {
  AuthSession,
  AuthUser,
  LoginParams,
  RegisterParams,
  UpdateProfileParams,
} from '@/lib/auth.types';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (params: LoginParams) => Promise<void>;
  signUp: (params: RegisterParams) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (params: UpdateProfileParams) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        let accessToken = await getAccessToken();

        if (!accessToken) {
          const refreshed = await refreshSession();
          accessToken = refreshed?.accessToken ?? null;
        }

        if (!accessToken) {
          return;
        }

        const me = await getMe(accessToken);
        if (active) {
          setUser(me);
        }
      } catch {
        const refreshed = await refreshSession();
        if (refreshed && active) {
          setUser(refreshed.user);
          return;
        }

        await clearSession();
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  const applySession = useCallback(async (session: AuthSession) => {
    await setSession(session);
    setUser(session.user);
  }, []);

  const signIn = useCallback(
    async (params: LoginParams) => {
      const session = await loginApi(params);
      await applySession(session);
    },
    [applySession],
  );

  const signUp = useCallback(
    async (params: RegisterParams) => {
      const session = await registerApi(params);
      await applySession(session);
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    const accessToken = await getAccessToken();

    if (refreshToken) {
      try {
        await logoutApi(refreshToken, accessToken);
      } catch {
        // Best-effort server revoke; always clear local session
      }
    }

    await clearSession();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (params: UpdateProfileParams) => {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const updated = await updateProfileApi(accessToken, params);
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        signIn,
        signUp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
