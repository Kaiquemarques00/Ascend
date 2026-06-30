import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ApiError } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';

WebBrowser.maybeCompleteAuthSession();

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

const isGoogleConfigured = Boolean(webClientId || iosClientId || androidClientId);

interface SocialAuthButtonsProps {
  disabled?: boolean;
  onError?: (message: string) => void;
}

export function SocialAuthButtons({ disabled, onError }: SocialAuthButtonsProps) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId,
    iosClientId,
    androidClientId,
  });

  useEffect(() => {
    if (!response) {
      return;
    }

    if (response.type === 'error') {
      onError?.('Não foi possível entrar com Google. Tente novamente.');
      return;
    }

    if (response.type !== 'success') {
      return;
    }

    const idToken = response.params.id_token;
    if (!idToken) {
      onError?.('Não foi possível entrar com Google. Tente novamente.');
      return;
    }

    setLoading(true);
    signInWithGoogle(idToken)
      .catch((err) => {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Não foi possível entrar com Google. Tente novamente.';
        onError?.(message);
      })
      .finally(() => setLoading(false));
  }, [response, signInWithGoogle, onError]);

  if (!isGoogleConfigured) {
    return null;
  }

  const isDisabled = Boolean(disabled) || loading || !request;

  return (
    <View className="mt-6">
      <View className="mb-4 flex-row items-center">
        <View className="h-px flex-1 bg-slate-700" />
        <Text className="mx-3 text-sm text-slate-400">ou</Text>
        <View className="h-px flex-1 bg-slate-700" />
      </View>

      <Pressable
        className={`flex-row items-center justify-center rounded-xl border border-slate-600 bg-surface px-4 py-4 ${
          isDisabled ? 'opacity-60' : ''
        }`}
        disabled={isDisabled}
        onPress={() => promptAsync()}
      >
        <Text className="text-base font-semibold text-slate-50">Continuar com Google</Text>
      </Pressable>
    </View>
  );
}
