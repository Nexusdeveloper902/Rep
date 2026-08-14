import type { ProgramDocument } from '@/domain/program/schema';
import type { Session, SessionItem, WorkoutSummary } from '@/domain/workout/sessionTypes';

export interface IProgramRepository {
  getActive(): Promise<ProgramDocument | null>;
  setActive(doc: ProgramDocument): Promise<void>;
  listAll(): Promise<{ id: string; name: string; isActive: boolean }[]>;
  getById(id: string): Promise<ProgramDocument | null>;
  remove(id: string): Promise<void>;
}

export interface SessionRecord {
  id: string;
  programId: string;
  workoutId: string;
  isExtra: boolean;
  label: string;
  date: string;
  startTime: number;
  endTime?: number;
  state: string;
  summary?: WorkoutSummary;
}

export interface SetLogRecord {
  sessionId: string;
  exerciseId: string;
  setIndex: number;
  weight?: number;
  reps: number;
  rpe?: number;
  notes?: string;
  timestamp: number;
}

export interface ExerciseVolume {
  exerciseId: string;
  /** Total volume (sum of weight × reps) in kg across all logged sessions. */
  volumeKg: number;
  /** Number of sessions this exercise appeared in. */
  sessionCount: number;
  /** Best estimated 1RM (Epley) across all sets, in kg. */
  bestEst1rmKg: number;
}

export interface WorkoutStats {
  /** Total completed (non-discarded) sessions. */
  totalSessions: number;
  /** Total sets logged. */
  totalSets: number;
  /** Total training volume (weight × reps) in kg. */
  totalVolumeKg: number;
  /** Total cardio minutes logged. */
  totalCardioMin: number;
  /** Current streak: consecutive days (ending today or yesterday) with a completed session. */
  currentStreak: number;
  /** Longest streak ever (days). */
  longestStreak: number;
  /** Per-exercise aggregates, ordered by volume descending. */
  exercises: ExerciseVolume[];
}

export interface ISessionRepository {
  /** Persist full active session JSON for resume. Called on every mutation. */
  saveActiveState(session: Session): Promise<void>;
  getActiveState(): Promise<Session | null>;
  clearActiveState(sessionId: string): Promise<void>;
  /** Commit a finished session to permanent history. */
  saveCompleted(session: Session, summary: WorkoutSummary): Promise<void>;
  listCompleted(): Promise<SessionRecord[]>;
  getCompleted(sessionId: string): Promise<{ record: SessionRecord; items: SessionItem[] } | null>;
  /** Previous performance: most recent set logs for an exercise across sessions. */
  previousPerformance(exerciseId: string): Promise<SetLogRecord[]>;
  /** Best-ever set for an exercise (highest weight×reps), for PR detection. */
  bestSet(exerciseId: string): Promise<SetLogRecord | null>;
  /** Aggregate stats across all completed sessions (for the analytics view). */
  stats(): Promise<WorkoutStats>;
  /** Wipe all session history and any active session, but never programs. */
  wipeHistory(): Promise<void>;
}
