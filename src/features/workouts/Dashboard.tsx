import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Calendar, Plus, History as HistoryIcon, Dumbbell, Clock, ChevronRight, ListChecks } from 'lucide-react-native';
import { useProgramStore } from '@/stores/useProgramStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { getTodayWorkout, getTodayISO, getDayKey, friendlyDate } from '@/lib/datetime';
import { DAYS_OF_WEEK } from '@/domain/program/schema';
import { Card, PrimaryButton, SecondaryButton, Pill } from '@/components/ui';
import { styles, AppColors } from '@/components/styles';
import type { Workout } from '@/domain/program/schema';

function countSets(w: Workout): number {
  return w.items.reduce((sum, it) => {
    if (it.type === 'exercise') return sum + it.sets.length;
    if (it.type === 'superset') return sum + it.exercises.reduce((s, e) => s + e.sets.length, 0) * it.rounds;
    return sum;
  }, 0);
}

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const program = useProgramStore((s) => s.program);
  const beginSession = useSessionStore((s) => s.beginSession);
  const session = useSessionStore((s) => s.session);

  if (!program) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={styles.body}>Loading program…</Text>
      </View>
    );
  }

  // Active session recovery prompt (§26) takes priority.
  const isActive =
    session && (session.state === 'Active' || session.state === 'Resting' || session.state === 'WaitingForEquipment' || session.state === 'Paused');

  if (isActive && session) {
    const minutesAgo = Math.round((Date.now() - session.startTime) / 60000);
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.h2}>Workout in progress</Text>
        <Text style={styles.muted}>Started {minutesAgo} minute{minutesAgo === 1 ? '' : 's'} ago</Text>
        <Card>
          <Text style={styles.bigNumber}>{session.label}</Text>
          <Text style={styles.muted}>{friendlyDate(session.date)}</Text>
          <View style={{ height: 16 }} />
          <PrimaryButton label="Continue Workout" onPress={() => router.push('/workout/active')} />
          <View style={{ height: 12 }} />
          <SecondaryButton label="Discard Session" onPress={() => router.push('/workout/complete?discard=1')} />
        </Card>
      </ScrollView>
    );
  }

  const today = new Date();
  const workout = getTodayWorkout(program, today);
  const dayKey = getDayKey(today);

  const startWorkout = (w: Workout) => {
    beginSession(program.program.id, w);
    router.push('/workout/active');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.muted}>{friendlyDate(getTodayISO())} · {dayKey}</Text>
      <Text style={styles.title}>{greeting()}</Text>

      {workout ? (
        <Card>
          <View style={styles.rowBetween}>
            <Text style={styles.h2}>Today's Workout</Text>
            <Pill text={`Day ${DAYS_OF_WEEK.indexOf(dayKey) + 1}`} />
          </View>
          <Text style={[styles.title, { fontSize: 26 }]}>{workout.name}</Text>
          <View style={[styles.row, { gap: 16, marginVertical: 12 }]}>
            <Metric icon={<Dumbbell size={16} color={AppColors.textMuted} />} text={`${countItems(workout)} items`} />
            <Metric icon={<Clock size={16} color={AppColors.textMuted} />} text={`${countSets(workout)} sets`} />
            {workout.estimatedDurationMin && (
              <Metric icon={<Clock size={16} color={AppColors.textMuted} />} text={`~${workout.estimatedDurationMin}m`} />
            )}
          </View>
          {workout.description ? <Text style={styles.muted}>{workout.description}</Text> : null}
          <View style={{ height: 16 }} />
          <PrimaryButton label="Start Workout" onPress={() => startWorkout(workout)} />
          <View style={{ height: 12 }} />
          <SecondaryButton label="View Workout Details" onPress={() => router.push(`/workout/${workout.id}`)} />
        </Card>
      ) : (
        <Card>
          <Text style={styles.h2}>Rest Day</Text>
          <Text style={styles.body}>No workout scheduled for today. Recover well — or add an extra session.</Text>
          <View style={{ height: 16 }} />
          <SecondaryButton label="View Other Days" onPress={() => router.push('/other-days')} />
          <View style={{ height: 12 }} />
          <PrimaryButton label="Start Extra Workout" onPress={() => router.push('/extra-workout')} />
        </Card>
      )}

      <View style={{ height: 8 }} />
      <Pressable style={styles.card} onPress={() => router.push('/other-days')}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Calendar size={20} color={AppColors.primary} />
            <Text style={[styles.h3, { marginLeft: 12 }]}>Other Days</Text>
          </View>
          <ChevronRight size={20} color={AppColors.textMuted} />
        </View>
      </Pressable>
      <Pressable style={styles.card} onPress={() => router.push('/extra-workout')}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Plus size={20} color={AppColors.primary} />
            <Text style={[styles.h3, { marginLeft: 12 }]}>Extra Workout</Text>
          </View>
          <ChevronRight size={20} color={AppColors.textMuted} />
        </View>
      </Pressable>
      <Pressable style={styles.card} onPress={() => router.push('/(tabs)/history')}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <HistoryIcon size={20} color={AppColors.primary} />
            <Text style={[styles.h3, { marginLeft: 12 }]}>Workout History</Text>
          </View>
          <ChevronRight size={20} color={AppColors.textMuted} />
        </View>
      </Pressable>
      <Pressable style={styles.card} onPress={() => router.push('/(tabs)/program')}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <ListChecks size={20} color={AppColors.primary} />
            <Text style={[styles.h3, { marginLeft: 12 }]}>Program & Import JSON</Text>
          </View>
          <ChevronRight size={20} color={AppColors.textMuted} />
        </View>
      </Pressable>
    </ScrollView>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function countItems(w: Workout): number {
  return w.items.length;
}

function Metric({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.row}>
      {icon}
      <Text style={[styles.muted, { marginLeft: 6 }]}>{text}</Text>
    </View>
  );
}
