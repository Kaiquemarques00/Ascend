import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  title: string;
  children?: React.ReactNode;
}

export function Screen({ title, children }: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4">
        {title ? (
          <Text className="mb-2 mt-4 text-2xl font-semibold text-slate-50">{title}</Text>
        ) : null}
        {children}
      </View>
    </SafeAreaView>
  );
}
