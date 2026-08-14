import type { ExerciseWorkoutItem, CardioWorkoutItem, SetMode } from '@/domain/program/schema';

/** Session lifecycle states (§32 — must be a state machine). */
export type SessionState =
  | 'NotStarted'
  | 'Active'
  | 'Resting'
  | 'WaitingForEquipment'
  | 'ExerciseComplete'
  | 'WorkoutComplete'
  | 'Paused'
  | 'Discarded';

/** Per-item lifecycle within a session. */
export type SessionItemStatus = 'pending' | 'inProgress' | 'completed' | 'skipped' | 'waiting';

/**
 * A completed set record. Rich data for future progression/PRs (§37).
 * The fields populated depend on the parent item's `setMode`:
 *  - `'reps'`     → `weight` + `reps` (+ optional `rpe`).
 *  - `'timed'`    → `holdSec` (+ optional `loadKg`, `rpe`). `reps` may be 0.
 *  - `'distance'` → `distanceKm` + `loadKg` + `durationSec`.
 */
export interface CompletedSet {
  setIndex: number;
  weight?: number;
  reps?: number;
  rpe?: number;
  notes?: string;
  /** Hold duration in seconds (timed mode). */
  holdSec?: number;
  /** Distance covered in km (distance mode). */
  distanceKm?: number;
  /** Carried/external load in kg (timed weighted-hold or distance carry). */
  loadKg?: number;
  /** Time taken in seconds (distance mode). */
  durationSec?: number;
  /** Performed each side (timed unilateral holds). */
  eachSide?: boolean;
  timestamp: number;
}

/** Captured cardio actuals (distinct from planned fields). */
export interface CardioActual {
  actualDurationMin?: number;
  actualDistance?: number;
  actualIntensity?: string;
  actualHr?: number;
  actualNotes?: string;
}

/** Substitution mapping: planned exercise was performed as a different exercise. */
export interface SubstitutionMap {
  [plannedExerciseId: string]: string;
}

/** One flattened session item derived from a workout item. */
export interface SessionItem {
  /** Stable id within the session (workoutItemId or superset-exercise composite). */
  id: string;
  kind: 'exercise' | 'superset' | 'cardio';
  /** Reference back to the parent workout item (or sub-exercise).
   *  For substituted exercises this is the *performed* id; the original is
   *  retained in `plannedExerciseId`. */
  exerciseId?: string;
  /** Original planned exercise id, set when a substitution occurred (§14). */
  plannedExerciseId?: string;
  label?: string;
  status: SessionItemStatus;
  /** Planned sets (from program, immutable). */
  plannedSets: ExerciseWorkoutItem['sets'];
  restSec?: number;
  notes?: string;
  equipment?: string;
  /** Completed sets for this item, in order. */
  completedSets: CompletedSet[];
  /** Cardio planned fields + actuals. */
  cardio?: CardioWorkoutItem;
  cardioActual?: CardioActual;
  /** Superset grouping metadata. */
  supersetId?: string;
  supersetName?: string;
  supersetRounds?: number;
  /** 0-indexed round this item slot represents (expanded). */
  supersetRound?: number;
  /** For skipped items awaiting equipment. */
  skipReason?: string;
  /** Measurement mode for this item's sets (defaults to 'reps'). */
  setMode?: SetMode;
}

export interface Session {
  id: string;
  programId: string;
  workoutId: string;
  isExtra: boolean;
  label: string;
  date: string; // ISO date (YYYY-MM-DD)
  startTime: number;
  endTime?: number;
  state: SessionState;
  items: SessionItem[];
  substitutions: SubstitutionMap;
  /** Pointer to current top-level item (0-indexed). */
  currentItemIndex: number;
  /** Current set within the current exercise item (0-indexed). */
  currentSetIndex: number;
  /** Current superset round (1-indexed, mirrors plan). */
  currentSupersetRound: number;
  /** Active rest end timestamp (ms epoch) when state === 'Resting'. */
  restEndsAt?: number;
  restDurationSec?: number;
  /** IDs of items skipped due to unavailable equipment. */
  waitingItemIds: string[];
}

/** Actions dispatched into the pure engine. */
export type SessionAction =
  | { type: 'START' }
  | {
      type: 'COMPLETE_SET';
      weight?: number;
      reps?: number;
      rpe?: number;
      notes?: string;
      holdSec?: number;
      distanceKm?: number;
      loadKg?: number;
      durationSec?: number;
      eachSide?: boolean;
    }
  | { type: 'SKIP_EXERCISE'; reason?: string }
  | { type: 'MARK_EQUIPMENT_UNAVAILABLE'; reason?: string }
  | { type: 'MARK_EQUIPMENT_AVAILABLE' }
  | { type: 'RESUME_EXERCISE'; itemId: string }
  | { type: 'SUBSTITUTE_EXERCISE'; exerciseId: string; performedExerciseId: string }
  | { type: 'COMPLETE_CARDIO'; actual: CardioActual }
  | { type: 'START_REST'; durationSec: number }
  | { type: 'SKIP_REST' }
  | { type: 'ADJUST_REST'; deltaSec: number }
  | { type: 'COMPLETE_EXERCISE' }
  | { type: 'FINISH_WORKOUT' }
  | { type: 'DISCARD_SESSION' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' };

/** Result of finishing a workout — aggregate counts for history/completion (§40). */
export interface WorkoutSummary {
  durationMin: number;
  exercisesTotal: number;
  exercisesCompleted: number;
  exercisesSkipped: number;
  setsTotal: number;
  setsCompleted: number;
  cardioCount: number;
  cardioCompleted: number;
  substitutionsCount: number;
}
