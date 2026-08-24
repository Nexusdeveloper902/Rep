import type { ProgramDocument } from '@/domain/program/schema';
import type { Session, SessionItem, WorkoutSummary } from '@/domain/workout/sessionTypes';
import { computeStats, bestSetFor } from '@/domain/workout/stats';
import type { IProgramRepository, ISessionRepository, SessionRecord, SetLogRecord, WorkoutStats } from './types';

/**
 * In-memory repository implementations. Used in tests and as the default in this
 * sandbox (the SQLite-backed equivalents live in sqliteRepositories.ts for runtime).
 * Swap by injecting the SQLite implementations in stores at app boot.
 */

export class InMemoryProgramRepository implements IProgramRepository {
  private store = new Map<string, { doc: ProgramDocument; isActive: boolean; createdAt: number }>();

  async getActive(): Promise<ProgramDocument | null> {
    for (const v of this.store.values()) if (v.isActive) return v.doc;
    return null;
  }
  async setActive(doc: ProgramDocument): Promise<void> {
    for (const v of this.store.values()) v.isActive = false;
    const existing = this.store.get(doc.program.id);
    if (existing) {
      existing.doc = doc;
      existing.isActive = true;
    } else {
      this.store.set(doc.program.id, { doc, isActive: true, createdAt: Date.now() });
    }
  }
  async listAll() {
    return Array.from(this.store.values()).map((v) => ({ id: v.doc.program.id, name: v.doc.program.name, isActive: v.isActive }));
  }
  async getById(id: string) {
    return this.store.get(id)?.doc ?? null;
  }
  async remove(id: string) {
    this.store.delete(id);
  }
}

interface CompletedSessionRecord {
  record: SessionRecord;
  items: SessionItem[];
  setLogs: SetLogRecord[];
}

export class InMemorySessionRepository implements ISessionRepository {
  private active: Session | null = null;
  private completed = new Map<string, CompletedSessionRecord>();

  async saveActiveState(session: Session): Promise<void> {
    this.active = JSON.parse(JSON.stringify(session));
  }
  async getActiveState(): Promise<Session | null> {
    return this.active ? JSON.parse(JSON.stringify(this.active)) : null;
  }
  async clearActiveState(): Promise<void> {
    this.active = null;
  }
  async saveCompleted(session: Session, summary: WorkoutSummary): Promise<void> {
    const setLogs: SetLogRecord[] = [];
    for (const item of session.items) {
      for (const cs of item.completedSets) {
        setLogs.push({
          sessionId: session.id,
          exerciseId: item.exerciseId ?? '',
          setIndex: cs.setIndex,
          weight: cs.weight,
          reps: cs.reps,
          rpe: cs.rpe,
          notes: cs.notes,
          holdSec: cs.holdSec,
          distanceKm: cs.distanceKm,
          loadKg: cs.loadKg,
          durationSec: cs.durationSec,
          eachSide: cs.eachSide,
          setMode: item.setMode,
          timestamp: cs.timestamp,
        });
      }
    }
    const record: SessionRecord = {
      id: session.id,
      programId: session.programId,
      workoutId: session.workoutId,
      isExtra: session.isExtra,
      label: session.label,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      state: session.state,
      summary,
    };
    this.completed.set(session.id, { record, items: JSON.parse(JSON.stringify(session.items)), setLogs });
    this.active = null;
  }
  async listCompleted(): Promise<SessionRecord[]> {
    return Array.from(this.completed.values())
      .map((c) => c.record)
      .sort((a, b) => (b.startTime - a.startTime));
  }
  async getCompleted(sessionId: string) {
    const c = this.completed.get(sessionId);
    return c ? { record: c.record, items: c.items } : null;
  }
  async previousPerformance(exerciseId: string): Promise<SetLogRecord[]> {
    // Most recent session first, sets in order.
    const sessions = Array.from(this.completed.values()).sort((a, b) => b.record.startTime - a.record.startTime);
    for (const s of sessions) {
      const logs = s.setLogs.filter((l) => l.exerciseId === exerciseId);
      if (logs.length > 0) return logs;
    }
    return [];
  }
  async bestSet(exerciseId: string): Promise<SetLogRecord | null> {
    const all: SetLogRecord[] = [];
    for (const s of this.completed.values()) {
      if (s.record.state !== 'WorkoutComplete') continue;
      all.push(...s.setLogs.filter((l) => l.exerciseId === exerciseId));
    }
    return bestSetFor(all);
  }
  async stats(): Promise<WorkoutStats> {
    const records = Array.from(this.completed.values()).map((c) => c.record);
    const allLogs: SetLogRecord[] = [];
    let cardioMin = 0;
    for (const c of this.completed.values()) {
      if (c.record.state !== 'WorkoutComplete') continue;
      allLogs.push(...c.setLogs);
      for (const item of c.items) {
        if (item.kind === 'cardio' && item.cardioActual?.actualDurationMin) {
          cardioMin += item.cardioActual.actualDurationMin;
        }
      }
    }
    return computeStats(records, allLogs, cardioMin);
  }
  async wipeHistory(): Promise<void> {
    this.completed.clear();
    this.active = null;
  }
}
