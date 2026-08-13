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
