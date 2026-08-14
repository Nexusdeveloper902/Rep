import {
  est1rmKg,
  setVolumeKg,
  streaks,
  computeStats,
  bestSetFor,
} from '@/domain/workout/stats';
import type { SessionRecord, SetLogRecord } from '@/database/repositories/types';

function rec(id: string, date: string, state = 'WorkoutComplete'): SessionRecord {
  return {
    id, programId: 'p', workoutId: 'w', isExtra: false, label: 'L',
    date, startTime: new Date(date + 'T10:00:00').getTime(), state,
    summary: undefined,
  };
}
function log(sessionId: string, exerciseId: string, weight: number | undefined, reps: number, setIndex = 0): SetLogRecord {
  return { sessionId, exerciseId, setIndex, weight, reps, timestamp: Date.now() };
}

describe('stats: est1rmKg', () => {
  it('returns weight for a single rep', () => {
    expect(est1rmKg(100, 1)).toBe(100);
  });
  it('applies Epley for higher reps', () => {
    // 100 * (1 + 5/30) = 116.67
    expect(est1rmKg(100, 5)).toBeCloseTo(116.67, 1);
  });
  it('returns 0 when no weight', () => {
    expect(est1rmKg(undefined, 8)).toBe(0);
    expect(est1rmKg(0, 8)).toBe(0);
  });
});

describe('stats: setVolumeKg', () => {
  it('multiplies weight by reps', () => {
    expect(setVolumeKg(100, 5)).toBe(500);
  });
  it('treats missing weight as 0', () => {
    expect(setVolumeKg(undefined, 10)).toBe(0);
  });
});

describe('stats: streaks', () => {
  it('returns zero for empty', () => {
    expect(streaks(new Set())).toEqual({ current: 0, longest: 0 });
  });

  it('counts a current streak ending today', () => {
    const today = new Date();
    const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const y = new Date(new Date(iso + 'T00:00:00').getTime() - 86400000).toISOString().slice(0, 10);
    const { current, longest } = streaks(new Set([y, iso]));
    expect(current).toBe(2);
    expect(longest).toBe(2);
  });

  it('resets current to 0 when last workout was 2+ days ago', () => {
    const dates = new Set(['2026-01-01', '2026-01-02']);
    const { current } = streaks(dates);
    expect(current).toBe(0);
  });

  it('finds the longest run inside a sparse history', () => {
    const dates = new Set(['2026-01-01', '2026-01-03', '2026-01-04', '2026-01-05', '2026-01-09']);
    const { longest } = streaks(dates);
    expect(longest).toBe(3); // 03→04→05
  });
});

describe('stats: computeStats', () => {
  it('aggregates volume, sets, sessions, exercises and ignores discarded', () => {
    const records = [
      rec('s1', '2026-01-01'),
      rec('s2', '2026-01-02'),
      rec('s3', '2026-01-02', 'Discarded'),
    ];
    const logs = [
      log('s1', 'bench', 60, 8, 0),
      log('s1', 'bench', 62.5, 8, 1),
      log('s2', 'bench', 65, 5, 0),
      log('s3', 'bench', 999, 1, 0), // discarded — must be excluded
    ];
    const stats = computeStats(records, logs, 20);

    expect(stats.totalSessions).toBe(2);
    expect(stats.totalSets).toBe(3);
    // 60*8 + 62.5*8 + 65*5 = 480 + 500 + 325 = 1305
    expect(stats.totalVolumeKg).toBeCloseTo(1305, 2);
    expect(stats.totalCardioMin).toBe(20);
    expect(stats.exercises).toHaveLength(1);
    expect(stats.exercises[0].exerciseId).toBe('bench');
    expect(stats.exercises[0].sessionCount).toBe(2);
  });

  it('orders exercises by volume descending', () => {
    const records = [rec('s1', '2026-01-01')];
    const logs = [
      log('s1', 'squat', 100, 5), // 500
      log('s1', 'curl', 10, 12),  // 120
    ];
    const stats = computeStats(records, logs, 0);
    expect(stats.exercises[0].exerciseId).toBe('squat');
    expect(stats.exercises[1].exerciseId).toBe('curl');
  });
});

describe('stats: bestSetFor', () => {
  it('returns null for no logs', () => {
    expect(bestSetFor([])).toBeNull();
  });
  it('picks the set with the highest estimated 1RM', () => {
    const logs = [
      log('s1', 'bench', 60, 10), // e1rm 80
      log('s1', 'bench', 100, 1), // e1rm 100
      log('s1', 'bench', 80, 5),  // e1rm 93.3
    ];
    const best = bestSetFor(logs);
    expect(best?.weight).toBe(100);
    expect(best?.reps).toBe(1);
  });
});
