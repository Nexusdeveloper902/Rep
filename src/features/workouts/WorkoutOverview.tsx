import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Dumbbell, Clock, Layers } from 'lucide-react-native';
import { useProgramStore } from '@/stores/useProgramStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { Card, PrimaryButton } from '@/components/ui';
import { styles, AppColors } from '@/components/styles';
import type { Workout, WorkoutItem } from '@/domain/program/schema';

function itemSummary(item: WorkoutItem): string {
  if (item.type === 'exercise') return `${item.sets.length} × ${item.sets[0].reps}`;
  if (item.type === 'superset') {
    const per = item.exercises.map((e) => `${e.sets.length}×${e.sets[0].reps}`).join(' · ');
    return `${item.rounds} rounds · ${per}`;
  }
  const parts: string[] = [];
  if (item.durationMin) parts.push(`${item.durationMin} min`);
  if (item.distance) parts.push(`${item.distance} ${'km'}`);
  return parts.join(' · ') || item.cardioType;
}

export function WorkoutOverview({ workout }: { workout: Workout }) {
  const insets = useSafeAreaInsets();
  const program = useProgramStore((s) => s.program);
  const beginSession = useSessionStore((s) => s.beginSession);

  const start = () => {
    if (!program) return;
    beginSession(program.program.id, workout);
    router.push('/workout/active');
  };

  const equipment = new Set<string>();
  for (const it of workout.items) {
    if (it.type === 'exercise') {
      const ex = program?.exercises.find((e) => e.id === it.exerciseId);
      if (ex?.equipment) equipment.add(ex.equipment);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>{workout.name}</Text>
      {workout.description ? <Text style={styles.muted}>{workout.description}</Text> : null}
      <View style={[styles.row, { gap: 16, marginVertical: 12 }]}>
        <Stat icon={<Dumbbell size={16} color={AppColors.textMuted} />} text={`${workout.items.length} items`} />
        {workout.estimatedDurationMin && <Stat icon={<Clock size={16} color={AppColors.textMuted} />} text={`~${workout.estimatedDurationMin}m`} />}
        {equipment.size > 0 && <Stat icon={<Layers size={16} color={AppColors.textMuted} />} text={`${equipment.size} equipment`} />}
      </View>

      <Text style={[styles.h2, { marginTop: 8 }]}>Workout Items</Text>
      {workout.items.map((item, i) => (
        <Card key={i}>
          <View style={styles.rowBetween}>
            <Text style={styles.h3}>
              {item.type === 'exercise'
                ? program?.exercises.find((e) => e.id === item.exerciseId)?.name ?? item.exerciseId
                : item.type === 'superset'
                  ? `SUPERSET · ${item.name ?? 'Group'}`
                  : `${item.cardioType}${item.name ? ` · ${item.name}` : ''}`}
            </Text>
          </View>
          <Text style={[styles.muted, { marginTop: 4 }]}>{itemSummary(item)}</Text>
          {item.type === 'superset' && (
            <View style={{ marginTop: 8 }}>
              {item.exercises.map((e, j) => (
                <Text key={j} style={styles.muted}>· {program?.exercises.find((x) => x.id === e.exerciseId)?.name ?? e.exerciseId}</Text>
              ))}
            </View>
          )}
        </Card>
      ))}

      {equipment.size > 0 && (
        <>
          <Text style={[styles.h2, { marginTop: 8 }]}>Equipment</Text>
          <Card>
            <View style={[styles.row, { flexWrap: 'wrap', gap: 8 }]}>
              {Array.from(equipment).map((eq) => (
                <View key={eq} style={styles.pill}><Text style={styles.pillText}>{eq}</Text></View>
              ))}
            </View>
          </Card>
        </>
      )}

      <View style={{ height: 16 }} />
      <PrimaryButton label="Start Workout" onPress={start} />
    </ScrollView>
  );
}

function Stat({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.row}>
      {icon}
      <Text style={[styles.muted, { marginLeft: 6 }]}>{text}</Text>
    </View>
  );
}
