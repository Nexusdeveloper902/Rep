import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Dumbbell } from 'lucide-react-native';
import { usePreferencesStore } from '@/stores/usePreferencesStore';
import { PrimaryButton } from '@/components/ui';
import { AppColors } from '@/components/theme';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const completeOnboarding = usePreferencesStore((s) => s.completeOnboarding);

  const getStarted = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 }}>
        <View style={styles.iconWrap}>
          <Dumbbell size={56} color="#fff" />
        </View>
        <Text style={styles.title}>Gym Workout Companion</Text>
        <Text style={styles.subtitle}>
          Your program is the plan. Your session is the reality. Track every set, handle supersets, work around busy
          equipment, and never lose progress — even if the app closes mid-workout.
        </Text>
      </View>
      <View style={{ paddingBottom: insets.bottom + 24, paddingHorizontal: 28 }}>
        <PrimaryButton label="Get Started" onPress={getStarted} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.bg },
  iconWrap: {
    backgroundColor: AppColors.primary,
    width: 112,
    height: 112,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 30, fontWeight: '800', color: AppColors.text, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, color: AppColors.textMuted, textAlign: 'center', lineHeight: 24 },
});
