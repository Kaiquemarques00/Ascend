import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface AuthInputProps extends TextInputProps {
  label: string;
}

export function AuthInput({ label, ...props }: AuthInputProps) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-slate-300">{label}</Text>
      <TextInput
        className="rounded-xl bg-surface px-4 py-3 text-base text-slate-50"
        placeholderTextColor="#64748B"
        {...props}
      />
    </View>
  );
}
