import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { AppColors } from '@/components/theme';
import { usePreferencesStore } from '@/stores/usePreferencesStore';

export default function Index() {
  const onboardingDone = usePreferencesStore((s) => s.onboardingDone);
  const loaded = usePreferencesStore((s) => s.loaded);
  // Wait for preferences to hydrate from AsyncStorage before deciding — otherwise
  // the store's default (onboardingDone: false) briefly wins on every cold start
  // and the welcome screen flashes even after onboarding was completed.
  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: AppColors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={AppColors.primary} />
      </View>
    );
  }
  if (!onboardingDone) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
