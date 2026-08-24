import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronRight } from 'lucide-react-native';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { usePreferencesStore } from '@/stores/usePreferencesStore';
import { repos } from '@/lib/repositories';
import { formatWeight } from '@/lib/units';
import { completedSetLabel } from '@/features/sessions/ActiveWorkout';
import { Card, Pill, SecondaryButton } from '@/components/ui';
import { styles, AppColors } from '@/components/styles';
import { friendlyDate } from '@/lib/datetime';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const records = useHistoryStore((s) => s.records);
  const loadHistory = useHistoryStore((s) => s.loadHistory);
  const stats = useHistoryStore((s) => s.stats);
  const loadStats = useHistoryStore((s) => s.loadStats);
  const units = usePreferencesStore((s) => s.units);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof repos.sessions.getCompleted>>>(null);

  useEffect(() => { loadHistory(); loadStats(); }, [loadHistory, loadStats]);

  useEffect(() => {
    if (detailId) repos.sessions.getCompleted(detailId).then(setDetail);
    else setDetail(null);
  }, [detailId]);

  if (detail && detailId) {
    const { record, items } = detail;
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>{record.label}</Text>
        <View style={[styles.row, { gap: 8, marginVertical: 8 }]}>
          <Pill text={friendlyDate(record.date)} />
          {record.isExtra && <Pill text="Extra" color={AppColors.primary} />}
          {record.summary && <Pill text={`${record.summary.durationMin} min`} />}
        </View>
        <Text style={[styles.h2, { marginTop: 8 }]}>Sets</Text>
        {items.map((item) => (
          <Card key={item.id}>
            <Text style={styles.h3}>{item.label ?? item.exerciseId}</Text>
            {item.completedSets.map((cs, i) => (
              <View key={i} style={[styles.rowBetween, { paddingVertical: 4 }]}>
                <Text style={styles.body}>Set {cs.setIndex + 1}: {completedSetLabel(cs, units)}</Text>
                {cs.rpe ? <Text style={styles.muted}>RPE {cs.rpe}</Text> : null}
              </View>
            ))}
            {item.completedSets.some((cs) => cs.notes) && (
              <View style={{ marginTop: 6 }}>
                {item.completedSets.filter((cs) => cs.notes).map((cs, i) => (
                  <Text key={i} style={[styles.muted, { marginTop: 2 }]}>Note (set {cs.setIndex + 1}): {cs.notes}</Text>
                ))}
              </View>
            )}
          </Card>
        ))}
        {record.summary && record.summary.exercisesSkipped > 0 && (
          <Card><Text style={[styles.h3, { color: AppColors.warning }]}>Skipped: {record.summary.exercisesSkipped}</Text></Card>
        )}
        <View style={{ height: 16 }} />
        <SecondaryButton label="Back" onPress={() => setDetailId(null)} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>History</Text>

      {/* Analytics summary */}
      {stats && stats.totalSessions > 0 && (
        <>
          <Text style={[styles.h2, { marginTop: 12 }]}>Overview</Text>
          <Card>
            <View style={[styles.row, { flexWrap: 'wrap', gap: 8 }]}>
              <Pill text={`${stats.totalSessions} workouts`} color={AppColors.primary} />
              <Pill text={`${stats.totalSets} sets`} />
              <Pill text={`${formatWeight(stats.totalVolumeKg, units)} volume`} />
              {stats.totalCardioMin > 0 && <Pill text={`${Math.round(stats.totalCardioMin)} min cardio`} color={AppColors.danger} />}
              <Pill text={`${stats.currentStreak} day streak`} color={AppColors.accent} />
              <Pill text={`best ${stats.longestStreak}d`} />
            </View>
          </Card>

          {stats.exercises.length > 0 && (
            <>
              <Text style={[styles.h2, { marginTop: 12 }]}>Top Exercises</Text>
              {stats.exercises.slice(0, 6).map((e) => (
                <Card key={e.exerciseId}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.h3}>{e.exerciseId}</Text>
                    <Text style={styles.muted}>{e.sessionCount}×</Text>
                  </View>
                  <View style={[styles.row, { gap: 8, marginTop: 6, flexWrap: 'wrap' }]}>
                    <Pill text={`${formatWeight(e.volumeKg, units)} volume`} />
                    {e.bestEst1rmKg > 0 && <Pill text={`est 1RM ${formatWeight(e.bestEst1rmKg, units)}`} color={AppColors.primary} />}
                  </View>
                </Card>
              ))}
            </>
          )}
        </>
      )}

      <Text style={[styles.h2, { marginTop: 12 }]}>Workouts</Text>
      {records.length === 0 && (
        <Card><Text style={styles.body}>No completed workouts yet. Finish a session to see it here.</Text></Card>
      )}
      {records.map((r) => (
        <Pressable key={r.id} style={styles.card} onPress={() => setDetailId(r.id)}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.h3}>{r.label}</Text>
              <Text style={styles.muted}>{friendlyDate(r.date)} · {r.summary ? `${r.summary.durationMin}m` : ''}</Text>
            </View>
            <View style={[styles.row, { gap: 8 }]}>
              {r.isExtra && <Pill text="Extra" color={AppColors.primary} />}
              {r.summary && r.summary.exercisesSkipped > 0 && <Pill text={`${r.summary.exercisesSkipped} skipped`} color={AppColors.warning} />}
              <ChevronRight size={20} color={AppColors.textMuted} />
            </View>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
