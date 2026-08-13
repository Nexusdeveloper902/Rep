import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useProgramStore } from '@/stores/useProgramStore';
import { DAYS_OF_WEEK } from '@/domain/program/schema';
import { styles, AppColors } from '@/components/styles';
import { getWorkoutForDay } from '@/lib/datetime';

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

export default function OtherDaysScreen() {
  const insets = useSafeAreaInsets();
  const program = useProgramStore((s) => s.program);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>This Week</Text>
      <Text style={styles.muted}>Browse your schedule. Tap a day to preview its workout without starting.</Text>
      {program && DAYS_OF_WEEK.map((day) => {
        const workout = getWorkoutForDay(program, day);
        return (
          <Pressable key={day} style={styles.card} onPress={workout ? () => router.push(`/workout/${workout.id}?day=${day}`) : undefined}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.h3}>{DAY_LABELS[day]}</Text>
                <Text style={styles.muted}>{workout ? workout.name : 'Rest Day'}</Text>
              </View>
              {workout && <ChevronRight size={20} color={AppColors.textMuted} />}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
