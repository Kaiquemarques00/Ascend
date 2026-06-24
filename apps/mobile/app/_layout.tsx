import { Platform } from 'react-native';
import { Stack } from 'expo-router';

// #region agent log
const _debugRuntimeVersions = {
  react: require('react/package.json').version as string,
  reactNative: require('react-native/package.json').version as string,
  platform: Platform.OS,
};
console.warn('[DEBUG-e7474a] root-layout-module-load', _debugRuntimeVersions);
fetch('http://127.0.0.1:7376/ingest/2a611cba-c800-4129-af2b-dfa009df603a', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'e7474a' },
  body: JSON.stringify({
    sessionId: 'e7474a',
    runId: 'post-fix',
    hypothesisId: 'A',
    location: 'app/_layout.tsx:module',
    message: 'root layout module loaded',
    data: _debugRuntimeVersions,
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

export default function RootLayout() {
  // #region agent log
  console.warn('[DEBUG-e7474a] root-layout-render');
  fetch('http://127.0.0.1:7376/ingest/2a611cba-c800-4129-af2b-dfa009df603a', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'e7474a' },
    body: JSON.stringify({
      sessionId: 'e7474a',
      runId: 'post-fix',
      hypothesisId: 'E',
      location: 'app/_layout.tsx:render',
      message: 'root layout render reached',
      data: {},
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
