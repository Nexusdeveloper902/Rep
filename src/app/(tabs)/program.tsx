import { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProgramStore } from '@/stores/useProgramStore';
import { pickAndValidateProgram } from '@/services/json/importService';
import { DAYS_OF_WEEK } from '@/domain/program/schema';
import { Card, PrimaryButton, SecondaryButton, Pill } from '@/components/ui';
import { styles } from '@/components/styles';

const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

export default function ProgramScreen() {
  const insets = useSafeAreaInsets();
  const program = useProgramStore((s) => s.program);
  const confirmImport = useProgramStore((s) => s.confirmImportProgram);
  const exportActive = useProgramStore((s) => s.exportActiveProgram);
  const [busy, setBusy] = useState(false);

  const doImport = async () => {
    setBusy(true);
    const preview = await pickAndValidateProgram();
    setBusy(false);
    if (!preview.ok || !preview.program) {
      Alert.alert('Import failed', preview.errors.join('\n'));
      return;
    }
    const stats = preview.stats!;
    Alert.alert(
      'Import program?',
      `${stats.programName}\n${stats.workoutCount} workouts · ${stats.exerciseCount} exercises\nScheduled: ${stats.scheduledDays.join(', ')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: async () => {
            await confirmImport(preview.program!);
            Alert.alert('Imported', 'Program is now active.');
          },
        },
      ],
    );
  };

  const doExport = async () => {
    try {
      await exportActive();
    } catch (e) {
      Alert.alert('Export failed', (e as Error).message);
    }
  };

  if (!program) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.body}>No program loaded.</Text>
        <PrimaryButton label="Import JSON" onPress={doImport} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>{program.program.name}</Text>
      {program.program.description ? <Text style={styles.muted}>{program.program.description}</Text> : null}

      <View style={{ height: 16 }} />
      <View style={[styles.row, { gap: 12 }]}>
        <View style={{ flex: 1 }}>
          <PrimaryButton label="Import JSON" onPress={doImport} />
        </View>
        <View style={{ flex: 1 }}>
          <SecondaryButton label={busy ? 'Working…' : 'Export JSON'} onPress={doExport} />
        </View>
      </View>
      <Text style={[styles.muted, { marginTop: 8 }]}>Import a program from a .json file, or export the current one. Export never includes your workout history.</Text>

      <Text style={[styles.h2, { marginTop: 16 }]}>Weekly Schedule</Text>
      <Card>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          {DAYS_OF_WEEK.map((d) => {
            const wid = program.schedule[d];
            return (
              <View key={d} style={{ alignItems: 'center', flex: 1 }}>
                <Text style={styles.muted}>{DAY_LABELS[d]}</Text>
                <Text style={[styles.h3, { fontSize: 12, textAlign: 'center' }]}>{wid ? program.workouts.find((w) => w.id === wid)?.name?.split(' ')[0] ?? '•' : 'Rest'}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      <Text style={[styles.h2, { marginTop: 12 }]}>Workouts ({program.workouts.length})</Text>
      {program.workouts.map((w) => (
        <Card key={w.id}>
          <Text style={styles.h3}>{w.name}</Text>
          <Text style={styles.muted}>{w.items.length} items{w.estimatedDurationMin ? ` · ~${w.estimatedDurationMin}m` : ''}</Text>
        </Card>
      ))}

      <Text style={[styles.h2, { marginTop: 12 }]}>Exercise Library ({program.exercises.length})</Text>
      <View style={[styles.row, { flexWrap: 'wrap', gap: 6 }]}>
        {program.exercises.map((e) => <Pill key={e.id} text={e.name} />)}
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
