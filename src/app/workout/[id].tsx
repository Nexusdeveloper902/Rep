import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';
import { useProgramStore } from '@/stores/useProgramStore';
import { WorkoutOverview } from '@/features/workouts/WorkoutOverview';
import { styles } from '@/components/styles';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = useProgramStore((s) => s.program?.workouts.find((w) => w.id === id));

  if (!workout) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.body}>Workout not found.</Text>
      </View>
    );
  }
  return <WorkoutOverview workout={workout} />;
}
