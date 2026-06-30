import { Text, View } from 'react-native';

export function SocialAuthComingSoon() {
  return (
    <View className="mt-6">
      <View className="mb-4 flex-row items-center">
        <View className="h-px flex-1 bg-slate-700" />
        <Text className="mx-3 text-sm text-slate-400">ou</Text>
        <View className="h-px flex-1 bg-slate-700" />
      </View>

      <View className="rounded-xl border border-slate-700 bg-surface/50 px-4 py-3">
        <Text className="text-center text-sm text-slate-400">
          Login com Google e Apple — em breve
        </Text>
      </View>
    </View>
  );
}
