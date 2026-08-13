import type { Workout, WorkoutItem } from '@/domain/program/schema';
import type {
  Session,
  SessionItem,
  SessionAction,
  WorkoutSummary,
  CompletedSet,
  CardioActual,
} from './sessionTypes';

/** Pure workout engine. No React Native imports. All functions return new sessions. */

let idCounter = 0;
function genId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function expandItem(item: WorkoutItem): SessionItem[] {
  if (item.type === 'exercise') {
    return [
      {
        id: item.id ?? genId('item'),
        kind: 'exercise',
        exerciseId: item.exerciseId,
        status: 'pending',
        plannedSets: item.sets,
        restSec: item.restSec,
        notes: item.notes,
        completedSets: [],
      } as SessionItem,
    ];
  }
  if (item.type === 'cardio') {
    return [
      {
        id: item.id,
        kind: 'cardio',
        exerciseId: item.id,
        status: 'pending',
        plannedSets: [],
        cardio: item,
        cardioActual: {},
        completedSets: [],
      } as SessionItem,
    ];
  }
  // superset: expand into rounds × exercises, preserving order round-major.
  const items: SessionItem[] = [];
  for (let round = 1; round <= item.rounds; round++) {
    for (let i = 0; i < item.exercises.length; i++) {
      const ex = item.exercises[i];
      items.push({
        id: `${item.id}-r${round}-e${i}`,
        kind: 'exercise',
        exerciseId: ex.exerciseId,
        label: `${item.name ?? 'Superset'} · Round ${round}`,
        status: 'pending',
        plannedSets: ex.sets,
        restSec: ex.restSec ?? item.restSec,
        supersetId: item.id,
        supersetName: item.name,
        supersetRounds: item.rounds,
        supersetRound: round,
        completedSets: [],
      });
    }
  }
  return items;
}

/** Create a fresh Session from a program's workout. */
export function startSession(
  programId: string,
  workout: Workout,
  opts: { isExtra?: boolean; label?: string; date?: string } = {},
): Session {
  const items: SessionItem[] = [];
  for (const item of workout.items) {
    items.push(...expandItem(item));
  }
  return {
    id: genId('session'),
    programId,
    workoutId: workout.id,
    isExtra: opts.isExtra ?? false,
    label: opts.label ?? workout.name,
    date: opts.date ?? todayISODate(),
    startTime: Date.now(),
    state: 'Active',
    items,
    substitutions: {},
    currentItemIndex: 0,
    currentSetIndex: 0,
    currentSupersetRound: 1,
    waitingItemIds: [],
  };
}

/** Are all non-skipped items done? */
function allDone(session: Session): boolean {
  return session.items.every((it) => it.status === 'completed' || it.status === 'skipped');
}

/** Advance pointer to the next actionable item, accounting for waiting queue & superset rounds. */
export function advance(session: Session): Session {
  let idx = session.currentItemIndex;
  let setIdx = session.currentSetIndex;
  const items = session.items;

  while (idx < items.length) {
    const item = items[idx];
    if (item.status === 'completed' || item.status === 'skipped') {
      idx++;
      setIdx = 0;
      continue;
    }
    if (item.status === 'waiting') {
      // Don't auto-land on a waiting item; jump past it.
      idx++;
      setIdx = 0;
      continue;
    }
    break;
  }

  if (idx >= items.length) {
    // Anything still waiting? Keep session active so user can resume them.
    if (session.waitingItemIds.length > 0) {
      return { ...session, currentItemIndex: idx, currentSetIndex: 0, state: 'WaitingForEquipment' };
    }
    if (allDone(session)) {
      return { ...session, state: 'WorkoutComplete', endTime: Date.now(), currentItemIndex: idx, currentSetIndex: 0 };
    }
    return { ...session, currentItemIndex: idx, currentSetIndex: 0, state: 'Active' };
  }

  const target = items[idx];
  return {
    ...session,
    currentItemIndex: idx,
    currentSetIndex: setIdx,
    currentSupersetRound: target.supersetRound ?? 1,
    state: 'Active',
  };
}

function clone(session: Session): Session {
  return {
    ...session,
    items: session.items.map((i) => ({ ...i, completedSets: [...i.completedSets] })),
    substitutions: { ...session.substitutions },
    waitingItemIds: [...session.waitingItemIds],
  };
}

function completeResistanceSet(
  s: Session,
  item: SessionItem,
  payload: { weight?: number; reps: number; rpe?: number; notes?: string },
): Session {
  const setIndex = s.currentSetIndex;
  const completed: CompletedSet = {
    setIndex,
    weight: payload.weight,
    reps: payload.reps,
    rpe: payload.rpe,
    notes: payload.notes,
    timestamp: Date.now(),
  };
  item.completedSets = [...item.completedSets, completed];
  const nextSet = setIndex + 1;

  if (nextSet < item.plannedSets.length) {
    // More sets for this item — start rest then come back to next set.
    const withRest = item.restSec ? startRest(s, item.restSec) : s;
    return { ...withRest, currentSetIndex: nextSet, state: withRest.state === 'Resting' ? 'Resting' : 'Active' };
  }
  // All sets done for this item → complete it.
  item.status = 'completed';
  const advanced = advance({ ...s, currentSetIndex: 0 });
  if (item.restSec && advanced.state !== 'WorkoutComplete') {
    return startRest(advanced, item.restSec);
  }
  return advanced;
}

function startRest(s: Session, durationSec: number): Session {
  return {
    ...s,
    state: 'Resting',
    restEndsAt: Date.now() + durationSec * 1000,
    restDurationSec: durationSec,
  };
}

/** Reduce the engine by applying one action. Pure: returns a new Session. */
export function reduce(session: Session, action: SessionAction): Session {
  const s = clone(session);
  switch (action.type) {
    case 'START':
      return advance({ ...s, state: 'Active' });

    case 'COMPLETE_SET': {
      const item = s.items[s.currentItemIndex];
      if (!item || (item.status !== 'inProgress' && item.status !== 'pending')) return s;
      if (item.kind !== 'exercise') return s;
      if (item.status === 'pending') item.status = 'inProgress';
      return completeResistanceSet(s, item, action);
    }

    case 'COMPLETE_CARDIO': {
      const item = s.items[s.currentItemIndex];
      if (!item || item.kind !== 'cardio') return s;
      item.cardioActual = action.actual;
      item.status = 'completed';
      return advance({ ...s, currentSetIndex: 0 });
    }

    case 'COMPLETE_EXERCISE': {
      const item = s.items[s.currentItemIndex];
      if (!item || item.kind !== 'exercise') return s;
      item.status = 'completed';
      return advance({ ...s, currentSetIndex: 0 });
    }

    case 'SKIP_EXERCISE': {
      const item = s.items[s.currentItemIndex];
      if (!item) return s;
      item.status = 'skipped';
      item.skipReason = action.reason;
      return advance({ ...s, currentSetIndex: 0 });
    }

    case 'MARK_EQUIPMENT_UNAVAILABLE': {
      const item = s.items[s.currentItemIndex];
      if (!item) return s;
      item.status = 'waiting';
      item.skipReason = action.reason ?? 'Equipment unavailable';
      if (!s.waitingItemIds.includes(item.id)) s.waitingItemIds.push(item.id);
      return advance({ ...s, currentSetIndex: 0, state: s.waitingItemIds.length > 0 ? 'WaitingForEquipment' : s.state });
    }

    case 'MARK_EQUIPMENT_AVAILABLE': {
      // Mark all waiting items back to pending; pointer handled by RESUME.
      for (const it of s.items) {
        if (it.status === 'waiting') it.status = 'pending';
      }
      return advance({ ...s, waitingItemIds: [], currentSetIndex: 0 });
    }

    case 'RESUME_EXERCISE': {
      const item = s.items.find((i) => i.id === action.itemId);
      if (!item || item.status !== 'waiting') return s;
      item.status = 'inProgress';
      const idx = s.items.indexOf(item);
      s.waitingItemIds = s.waitingItemIds.filter((id) => id !== action.itemId);
      return { ...s, currentItemIndex: idx, currentSetIndex: item.completedSets.length, state: 'Active' };
    }

    case 'SUBSTITUTE_EXERCISE': {
      const item = s.items.find((i) => i.id === s.items[s.currentItemIndex]?.id);
      if (!item) return s;
      item.exerciseId = action.performedExerciseId;
      s.substitutions[action.exerciseId] = action.performedExerciseId;
      return s;
    }

    case 'START_REST':
      return startRest(s, action.durationSec);

    case 'SKIP_REST': {
      const advanced = advance({ ...s, restEndsAt: undefined, restDurationSec: undefined, state: 'Active' });
      return advanced;
    }

    case 'ADJUST_REST': {
      if (!s.restEndsAt) return s;
      const newEnd = s.restEndsAt + action.deltaSec * 1000;
      return { ...s, restEndsAt: newEnd, restDurationSec: (s.restDurationSec ?? 0) + action.deltaSec };
    }

    case 'FINISH_WORKOUT':
      return { ...s, state: 'WorkoutComplete', endTime: Date.now() };

    case 'DISCARD_SESSION':
      return { ...s, state: 'Discarded', endTime: Date.now() };

    case 'PAUSE':
      return { ...s, state: 'Paused' };

    case 'RESUME': {
      // If a rest was in progress, restEndsAt stays absolute; otherwise just go Active.
      if (s.state === 'Paused' && s.restEndsAt && s.restEndsAt > Date.now()) {
        return { ...s, state: 'Resting' };
      }
      return advance({ ...s, state: 'Active' });
    }

    default:
      return s;
  }
}

/** Compute aggregate summary from a completed (or in-progress) session. */
export function summarize(session: Session): WorkoutSummary {
  const exerciseItems = session.items.filter((i) => i.kind === 'exercise');
  const cardioItems = session.items.filter((i) => i.kind === 'cardio');
  const setsTotal = exerciseItems.reduce((sum, i) => sum + i.plannedSets.length, 0);
  const setsCompleted = exerciseItems.reduce((sum, i) => sum + i.completedSets.length, 0);
  const end = session.endTime ?? Date.now();
  return {
    durationMin: Math.max(1, Math.round((end - session.startTime) / 60000)),
    exercisesTotal: exerciseItems.length,
    exercisesCompleted: exerciseItems.filter((i) => i.status === 'completed').length,
    exercisesSkipped: exerciseItems.filter((i) => i.status === 'skipped').length,
    setsTotal,
    setsCompleted,
    cardioCount: cardioItems.length,
    cardioCompleted: cardioItems.filter((i) => i.status === 'completed').length,
    substitutionsCount: Object.keys(session.substitutions).length,
  };
}

export type { CardioActual };
export { startRest };
