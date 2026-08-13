import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronRight } from 'lucide-react-native';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { repos } from '@/lib/repositories';
import { Card, Pill, SecondaryButton } from '@/components/ui';
import { styles, AppColors } from '@/components/styles';
import { friendlyDate } from '@/lib/datetime';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const records = useHistoryStore((s) => s.records);
  const loadHistory = useHistoryStore((s) => s.loadHistory);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof repos.sessions.getCompleted>>>(null);

  useEffect(() => { loadHistory(); }, [loadHistory]);

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
                <Text style={styles.body}>Set {cs.setIndex + 1}: {cs.weight ? `${cs.weight}kg × ` : ''}{cs.reps} reps</Text>
                {cs.rpe && <Text style={styles.muted}>RPE {cs.rpe}</Text>}
              </View>
            ))}
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
