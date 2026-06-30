import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/providers/AuthProvider';

export default function PerfilScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await signOut();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen title="Perfil">
      <View className="mt-4 rounded-xl bg-surface p-4">
        <Text className="text-xs uppercase tracking-wide text-slate-400">Nome</Text>
        <Text className="mt-1 text-base text-slate-50">{user?.name ?? '—'}</Text>

        <Text className="mt-4 text-xs uppercase tracking-wide text-slate-400">E-mail</Text>
        <Text className="mt-1 text-base text-slate-50">{user?.email ?? '—'}</Text>
      </View>

      <Pressable
        className={`mt-6 items-center rounded-xl px-4 py-4 ${loading ? 'bg-red-500/60' : 'bg-red-500'}`}
        disabled={loading}
        onPress={handleLogout}
      >
        <Text className="text-base font-semibold text-slate-50">Sair</Text>
      </Pressable>
    </Screen>
  );
}
