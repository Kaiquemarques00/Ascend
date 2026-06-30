import * as SplashScreen from 'expo-splash-screen';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { getMe, login as loginApi, loginGoogle as loginGoogleApi, register as registerApi } from '@/lib/auth-api';
import { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/auth-storage';
import type { AuthSession, AuthUser, LoginParams, RegisterParams } from '@/lib/auth.types';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (params: LoginParams) => Promise<void>;
  signUp: (params: RegisterParams) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
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
        const token = await getAccessToken();
        if (!token) {
          return;
        }

        const me = await getMe(token);
        if (active) {
          setUser(me);
        }
      } catch {
        await clearAccessToken();
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
    await setAccessToken(session.accessToken);
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

  const signInWithGoogle = useCallback(
    async (idToken: string) => {
      const session = await loginGoogleApi({ idToken });
      await applySession(session);
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    await clearAccessToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
