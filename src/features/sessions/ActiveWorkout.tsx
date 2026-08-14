import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check, ChevronLeft, Info, AlertTriangle, Heart, Repeat, Pause, Play } from 'lucide-react-native';
import { useSessionStore } from '@/stores/useSessionStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { useProgramStore } from '@/stores/useProgramStore';
import { usePreferencesStore } from '@/stores/usePreferencesStore';
import { RestTimer } from '@/services/timers/RestTimer';
import { formatClock } from '@/lib/datetime';
import { formatWeight, parseWeightToKg, unitLabel } from '@/lib/units';
import { est1rmKg } from '@/domain/workout/stats';
import { Card, PrimaryButton, SecondaryButton, DangerButton, Pill } from '@/components/ui';
import { styles, AppColors } from '@/components/styles';
import type { SessionItem } from '@/domain/workout/sessionTypes';
import type { SetLogRecord } from '@/database/repositories/types';
import type { ExerciseMeta } from '@/domain/program/schema';

const timer = new RestTimer();

export default function ActiveWorkout() {
  const insets = useSafeAreaInsets();
  const session = useSessionStore((s) => s.session);
  const dispatch = useSessionStore((s) => s.dispatch);
  const program = useProgramStore((s) => s.program);
  const previousPerformance = useHistoryStore((s) => s.previousPerformance);
  const bestSet = useHistoryStore((s) => s.bestSet);
  const units = usePreferencesStore((s) => s.units);

  const [restRemaining, setRestRemaining] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [prevPerf, setPrevPerf] = useState<SetLogRecord[]>([]);
  const [prevBest, setPrevBest] = useState<SetLogRecord | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [setNotes, setSetNotes] = useState('');
  const [showWaiting, setShowWaiting] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [gateDismissed, setGateDismissed] = useState(false);
  const [showSubstitute, setShowSubstitute] = useState(false);
  const [cardioDuration, setCardioDuration] = useState('');
  const [cardioDistance, setCardioDistance] = useState('');

  const item = session ? session.items[session.currentItemIndex] : null;
  const exercise = item?.exerciseId ? program?.exercises.find((e) => e.id === item.exerciseId) : undefined;
  const plannedExercise = item?.plannedExerciseId
    ? program?.exercises.find((e) => e.id === item.plannedExerciseId)
    : undefined;
  const isSubstituted = !!item?.plannedExerciseId && item.plannedExerciseId !== item.exerciseId;

  useEffect(() => {
    const unsub = timer.subscribe((r) => setRestRemaining(r));
    const done = timer.onDone(() => {
      // auto-skip rest when it hits zero
      dispatch({ type: 'SKIP_REST' });
    });
    return () => { unsub(); done(); };
  }, [dispatch]);

  // Sync timer with engine rest state.
  useEffect(() => {
    if (!session) return;
    if (session.state === 'Resting' && session.restEndsAt) {
      const remaining = Math.max(0, Math.ceil((session.restEndsAt - Date.now()) / 1000));
      if (!timer.isRunning) timer.start(remaining);
    } else if (session.state !== 'Resting') {
      timer.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.state, session?.restEndsAt]);

  // Load previous performance + PR for the current exercise, reset per-item inputs.
  useEffect(() => {
    if (item?.exerciseId) {
      previousPerformance(item.exerciseId).then(setPrevPerf);
      bestSet(item.exerciseId).then(setPrevBest);
    } else {
      setPrevPerf([]);
      setPrevBest(null);
    }
    setWeight('');
    setReps('');
    setRpe('');
    setSetNotes('');
    setCardioDuration('');
    setCardioDistance('');
  }, [item?.exerciseId, item?.id, previousPerformance, bestSet]);

  // Reset gate dismissal when the current item changes.
  useEffect(() => { setGateDismissed(false); }, [session?.currentItemIndex]);

  if (!session || !item) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.body}>No active session.</Text>
        <View style={{ height: 12 }} />
        <SecondaryButton label="Back to Home" onPress={() => router.replace('/(tabs)')} />
      </View>
    );
  }

  const totalExercises = session.items.filter((i) => i.kind === 'exercise').length;
  const completedExercises = session.items.filter((i) => i.kind === 'exercise' && i.status === 'completed').length;
  const isCardio = item.kind === 'cardio';
  const isSupersetSlot = !!item.supersetId;

  const onCompleteSet = () => {
    const repsNum = parseInt(reps || (item.plannedSets[session.currentSetIndex]?.reps as string) || '0', 10) || 0;
    const wNum = parseWeightToKg(weight, units);
    const rpeNum = rpe ? parseInt(rpe, 10) : undefined;
    dispatch({ type: 'COMPLETE_SET', reps: repsNum, weight: wNum, rpe: rpeNum, notes: setNotes.trim() || undefined });
    setWeight(''); setReps(''); setRpe(''); setSetNotes('');
  };

  const onCardioComplete = () => {
    const actual = {
      actualDurationMin: cardioDuration ? parseFloat(cardioDuration) : item.cardio?.durationMin,
      actualDistance: cardioDistance ? parseFloat(cardioDistance) : undefined,
    };
    dispatch({ type: 'COMPLETE_CARDIO', actual });
  };

  const onSubstitute = (performedExerciseId: string) => {
    const planned = item.plannedExerciseId ?? item.exerciseId ?? '';
    dispatch({ type: 'SUBSTITUTE_EXERCISE', exerciseId: planned, performedExerciseId });
    setShowSubstitute(false);
    setGateDismissed(false);
  };

  const skipRest = () => { dispatch({ type: 'SKIP_REST' }); };
  const adjustRest = (d: number) => { timer.adjust(d); dispatch({ type: 'ADJUST_REST', deltaSec: d }); };

  const showEquipmentGate =
    !isCardio && item.status === 'pending' && !!exercise?.equipment && session.state === 'Active' && !gateDismissed;

  if (session.state === 'WorkoutComplete') {
    router.replace('/workout/complete');
    return null;
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80, paddingTop: insets.top + 8 }}>
        {/* Header */}
        <View style={[styles.rowBetween, { marginBottom: 8 }]}>
          <Pressable onPress={() => router.replace('/workout/complete?discard=1')}>
            <ChevronLeft size={26} color={AppColors.textMuted} />
          </Pressable>
          <Text style={styles.muted}>Exercise {completedExercises} of {totalExercises}</Text>
          {session.state === 'Paused' ? (
            <Pressable onPress={() => dispatch({ type: 'RESUME' })}><Play size={24} color={AppColors.primary} /></Pressable>
          ) : (
            <Pressable onPress={() => dispatch({ type: 'PAUSE' })}><Pause size={24} color={AppColors.textMuted} /></Pressable>
          )}
        </View>
        <Text style={styles.h2}>{session.label}</Text>

        {/* Superset banner */}
        {isSupersetSlot && (
          <View style={[styles.pill, { alignSelf: 'flex-start', marginVertical: 8, backgroundColor: 'rgba(59,130,246,0.18)' }]}>
            <Text style={[styles.pillText, { color: AppColors.primary }]}>
              SUPERSET {item.supersetName ?? ''} · Round {item.supersetRound}/{item.supersetRounds}
            </Text>
          </View>
        )}

        {/* Progress */}
        {!isCardio ? (
          <Card>
            <View style={styles.rowBetween}>
              <Text style={styles.h3}>Set {session.currentSetIndex + 1} of {item.plannedSets.length}</Text>
              {item.completedSets.length > 0 && <Pill text={`${item.completedSets.length} done`} color={AppColors.success} />}
            </View>
          </Card>
        ) : (
          <Card>
            <View style={styles.rowBetween}>
              <Text style={styles.h3}>Cardio</Text>
              {item.cardio?.durationMin && <Pill text={`Planned ${item.cardio.durationMin} min`} color={AppColors.danger} />}
            </View>
          </Card>
        )}

        {/* Exercise card */}
        <Card>
          <View style={[styles.rowBetween, { marginBottom: 6 }]}>
            <Text style={[styles.title, { fontSize: 26, flex: 1 }]}>{exercise?.name ?? item.label ?? 'Exercise'}</Text>
            {exercise && <Pressable onPress={() => setShowInfo(true)}><Info size={22} color={AppColors.primary} /></Pressable>}
          </View>
          {isSubstituted && plannedExercise && (
            <View style={[styles.row, { gap: 6, marginBottom: 6 }]}>
              <Pill text={`Planned: ${plannedExercise.name}`} color={AppColors.warning} />
              <Pill text={`Performed: ${exercise?.name ?? item.exerciseId}`} color={AppColors.success} />
            </View>
          )}
          {exercise?.targetMuscles && (
            <View style={[styles.row, { flexWrap: 'wrap', gap: 6, marginBottom: 6 }]}>
              {exercise.targetMuscles.map((m) => <Pill key={m} text={m} />)}
            </View>
          )}

          {/* Previous performance + PR (no fake data) */}
          {prevPerf.length > 0 && (
            <View style={{ marginVertical: 8 }}>
              <Text style={styles.muted}>Last time:</Text>
              <Text style={styles.body}>
                {prevPerf.map((l, i) => `${l.weight ? `${formatWeight(l.weight, units)} × ` : ''}${l.reps}`).join('  ·  ')}
              </Text>
            </View>
          )}
          {prevBest && prevBest.weight && (
            <View style={[styles.row, { gap: 6, marginVertical: 6, flexWrap: 'wrap' }]}>
              <Pill text={`PR ${formatWeight(prevBest.weight, units)} × ${prevBest.reps}`} color={AppColors.accent} />
              <Pill text={`est 1RM ${formatWeight(est1rmKg(prevBest.weight, prevBest.reps), units)}`} color={AppColors.primary} />
            </View>
          )}

          {isCardio ? (
            <CardioView
              item={item}
              duration={cardioDuration}
              distance={cardioDistance}
              onDuration={setCardioDuration}
              onDistance={setCardioDistance}
              onComplete={onCardioComplete}
            />
          ) : (
            <View>
              {/* Set list */}
              <View style={{ marginVertical: 8 }}>
                {item.plannedSets.map((s, i) => {
                  const done = i < item.completedSets.length;
                  return (
                    <View key={i} style={[styles.rowBetween, { paddingVertical: 6 }]}>
                      <Text style={done ? styles.muted : styles.body}>Set {i + 1}: {s.reps} reps{s.rpe ? ` @ RPE ${s.rpe}` : ''}</Text>
                      {done && <Check size={18} color={AppColors.success} />}
                    </View>
                  );
                })}
              </View>

              {/* Current set inputs */}
              {showEquipmentGate ? (
                <EquipmentGate
                  equipment={exercise!.equipment!}
                  canSubstitute={hasAlternatives(exercise)}
                  onAvailable={() => setGateDismissed(true)}
                  onUnavailable={(reason) => dispatch({ type: 'MARK_EQUIPMENT_UNAVAILABLE', reason })}
                  onSkip={() => setConfirmSkip(true)}
                  onChooseAlternative={() => setShowSubstitute(true)}
                />
              ) : (
                <View>
                  <View style={[styles.row, { gap: 10, marginBottom: 10 }]}>
                    <TextInput style={styles.input} placeholder={`Weight (${unitLabel(units)})`} placeholderTextColor={AppColors.textMuted} keyboardType="numeric" value={weight} onChangeText={setWeight} />
                    <TextInput style={styles.input} placeholder="Reps" placeholderTextColor={AppColors.textMuted} keyboardType="numeric" value={reps} onChangeText={setReps} />
                    <TextInput style={[styles.input, { flex: 0.7 }]} placeholder="RPE" placeholderTextColor={AppColors.textMuted} keyboardType="numeric" value={rpe} onChangeText={setRpe} />
                  </View>
                  <TextInput
                    style={[styles.input, { marginBottom: 12 }]}
                    placeholder="Set notes (optional)"
                    placeholderTextColor={AppColors.textMuted}
                    value={setNotes}
                    onChangeText={setSetNotes}
                    multiline
                  />
                  {session.state === 'Paused' && (
                    <PrimaryButton label="Resume Workout" onPress={() => dispatch({ type: 'RESUME' })} />
                  )}
                  {session.state !== 'Paused' && (
                    <PrimaryButton label="Complete Set" onPress={onCompleteSet} />
                  )}
                  <View style={{ height: 10 }} />
                  <View style={[styles.row, { gap: 10 }]}>
                    <View style={{ flex: 1 }}><SecondaryButton label="Skip Exercise" onPress={() => setConfirmSkip(true)} /></View>
                    {hasAlternatives(exercise) ? (
                      <View style={{ flex: 1 }}><SecondaryButton label="Substitute" onPress={() => setShowSubstitute(true)} /></View>
                    ) : <View style={{ flex: 1 }} />}
                  </View>
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Waiting queue panel */}
        {session.waitingItemIds.length > 0 && (
          <Pressable style={styles.card} onPress={() => setShowWaiting(true)}>
            <View style={styles.rowBetween}>
              <View style={styles.row}>
                <AlertTriangle size={20} color={AppColors.warning} />
                <Text style={[styles.h3, { marginLeft: 10 }]}>{session.waitingItemIds.length} waiting</Text>
              </View>
              <Text style={styles.muted}>Tap to resume</Text>
            </View>
          </Pressable>
        )}
      </ScrollView>

      {/* Paused overlay */}
      {session.state === 'Paused' && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11,18,32,0.85)', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Pause size={56} color={AppColors.primary} />
          <Text style={[styles.title, { marginTop: 16 }]}>Paused</Text>
          <Text style={[styles.muted, { marginTop: 8, textAlign: 'center' }]}>Your progress is saved. Resume whenever you're ready.</Text>
          <View style={{ height: 20 }} />
          <PrimaryButton label="Resume Workout" onPress={() => dispatch({ type: 'RESUME' })} />
        </View>
      )}

      {/* Rest overlay */}
      {session.state === 'Resting' && (
        <RestOverlay remaining={restRemaining} onSkip={skipRest} onAdjust={adjustRest} />
      )}

      {/* Exercise info sheet */}
      <Modal visible={showInfo} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: AppColors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' }}>
            {exercise && <ExerciseInfoSheet exercise={exercise} onClose={() => setShowInfo(false)} />}
          </View>
        </View>
      </Modal>

      {/* Waiting queue sheet */}
      <Modal visible={showWaiting} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: AppColors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' }}>
            <WaitingQueue
              session={session}
              onResume={(id) => { dispatch({ type: 'RESUME_EXERCISE', itemId: id }); setShowWaiting(false); }}
              onClose={() => setShowWaiting(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Skip confirmation */}
      <Modal visible={confirmSkip} animationType="fade" transparent>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 32 }}>
          <View style={{ backgroundColor: AppColors.surface, borderRadius: 20, padding: 24, width: '100%' }}>
            <Text style={styles.h2}>Skip this exercise?</Text>
            <Text style={[styles.muted, { marginVertical: 12 }]}>You can resume it later from the waiting queue.</Text>
            <View style={[styles.row, { gap: 10 }]}>
              <View style={{ flex: 1 }}><SecondaryButton label="Cancel" onPress={() => setConfirmSkip(false)} /></View>
              <View style={{ flex: 1 }}><DangerButton label="Skip" onPress={() => { dispatch({ type: 'SKIP_EXERCISE' }); setConfirmSkip(false); }} /></View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Substitute exercise sheet */}
      <Modal visible={showSubstitute} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: AppColors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' }}>
            <SubstituteSheet
              plannedName={plannedExercise?.name ?? exercise?.name ?? item.label ?? 'Exercise'}
              alternatives={resolveAlternatives(exercise, program?.exercises ?? [])}
              onPick={onSubstitute}
              onClose={() => setShowSubstitute(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function CardioView({ item, duration, distance, onDuration, onDistance, onComplete }: {
  item: SessionItem;
  duration: string;
  distance: string;
  onDuration: (v: string) => void;
  onDistance: (v: string) => void;
  onComplete: () => void;
}) {
  const c = item.cardio;
  return (
    <View style={{ marginVertical: 8 }}>
      <View style={styles.rowBetween}>
        <View style={styles.row}><Heart size={18} color={AppColors.danger} /><Text style={[styles.body, { marginLeft: 8 }]}>{c?.cardioType}</Text></View>
      </View>
      <Text style={styles.muted}>
        Planned: {c?.durationMin ? `${c.durationMin} min` : ''} {c?.distance ? `· ${c.distance} km` : ''} {c?.intensity ? `· ${c.intensity}` : ''}
      </Text>
      {c?.incline != null && <Text style={styles.muted}>Incline: {c.incline}%</Text>}
      {c?.speed != null && <Text style={styles.muted}>Speed: {c.speed} km/h</Text>}
      {c?.notes ? <Text style={styles.muted}>{c.notes}</Text> : null}

      <Text style={[styles.h3, { marginTop: 12 }]}>Record actuals</Text>
      <View style={[styles.row, { gap: 10, marginVertical: 8 }]}>
        <TextInput
          style={styles.input}
          placeholder={c?.durationMin ? `Duration (${c.durationMin} min)` : 'Duration (min)'}
          placeholderTextColor={AppColors.textMuted}
          keyboardType="numeric"
          value={duration}
          onChangeText={onDuration}
        />
        <TextInput
          style={styles.input}
          placeholder={c?.distance ? `Distance (${c.distance} km)` : 'Distance (km)'}
          placeholderTextColor={AppColors.textMuted}
          keyboardType="numeric"
          value={distance}
          onChangeText={onDistance}
        />
      </View>
      <View style={{ height: 12 }} />
      <PrimaryButton label="Complete Cardio" onPress={onComplete} />
    </View>
  );
}

function EquipmentGate({ equipment, canSubstitute, onAvailable, onUnavailable, onSkip, onChooseAlternative }: {
  equipment: string;
  canSubstitute: boolean;
  onAvailable: () => void;
  onUnavailable: (reason?: string) => void;
  onSkip: () => void;
  onChooseAlternative: () => void;
}) {
  return (
    <View style={{ marginVertical: 8 }}>
      <Text style={styles.body}>Is the <Text style={{ fontWeight: '700' }}>{equipment}</Text> available?</Text>
      <View style={{ height: 12 }} />
      <PrimaryButton label="Available" onPress={onAvailable} />
      <View style={{ height: 10 }} />
      <SecondaryButton label="Occupied — Skip for Now" onPress={() => onUnavailable('Equipment occupied')} />
      {canSubstitute && (
        <>
          <View style={{ height: 10 }} />
          <SecondaryButton label="Choose Alternative" onPress={onChooseAlternative} />
        </>
      )}
      <View style={{ height: 10 }} />
      <SecondaryButton label="Skip Exercise" onPress={onSkip} />
    </View>
  );
}

/** Resolve an exercise's `alternatives` ids to metadata objects. */
function resolveAlternatives(exercise: ExerciseMeta | undefined, library: ExerciseMeta[]): ExerciseMeta[] {
  const ids = exercise?.alternatives ?? [];
  return ids.map((id) => library.find((e) => e.id === id)).filter((e): e is ExerciseMeta => !!e);
}

function hasAlternatives(exercise: ExerciseMeta | undefined): boolean {
  return !!exercise?.alternatives && exercise.alternatives.length > 0;
}

function SubstituteSheet({ plannedName, alternatives, onPick, onClose }: {
  plannedName: string;
  alternatives: ExerciseMeta[];
  onPick: (performedExerciseId: string) => void;
  onClose: () => void;
}) {
  return (
    <View>
      <View style={styles.rowBetween}>
        <Text style={styles.h2}>Substitute Exercise</Text>
        <Pressable onPress={onClose}><ChevronLeft size={24} color={AppColors.textMuted} /></Pressable>
      </View>
      <Text style={[styles.muted, { marginVertical: 8 }]}>
        Planned: <Text style={{ fontWeight: '700', color: AppColors.text }}>{plannedName}</Text>. Choose an alternative — the substitution is recorded for this session only and never edits your program.
      </Text>
      {alternatives.length === 0 ? (
        <Text style={styles.body}>No alternatives defined for this exercise.</Text>
      ) : (
        alternatives.map((alt) => (
          <Card key={alt.id}>
            <View style={[styles.rowBetween, { marginBottom: 4 }]}>
              <Text style={styles.h3}>{alt.name}</Text>
              <Repeat size={18} color={AppColors.primary} />
            </View>
            {alt.equipment && <Text style={styles.muted}>{alt.equipment}</Text>}
            {alt.targetMuscles && alt.targetMuscles.length > 0 && (
              <View style={[styles.row, { flexWrap: 'wrap', gap: 6, marginTop: 6 }]}>
                {alt.targetMuscles.map((m) => <Pill key={m} text={m} />)}
              </View>
            )}
            <View style={{ height: 10 }} />
            <PrimaryButton label="Use This" onPress={() => onPick(alt.id)} />
          </Card>
        ))
      )}
      <View style={{ height: 8 }} />
      <SecondaryButton label="Cancel" onPress={onClose} />
    </View>
  );
}

function RestOverlay({ remaining, onSkip, onAdjust }: { remaining: number; onSkip: () => void; onAdjust: (d: number) => void }) {
  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: AppColors.surfaceElevated, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
      <Text style={[styles.muted, { textAlign: 'center' }]}>REST</Text>
      <Text style={[styles.bigNumber, { textAlign: 'center', fontSize: 56, marginVertical: 8 }]}>{formatClock(remaining)}</Text>
      <View style={[styles.row, { justifyContent: 'center', gap: 12 }]}>
        <Pressable onPress={() => onAdjust(-30)} style={styles.secondaryBtn}><Text style={styles.secondaryBtnText}>−30s</Text></Pressable>
        <Pressable onPress={() => onAdjust(30)} style={styles.secondaryBtn}><Text style={styles.secondaryBtnText}>+30s</Text></Pressable>
        <Pressable onPress={onSkip} style={[styles.primaryBtn, { minWidth: 100 }]}><Text style={styles.primaryBtnText}>Skip</Text></Pressable>
      </View>
    </View>
  );
}

function WaitingQueue({ session, onResume, onClose }: { session: NonNullable<ReturnType<typeof useSessionStore.getState>['session']>; onResume: (id: string) => void; onClose: () => void }) {
  const waiting = session.items.filter((i) => i.status === 'waiting');
  return (
    <View>
      <View style={styles.rowBetween}>
        <Text style={styles.h2}>Waiting Queue</Text>
        <Pressable onPress={onClose}><ChevronLeft size={24} color={AppColors.textMuted} /></Pressable>
      </View>
      <Text style={styles.muted}>These exercises were skipped because equipment was unavailable.</Text>
      {waiting.map((i) => (
        <Card key={i.id}>
          <Text style={styles.h3}>{i.label ?? i.exerciseId}</Text>
          <Text style={styles.muted}>{i.skipReason}</Text>
          <View style={{ height: 10 }} />
          <View style={[styles.row, { gap: 10 }]}>
            <View style={{ flex: 1 }}><PrimaryButton label="Continue Exercise" onPress={() => onResume(i.id)} /></View>
            <View style={{ flex: 1 }}><SecondaryButton label="Keep Waiting" onPress={onClose} /></View>
          </View>
        </Card>
      ))}
      <View style={{ height: 8 }} />
      <SecondaryButton label="Close" onPress={onClose} />
    </View>
  );
}

function ExerciseInfoSheet({ exercise, onClose }: { exercise: ExerciseMeta; onClose: () => void }) {
  return (
    <ScrollView>
      <View style={styles.rowBetween}>
        <Text style={styles.title}>{exercise.name}</Text>
        <Pressable onPress={onClose}><ChevronLeft size={24} color={AppColors.textMuted} /></Pressable>
      </View>
      {exercise.description ? <Text style={[styles.body, { marginTop: 8 }]}>{exercise.description}</Text> : null}
      {exercise.equipment && <Text style={styles.muted}>Equipment: {exercise.equipment}</Text>}
      {exercise.difficulty && <Text style={styles.muted}>Difficulty: {exercise.difficulty}</Text>}
      {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
        <View style={[styles.row, { flexWrap: 'wrap', gap: 6, marginVertical: 8 }]}>
          {exercise.targetMuscles.map((m) => <Pill key={m} text={m} />)}
        </View>
      )}
      {exercise.instructions && exercise.instructions.length > 0 && (
        <>
          <Text style={[styles.h3, { marginTop: 12 }]}>Instructions</Text>
          {exercise.instructions.map((s, i) => <Text key={i} style={styles.body}>{i + 1}. {s}</Text>)}
        </>
      )}
      {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
        <>
          <Text style={[styles.h3, { marginTop: 12 }]}>Common Mistakes</Text>
          {exercise.commonMistakes.map((s, i) => <Text key={i} style={styles.muted}>· {s}</Text>)}
        </>
      )}
      {exercise.tips && exercise.tips.length > 0 && (
        <>
          <Text style={[styles.h3, { marginTop: 12 }]}>Tips</Text>
          {exercise.tips.map((s, i) => <Text key={i} style={styles.body}>· {s}</Text>)}
        </>
      )}
      {exercise.alternatives && exercise.alternatives.length > 0 && (
        <>
          <Text style={[styles.h3, { marginTop: 12 }]}>Alternatives</Text>
          {exercise.alternatives.map((a) => <Text key={a} style={styles.muted}>· {a}</Text>)}
        </>
      )}
    </ScrollView>
  );
}
