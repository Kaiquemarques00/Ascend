import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';

export default function PerfilScreen() {
  const { user, signOut, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setName(user?.name ?? '');
  }, [user?.name]);

  const trimmedName = name.trim();
  const isDirty = trimmedName !== (user?.name ?? '');
  const canSave = isDirty && trimmedName.length > 0 && !saving;

  async function handleSave() {
    if (!canSave) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateProfile({ name: trimmedName });
      setSavedAt(Date.now());
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Não foi possível salvar. Tente novamente.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <Screen title="Perfil">
      <View className="mt-4 rounded-xl bg-surface p-4">
        <Text className="text-xs uppercase tracking-wide text-slate-400">Nome</Text>
        <TextInput
          className="mt-2 rounded-xl bg-background px-4 py-3 text-base text-slate-50"
          placeholder="Seu nome"
          placeholderTextColor="#64748B"
          value={name}
          maxLength={100}
          onChangeText={(value) => {
            setName(value);
            setSavedAt(null);
            setError(null);
          }}
        />

        <Text className="mt-4 text-xs uppercase tracking-wide text-slate-400">E-mail</Text>
        <Text className="mt-1 text-base text-slate-50">{user?.email ?? '—'}</Text>

        {error ? <Text className="mt-3 text-sm text-red-400">{error}</Text> : null}
        {savedAt && !error ? (
          <Text className="mt-3 text-sm text-emerald-400">Nome atualizado.</Text>
        ) : null}

        <Pressable
          className={`mt-4 items-center rounded-xl px-4 py-3 ${
            canSave ? 'bg-primary' : 'bg-primary/40'
          }`}
          disabled={!canSave}
          onPress={handleSave}
        >
          <Text className="text-base font-semibold text-slate-50">
            {saving ? 'Salvando…' : 'Salvar'}
          </Text>
        </Pressable>
      </View>

      <Pressable
        className={`mt-6 items-center rounded-xl px-4 py-4 ${loggingOut ? 'bg-red-500/60' : 'bg-red-500'}`}
        disabled={loggingOut}
        onPress={handleLogout}
      >
        <Text className="text-base font-semibold text-slate-50">Sair</Text>
      </Pressable>
    </Screen>
  );
}
