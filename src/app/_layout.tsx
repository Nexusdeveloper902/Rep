import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppTheme } from '@/components/theme';
import { useAppBootstrap } from '@/lib/useAppBootstrap';

export default function RootLayout() {
  useAppBootstrap();
  return (
    <PaperProvider theme={AppTheme}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0B1220' },
          }}
        >
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="other-days" />
          <Stack.Screen name="extra-workout" />
          <Stack.Screen name="workout/[id]" />
          <Stack.Screen name="workout/active" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="workout/complete" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        </Stack>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
