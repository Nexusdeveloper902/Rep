import type { ProgramDocument } from '@/domain/program/schema';
import { DAYS_OF_WEEK } from '@/domain/program/schema';

export function getDayKey(date = new Date()): (typeof DAYS_OF_WEEK)[number] {
  // JS: 0=Sunday. Our week starts Monday.
  const js = date.getDay();
  const idx = js === 0 ? 6 : js - 1;
  return DAYS_OF_WEEK[idx];
}

export function getTodayISO(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function getWorkoutForDay(doc: ProgramDocument, day: (typeof DAYS_OF_WEEK)[number]) {
  const id = doc.schedule[day];
  if (!id) return null;
  return doc.workouts.find((w) => w.id === id) ?? null;
}

export function getTodayWorkout(doc: ProgramDocument, date = new Date()) {
  return getWorkoutForDay(doc, getDayKey(date));
}

export function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.round(totalSec % 60);
  if (m === 0) return `${s}s`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.round(totalSec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function friendlyDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
