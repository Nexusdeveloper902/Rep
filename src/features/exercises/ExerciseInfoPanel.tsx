import { ScrollView, Text, View, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import type { ExerciseMeta } from '@/domain/program/schema';
import { Pill } from '@/components/ui';
import { styles, AppColors } from '@/components/styles';

/** Reusable exercise metadata sheet. Openable anytime during a workout and from overview. */
export function ExerciseInfoPanel({ exercise, onClose }: { exercise: ExerciseMeta; onClose?: () => void }) {
  return (
    <ScrollView>
      <View style={[styles.rowBetween, { marginBottom: 8 }]}>
        <Text style={styles.title}>{exercise.name}</Text>
        {onClose && (
          <Pressable onPress={onClose}><X size={26} color={AppColors.textMuted} /></Pressable>
        )}
      </View>
      {exercise.description ? <Text style={styles.body}>{exercise.description}</Text> : null}
      {exercise.equipment && <Text style={[styles.muted, { marginTop: 4 }]}>Equipment: {exercise.equipment}</Text>}
      {exercise.difficulty && <Text style={styles.muted}>Difficulty: {exercise.difficulty}</Text>}
      {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
        <View style={[styles.row, { flexWrap: 'wrap', gap: 6, marginVertical: 8 }]}>
          {exercise.targetMuscles.map((m) => <Pill key={m} text={m} />)}
        </View>
      )}
      {exercise.instructions?.length ? (
        <>
          <Text style={[styles.h3, { marginTop: 12 }]}>Instructions</Text>
          {exercise.instructions.map((s, i) => <Text key={i} style={[styles.body, { marginTop: 4 }]}>{i + 1}. {s}</Text>)}
        </>
      ) : null}
      {exercise.commonMistakes?.length ? (
        <>
          <Text style={[styles.h3, { marginTop: 12 }]}>Common Mistakes</Text>
          {exercise.commonMistakes.map((s, i) => <Text key={i} style={[styles.muted, { marginTop: 4 }]}>· {s}</Text>)}
        </>
      ) : null}
      {exercise.tips?.length ? (
        <>
          <Text style={[styles.h3, { marginTop: 12 }]}>Tips</Text>
          {exercise.tips.map((s, i) => <Text key={i} style={[styles.body, { marginTop: 4 }]}>· {s}</Text>)}
        </>
      ) : null}
      {exercise.alternatives?.length ? (
        <>
          <Text style={[styles.h3, { marginTop: 12 }]}>Alternatives</Text>
          {exercise.alternatives.map((a) => <Text key={a} style={[styles.muted, { marginTop: 4 }]}>· {a}</Text>)}
        </>
      ) : null}
    </ScrollView>
  );
}
