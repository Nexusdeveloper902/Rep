import { create } from 'zustand';
import { repos } from '@/lib/repositories';
import { startSession, reduce, summarize } from '@/domain/workout/WorkoutEngine';
import type { Session, SessionAction, WorkoutSummary, CardioActual } from '@/domain/workout/sessionTypes';
import type { Workout } from '@/domain/program/schema';

interface SessionState {
  session: Session | null;
  loaded: boolean;
  loadActive: () => Promise<void>;
  beginSession: (programId: string, workout: Workout, opts?: { isExtra?: boolean; label?: string }) => Promise<void>;
  dispatch: (action: SessionAction) => Promise<void>;
  dispatchSync: (action: SessionAction) => Session | null;
  finishAndSave: () => Promise<WorkoutSummary | null>;
  discardActive: () => Promise<void>;
  substituteExercise: (plannedExerciseId: string, performedExerciseId: string) => Promise<void>;
  completeCardio: (actual: CardioActual) => Promise<void>;
  summary: () => WorkoutSummary | null;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  loaded: false,

  async loadActive() {
    const active = await repos.sessions.getActiveState();
    set({ session: active, loaded: true });
  },

  async beginSession(programId, workout, opts) {
    const session = startSession(programId, workout, opts);
    await repos.sessions.saveActiveState(session);
    set({ session });
  },

  async dispatch(action) {
    const result = get().dispatchSync(action);
    if (result) set({ session: result });
  },

  dispatchSync(action) {
    const current = get().session;
    if (!current) return null;
    const next = reduce(current, action);
    // Persist on every mutation (crash-safe resume, §25/§26).
    void repos.sessions.saveActiveState(next);
    return next;
  },

  async finishAndSave() {
    const s = get().session;
    if (!s) return null;
    const finished = reduce(s, { type: 'FINISH_WORKOUT' });
    const sum = summarize(finished);
    await repos.sessions.saveCompleted(finished, sum);
    set({ session: null });
    return sum;
  },

  async discardActive() {
    const s = get().session;
    if (s) await repos.sessions.clearActiveState(s.id);
    set({ session: null });
  },

  async substituteExercise(plannedExerciseId, performedExerciseId) {
    await get().dispatch({ type: 'SUBSTITUTE_EXERCISE', exerciseId: plannedExerciseId, performedExerciseId });
  },

  async completeCardio(actual) {
    await get().dispatch({ type: 'COMPLETE_CARDIO', actual });
  },

  summary() {
    const s = get().session;
    return s ? summarize(s) : null;
  },
}));

