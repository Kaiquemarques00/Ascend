import { Text, View } from 'react-native';

import { ApiStatus } from '@/components/ApiStatus';
import { Screen } from '@/components/Screen';

export default function DashboardScreen() {
  return (
    <Screen title="">
      <View className="flex-1 items-center justify-center">
        <Text className="text-3xl font-bold text-slate-50">ASCEND</Text>
        <Text className="mt-2 text-base text-slate-400">Consistência que transforma</Text>
        <ApiStatus />
      </View>
    </Screen>
  );
}
