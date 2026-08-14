import type { SessionRecord, SetLogRecord, ExerciseVolume, WorkoutStats } from '@/database/repositories/types';

/** Epley 1RM estimate in kg (undefined when no weight). */
export function est1rmKg(weightKg: number | undefined, reps: number): number {
  if (!weightKg || weightKg <= 0) return 0;
  if (reps <= 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

/** Volume load of a single set in kg. */
export function setVolumeKg(weightKg: number | undefined, reps: number): number {
  return (weightKg ?? 0) * reps;
}

/**
 * Aggregate raw set logs + session records into workout stats.
 * Pure function — used by both the in-memory and SQLite repository implementations
 * so the aggregation logic is identical and unit-testable.
 */
export function computeStats(
  records: SessionRecord[],
  setLogs: SetLogRecord[],
  cardioMin: number,
): WorkoutStats {
  const completed = records.filter((r) => r.state === 'WorkoutComplete');

  const byExercise = new Map<string, { volumeKg: number; sessionIds: Set<string>; best1rm: number }>();
  let totalVolume = 0;
  let totalSets = 0;

  for (const log of setLogs) {
    const rec = records.find((r) => r.id === log.sessionId);
    if (!rec || rec.state !== 'WorkoutComplete') continue;
    totalSets += 1;
    const vol = setVolumeKg(log.weight, log.reps);
    totalVolume += vol;
    const e1 = est1rmKg(log.weight, log.reps);
    const entry = byExercise.get(log.exerciseId) ?? { volumeKg: 0, sessionIds: new Set(), best1rm: 0 };
    entry.volumeKg += vol;
    entry.sessionIds.add(log.sessionId);
    if (e1 > entry.best1rm) entry.best1rm = e1;
    byExercise.set(log.exerciseId, entry);
  }

  const exercises: ExerciseVolume[] = Array.from(byExercise.entries())
    .map(([exerciseId, e]) => ({
      exerciseId,
      volumeKg: Math.round(e.volumeKg * 100) / 100,
      sessionCount: e.sessionIds.size,
      bestEst1rmKg: Math.round(e.best1rm * 100) / 100,
    }))
    .sort((a, b) => b.volumeKg - a.volumeKg);

  const dates = new Set(
    completed.map((r) => (r.date?.length === 10 ? r.date : new Date(r.startTime).toISOString().slice(0, 10))),
  );
  const { current, longest } = streaks(dates);

  return {
    totalSessions: completed.length,
    totalSets,
    totalVolumeKg: Math.round(totalVolume * 100) / 100,
    totalCardioMin: cardioMin,
    currentStreak: current,
    longestStreak: longest,
    exercises,
  };
}

/**
 * Streak calculation from a set of workout dates (YYYY-MM-DD).
 * - current: consecutive days ending today or yesterday (a workout today or yesterday
 *   keeps the streak alive; missing both resets to 0).
 * - longest: the longest run of consecutive days in the set.
 */
export function streaks(dates: Set<string>): { current: number; longest: number } {
  if (dates.size === 0) return { current: 0, longest: 0 };

  const sorted = Array.from(dates).sort();
  const dayMs = 86400000;

  // Longest: walk the sorted list counting consecutive days.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00').getTime();
    const cur = new Date(sorted[i] + 'T00:00:00').getTime();
    if (cur - prev === dayMs) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Current: count back from today.
  const today = new Date();
  const todayISO = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const yesterday = new Date(new Date(todayISO + 'T00:00:00').getTime() - dayMs).toISOString().slice(0, 10);
  const anchor = dates.has(todayISO) ? todayISO : dates.has(yesterday) ? yesterday : null;

  let current = 0;
  if (anchor) {
    let cursor = new Date(anchor + 'T00:00:00').getTime();
    while (dates.has(new Date(cursor).toISOString().slice(0, 10))) {
      current += 1;
      cursor -= dayMs;
    }
  }

  return { current, longest };
}

/** Pick the "best" set for an exercise by weight×reps, then by estimated 1RM. */
export function bestSetFor(logs: SetLogRecord[]): SetLogRecord | null {
  if (logs.length === 0) return null;
  let best = logs[0];
  let bestScore = setVolumeKg(best.weight, best.reps);
  let best1rm = est1rmKg(best.weight, best.reps);
  for (let i = 1; i < logs.length; i++) {
    const l = logs[i];
    const score = setVolumeKg(l.weight, l.reps);
    const e1 = est1rmKg(l.weight, l.reps);
    if (e1 > best1rm || (e1 === best1rm && score > bestScore)) {
      best = l;
      bestScore = score;
      best1rm = e1;
    }
  }
  return best;
}
