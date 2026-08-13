import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { useSessionStore } from '@/stores/useSessionStore';
import { useProgramStore } from '@/stores/useProgramStore';
import { EXTRA_TEMPLATES } from '@/features/workouts/extraTemplates';
import { Card, PrimaryButton } from '@/components/ui';
import { styles } from '@/components/styles';

export default function ExtraWorkoutScreen() {
  const insets = useSafeAreaInsets();
  const beginSession = useSessionStore((s) => s.beginSession);
  const programId = useProgramStore((s) => s.program?.program.id ?? 'extra');

  const start = (template: (typeof EXTRA_TEMPLATES)[number]) => {
    beginSession(programId, template, { isExtra: true, label: `Extra Workout — ${template.name}` });
    router.push('/workout/active');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 }]}>
      <View style={[styles.rowBetween, { marginBottom: 12 }]}>
        <Pressable onPress={() => router.back()}><ChevronLeft size={26} color="#94A3B8" /></Pressable>
        <Text style={styles.h2}>Extra Workout</Text>
        <View style={{ width: 26 }} />
      </View>
      <Text style={styles.muted}>Quick sessions for days without a scheduled workout. These are tagged as Extra in your history and never modify your program.</Text>
      {EXTRA_TEMPLATES.map((t) => (
        <Card key={t.id}>
          <View style={[styles.row, { marginBottom: 8 }]}>
            <Plus size={20} color="#3B82F6" />
            <Text style={[styles.h3, { marginLeft: 10 }]}>{t.name}</Text>
          </View>
          <Text style={styles.muted}>{t.description}</Text>
          <View style={{ height: 12 }} />
          <PrimaryButton label="Start" onPress={() => start(t)} />
        </Card>
      ))}
    </ScrollView>
  );
}
