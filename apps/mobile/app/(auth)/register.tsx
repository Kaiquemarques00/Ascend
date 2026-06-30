import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);

    try {
      await signUp({ name: name.trim(), email: email.trim(), password });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Não foi possível criar a conta. Tente novamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen title="Criar conta" subtitle="Comece sua jornada no ASCEND">
      <AuthInput
        label="Nome"
        value={name}
        onChangeText={setName}
        placeholder="Seu nome"
        autoCapitalize="words"
        autoComplete="name"
        editable={!loading}
      />
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
        placeholder="Mín. 8 caracteres, 1 letra e 1 número"
        secureTextEntry
        autoCapitalize="none"
        editable={!loading}
      />

      {error ? <Text className="mb-2 text-sm text-red-400">{error}</Text> : null}

      <AuthButton label="Criar conta" loading={loading} onPress={handleSubmit} />

      <View className="mt-6 flex-row justify-center">
        <Text className="text-sm text-slate-400">Já tem conta? </Text>
        <Link href="/(auth)/login" className="text-sm font-semibold text-primary">
          Entrar
        </Link>
      </View>
    </AuthScreen>
  );
}
