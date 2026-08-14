/** SQLite schema definitions. Program stored as a single validated JSON blob;
 *  history stored relationally (sessions / set_logs / cardio_logs) for clean querying. */

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  json TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL,
  workout_id TEXT NOT NULL,
  is_extra INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  date_iso TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  state TEXT NOT NULL,
  summary_json TEXT
);

-- Full active-session JSON for crash-safe resume (updated on every engine mutation).
CREATE TABLE IF NOT EXISTS session_state (
  session_id TEXT PRIMARY KEY,
  json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Rich per-set logs for previous performance + future progression (§37).
-- setMode extension columns (hold_sec, distance_km, load_kg, duration_sec,
-- each_side, set_mode) are added by MIGRATION_SQL for pre-existing databases.
CREATE TABLE IF NOT EXISTS set_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  set_index INTEGER NOT NULL,
  weight REAL,
  reps INTEGER NOT NULL,
  rpe REAL,
  notes TEXT,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cardio_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  duration_min REAL,
  distance REAL,
  intensity TEXT,
  hr INTEGER,
  notes TEXT,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
`;

/**
 * Additive migrations for the setMode extension. Each ALTER adds a nullable
 * column, so it is safe to run against an existing database (created before the
 * timed/distance set modes existed) and is a no-op for fresh databases after the
 * columns already exist. SQLite has no IF NOT EXISTS for ADD COLUMN, so the
 * absence of a column is detected via pragma before running each statement.
 */
export const MIGRATION_SQL = `
ALTER TABLE set_logs ADD COLUMN hold_sec REAL;
ALTER TABLE set_logs ADD COLUMN distance_km REAL;
ALTER TABLE set_logs add COLUMN load_kg REAL;
ALTER TABLE set_logs ADD COLUMN duration_sec REAL;
ALTER TABLE set_logs ADD COLUMN each_side INTEGER;
ALTER TABLE set_logs ADD COLUMN set_mode TEXT;
`;

export interface ProgramRow {
  id: string;
  name: string;
  json: string;
  is_active: number;
  created_at: number;
}

export interface SessionRow {
  id: string;
  program_id: string;
  workout_id: string;
  is_extra: number;
  label: string;
  date_iso: string;
  start_time: number;
  end_time: number | null;
  state: string;
  summary_json: string | null;
}

export interface SetLogRow {
  id: number;
  session_id: string;
  exercise_id: string;
  set_index: number;
  weight: number | null;
  reps: number;
  rpe: number | null;
  notes: string | null;
  hold_sec: number | null;
  distance_km: number | null;
  load_kg: number | null;
  duration_sec: number | null;
  each_side: number | null;
  set_mode: string | null;
  timestamp: number;
}

export interface CardioLogRow {
  id: number;
  session_id: string;
  item_id: string;
  duration_min: number | null;
  distance: number | null;
  intensity: string | null;
  hr: number | null;
  notes: string | null;
  timestamp: number;
}
