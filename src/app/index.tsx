import { Redirect } from 'expo-router';
import { usePreferencesStore } from '@/stores/usePreferencesStore';

export default function Index() {
  const onboardingDone = usePreferencesStore((s) => s.onboardingDone);
  if (!onboardingDone) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
