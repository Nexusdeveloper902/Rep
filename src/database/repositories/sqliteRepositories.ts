import * as SQLite from 'expo-sqlite';
import type { ProgramDocument } from '@/domain/program/schema';
import type { Session, SessionItem, WorkoutSummary } from '@/domain/workout/sessionTypes';
import type { IProgramRepository, ISessionRepository, SessionRecord, SetLogRecord } from './types';
import { SCHEMA_SQL } from '@/database/schema';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('gym_companion.db').then(async (db) => {
      await db.execAsync(SCHEMA_SQL);
      return db;
    });
  }
  return dbPromise;
}

export class SQLiteProgramRepository implements IProgramRepository {
  async getActive(): Promise<ProgramDocument | null> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ json: string }>('SELECT json FROM programs WHERE is_active = 1 LIMIT 1');
    if (rows.length === 0) return null;
    return JSON.parse(rows[0].json) as ProgramDocument;
  }
  async setActive(doc: ProgramDocument): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE programs SET is_active = 0');
    await db.runAsync(
      'INSERT INTO programs (id, name, json, is_active, created_at) VALUES (?, ?, ?, 1, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, json=excluded.json, is_active=1',
      doc.program.id,
      doc.program.name,
      JSON.stringify(doc),
      Date.now(),
    );
  }
  async listAll() {
    const db = await getDb();
    const rows = await db.getAllAsync<{ id: string; name: string; is_active: number }>('SELECT id, name, is_active FROM programs ORDER BY created_at DESC');
    return rows.map((r) => ({ id: r.id, name: r.name, isActive: r.is_active === 1 }));
  }
  async getById(id: string) {
    const db = await getDb();
    const rows = await db.getAllAsync<{ json: string }>('SELECT json FROM programs WHERE id = ?', id);
    return rows.length ? (JSON.parse(rows[0].json) as ProgramDocument) : null;
  }
  async remove(id: string) {
    const db = await getDb();
    await db.runAsync('DELETE FROM programs WHERE id = ?', id);
  }
}

export class SQLiteSessionRepository implements ISessionRepository {
  async saveActiveState(session: Session): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO sessions (id, program_id, workout_id, is_extra, label, date_iso, start_time, state) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state',
      session.id, session.programId, session.workoutId, session.isExtra ? 1 : 0, session.label, session.date, session.startTime, session.state,
    );
    await db.runAsync(
      'INSERT INTO session_state (session_id, json, updated_at) VALUES (?, ?, ?) ON CONFLICT(session_id) DO UPDATE SET json=excluded.json, updated_at=excluded.updated_at',
      session.id, JSON.stringify(session), Date.now(),
    );
  }
  async getActiveState(): Promise<Session | null> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ json: string }>(
      `SELECT ss.json FROM session_state ss JOIN sessions s ON s.id = ss.session_id
       WHERE s.state IN ('Active','Resting','WaitingForEquipment','Paused') ORDER BY ss.updated_at DESC LIMIT 1`,
    );
    if (rows.length === 0) return null;
    return JSON.parse(rows[0].json) as Session;
  }
  async clearActiveState(sessionId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM session_state WHERE session_id = ?', sessionId);
  }
  async saveCompleted(session: Session, summary: WorkoutSummary): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO sessions (id, program_id, workout_id, is_extra, label, date_iso, start_time, end_time, state, summary_json)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET end_time=excluded.end_time, state=excluded.state, summary_json=excluded.summary_json`,
      session.id, session.programId, session.workoutId, session.isExtra ? 1 : 0, session.label, session.date, session.startTime, session.endTime ?? Date.now(), session.state, JSON.stringify(summary),
    );
    for (const item of session.items) {
      for (const cs of item.completedSets) {
        await db.runAsync(
          'INSERT INTO set_logs (session_id, exercise_id, set_index, weight, reps, rpe, notes, timestamp) VALUES (?,?,?,?,?,?,?,?)',
          session.id, item.exerciseId ?? '', cs.setIndex, cs.weight ?? null, cs.reps, cs.rpe ?? null, cs.notes ?? null, cs.timestamp,
        );
      }
      if (item.kind === 'cardio' && item.cardioActual) {
        const a = item.cardioActual;
        await db.runAsync(
          'INSERT INTO cardio_logs (session_id, item_id, duration_min, distance, intensity, hr, notes, timestamp) VALUES (?,?,?,?,?,?,?,?)',
          session.id, item.id, a.actualDurationMin ?? null, a.actualDistance ?? null, a.actualIntensity ?? null, a.actualHr ?? null, a.actualNotes ?? null, Date.now(),
        );
      }
    }
    await db.runAsync('DELETE FROM session_state WHERE session_id = ?', session.id);
  }
  async listCompleted(): Promise<SessionRecord[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>('SELECT * FROM sessions WHERE state IN (\'WorkoutComplete\',\'Discarded\') ORDER BY start_time DESC');
    return rows.map((r) => ({
      id: r.id, programId: r.program_id, workoutId: r.workout_id, isExtra: r.is_extra === 1, label: r.label, date: r.date_iso, startTime: r.start_time, endTime: r.end_time ?? undefined, state: r.state, summary: r.summary_json ? JSON.parse(r.summary_json) : undefined,
    }));
  }
  async getCompleted(sessionId: string) {
    const db = await getDb();
    const srows = await db.getAllAsync<any>('SELECT * FROM sessions WHERE id = ?', sessionId);
    if (srows.length === 0) return null;
    const r = srows[0];
    // Reconstruct items from set_logs. (We store summary; full item history reconstructed from logs.)
    const setRows = await db.getAllAsync<any>('SELECT * FROM set_logs WHERE session_id = ? ORDER BY timestamp', sessionId);
    const items: SessionItem[] = [];
    const byExercise = new Map<string, SessionItem>();
    for (const sl of setRows) {
      let item = byExercise.get(sl.exercise_id);
      if (!item) {
        item = { id: sl.exercise_id, kind: 'exercise', exerciseId: sl.exercise_id, status: 'completed', plannedSets: [], completedSets: [] } as SessionItem;
        byExercise.set(sl.exercise_id, item);
        items.push(item);
      }
      item.completedSets.push({ setIndex: sl.set_index, weight: sl.weight ?? undefined, reps: sl.reps, rpe: sl.rpe ?? undefined, notes: sl.notes ?? undefined, timestamp: sl.timestamp });
    }
    const record: SessionRecord = {
      id: r.id, programId: r.program_id, workoutId: r.workout_id, isExtra: r.is_extra === 1, label: r.label, date: r.date_iso, startTime: r.start_time, endTime: r.end_time ?? undefined, state: r.state, summary: r.summary_json ? JSON.parse(r.summary_json) : undefined,
    };
    return { record, items };
  }
  async previousPerformance(exerciseId: string): Promise<SetLogRecord[]> {
    const db = await getDb();
    const sessionRow = await db.getAllAsync<{ session_id: string }>(
      `SELECT s.id as session_id FROM sessions s JOIN set_logs l ON l.session_id = s.id
       WHERE l.exercise_id = ? AND s.state = 'WorkoutComplete' ORDER BY s.start_time DESC LIMIT 1`,
      exerciseId,
    );
    if (sessionRow.length === 0) return [];
    const sid = sessionRow[0].session_id;
    const rows = await db.getAllAsync<any>('SELECT * FROM set_logs WHERE session_id = ? AND exercise_id = ? ORDER BY set_index', sid, exerciseId);
    return rows.map((r) => ({
      sessionId: r.session_id, exerciseId: r.exercise_id, setIndex: r.set_index, weight: r.weight ?? undefined, reps: r.reps, rpe: r.rpe ?? undefined, notes: r.notes ?? undefined, timestamp: r.timestamp,
    }));
  }
}
