import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

interface AuthButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  loading?: boolean;
}

export function AuthButton({ label, loading, disabled, ...props }: AuthButtonProps) {
  const isDisabled = Boolean(disabled) || Boolean(loading);

  return (
    <Pressable
      className={`mt-2 flex-row items-center justify-center rounded-xl px-4 py-4 ${
        isDisabled ? 'bg-primary/60' : 'bg-primary'
      }`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#F8FAFC" />
      ) : (
        <Text className="text-base font-semibold text-slate-50">{label}</Text>
      )}
    </Pressable>
  );
}
