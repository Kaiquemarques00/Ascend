import { useQuery } from '@tanstack/react-query';
import { Text } from 'react-native';

import { getHealth } from '@/lib/api';

export function ApiStatus() {
  const { isSuccess, isPending, isError, error } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    retry: 1,
  });
  
  // adicione temporariamente:
  console.log('health query', { isSuccess, isPending, isError, error: error?.message });

  if (isPending) {
    return <Text className="mt-4 text-slate-400">Verificando conexão...</Text>;
  }

  if (isSuccess) {
    return <Text className="mt-4 text-success">API conectada</Text>;
  }

  return <Text className="mt-4 text-slate-400">API offline</Text>;
}
