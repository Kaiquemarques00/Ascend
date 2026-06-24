import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  // #region agent log
  console.warn('[DEBUG-e7474a] home-screen-render');
  fetch('http://127.0.0.1:7376/ingest/2a611cba-c800-4129-af2b-dfa009df603a', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'e7474a' },
    body: JSON.stringify({
      sessionId: 'e7474a',
      runId: 'post-fix',
      hypothesisId: 'E',
      location: 'app/index.tsx:render',
      message: 'home screen render reached',
      data: {},
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ASCEND</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '600',
  },
});
