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
}
