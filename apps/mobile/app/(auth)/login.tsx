import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { SocialAuthComingSoon } from '@/components/auth/SocialAuthComingSoon';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    try {
      await signIn({ email: email.trim(), password });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen title="Entrar" subtitle="Acesse sua conta para continuar">
      <AuthInput
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        placeholder="voce@exemplo.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        editable={!loading}
      />
      <AuthInput
        label="Senha"
        value={password}
        onChangeText={setPassword}
        placeholder="Sua senha"
        secureTextEntry
        autoCapitalize="none"
        editable={!loading}
      />

      {error ? <Text className="mb-2 text-sm text-red-400">{error}</Text> : null}

      <AuthButton label="Entrar" loading={loading} onPress={handleSubmit} />

      <SocialAuthComingSoon />

      <View className="mt-6 flex-row justify-center">
        <Text className="text-sm text-slate-400">Não tem conta? </Text>
        <Link href="/(auth)/register" className="text-sm font-semibold text-primary">
          Criar conta
        </Link>
      </View>
    </AuthScreen>
  );
}
