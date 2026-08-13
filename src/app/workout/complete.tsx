import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Check, AlertTriangle } from 'lucide-react-native';
import { useSessionStore } from '@/stores/useSessionStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { Card, PrimaryButton, SecondaryButton, DangerButton } from '@/components/ui';
import { styles, AppColors } from '@/components/styles';
import type { WorkoutSummary } from '@/domain/workout/sessionTypes';

export default function CompleteScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ discard?: string }>();
  const session = useSessionStore((s) => s.session);
  const finishAndSave = useSessionStore((s) => s.finishAndSave);
  const discardActive = useSessionStore((s) => s.discardActive);
  const loadHistory = useHistoryStore((s) => s.loadHistory);
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [discarded, setDiscarded] = useState(false);

  const isDiscardMode = params.discard === '1';

  useEffect(() => {
    if (isDiscardMode && session) {
      setDiscarded(false);
    }
  }, [isDiscardMode, session]);

  if (!session) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.body}>No session to show.</Text>
        <View style={{ height: 12 }} />
        <SecondaryButton label="Back to Home" onPress={() => router.replace('/(tabs)')} />
      </View>
    );
  }

  // Recovery prompt for an in-progress session accessed via discard route.
  if (isDiscardMode && (session.state === 'Active' || session.state === 'Resting' || session.state === 'WaitingForEquipment' || session.state === 'Paused') && !discarded) {
    const minutesAgo = Math.round((Date.now() - session.startTime) / 60000);
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12, justifyContent: 'center' }]}>
        <Card>
          <View style={styles.row}>
            <AlertTriangle size={28} color={AppColors.warning} />
            <Text style={[styles.h2, { marginLeft: 10, flex: 1 }]}>Workout in progress</Text>
          </View>
          <Text style={[styles.body, { marginVertical: 12 }]}>Started {minutesAgo} minute{minutesAgo === 1 ? '' : 's'} ago.</Text>
          <PrimaryButton label="Continue" onPress={() => router.replace('/workout/active')} />
          <View style={{ height: 12 }} />
          <DangerButton label="Discard Workout" onPress={async () => { await discardActive(); setDiscarded(true); }} />
          <View style={{ height: 12 }} />
          <SecondaryButton label="Cancel" onPress={() => router.replace('/(tabs)')} />
        </Card>
      </ScrollView>
    );
  }

  const finalize = async () => {
    const sum = await finishAndSave();
    setSummary(sum);
    await loadHistory();
  };

  if (summary || session.state === 'WorkoutComplete') {
    const s = summary ?? { durationMin: Math.round(((session.endTime ?? Date.now()) - session.startTime) / 60000), exercisesTotal: 0, exercisesCompleted: 0, exercisesSkipped: 0, setsTotal: 0, setsCompleted: 0, cardioCount: 0, cardioCompleted: 0, substitutionsCount: Object.keys(session.substitutions).length };
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24 }]}>
        <View style={{ alignItems: 'center', marginVertical: 16 }}>
          <View style={{ backgroundColor: AppColors.success, width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Check size={44} color="#fff" />
          </View>
          <Text style={[styles.title, { marginTop: 16 }]}>Workout Complete</Text>
          <Text style={styles.muted}>{session.label}</Text>
        </View>
        <Card>
          <StatRow label="Duration" value={`${s.durationMin} min`} />
          <StatRow label="Exercises completed" value={`${s.exercisesCompleted}/${s.exercisesTotal}`} />
          {s.exercisesSkipped > 0 && <StatRow label="Exercises skipped" value={`${s.exercisesSkipped}`} accent="warning" />}
          <StatRow label="Sets completed" value={`${s.setsCompleted}/${s.setsTotal}`} />
          {s.cardioCount > 0 && <StatRow label="Cardio" value={`${s.cardioCompleted}/${s.cardioCount}`} />}
          {s.substitutionsCount > 0 && <StatRow label="Substitutions" value={`${s.substitutionsCount}`} />}
        </Card>
        <View style={{ height: 16 }} />
        {!summary && <PrimaryButton label="Finish & Save" onPress={finalize} />}
        {summary && <PrimaryButton label="Done" onPress={() => router.replace('/(tabs)')} />}
      </ScrollView>
    );
  }

  // Default (shouldn't normally reach here): offer finish/discard.
  return (
    <View style={[styles.screen, { justifyContent: 'center', padding: 24 }]}>
      <Card>
        <Text style={styles.h2}>Finish this workout?</Text>
        <View style={{ height: 16 }} />
        <PrimaryButton label="Finish & Save" onPress={finalize} />
        <View style={{ height: 12 }} />
        <DangerButton label="Discard" onPress={async () => { await discardActive(); router.replace('/(tabs)'); }} />
      </Card>
    </View>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: 'warning' }) {
  return (
    <View style={[styles.rowBetween, { paddingVertical: 8 }]}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={[styles.h3, accent === 'warning' ? { color: AppColors.warning } : undefined]}>{value}</Text>
    </View>
  );
}
