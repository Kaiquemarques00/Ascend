import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AuthScreenProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function AuthScreen({ title, subtitle, children }: AuthScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-10 items-center">
            <Text className="text-3xl font-bold tracking-[4px] text-primary">ASCEND</Text>
            <Text className="mt-2 text-sm text-slate-400">Consistência que transforma</Text>
          </View>

          <Text className="mb-1 text-2xl font-semibold text-slate-50">{title}</Text>
          {subtitle ? <Text className="mb-6 text-sm text-slate-400">{subtitle}</Text> : null}

          <View className="mt-2">{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
