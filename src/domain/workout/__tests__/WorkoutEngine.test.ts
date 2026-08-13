import { startSession, reduce, summarize } from '@/domain/workout/WorkoutEngine';
import type { Workout } from '@/domain/program/schema';

const workout: Workout = {
  id: 'upper-a',
  name: 'Upper A',
  items: [
    { type: 'exercise', exerciseId: 'bench', sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }], restSec: 90 },
    {
      type: 'superset',
      id: 'ss1',
      name: 'Curl / Tri',
      rounds: 2,
      exercises: [
        { exerciseId: 'curl', sets: [{ reps: 12 }] },
        { exerciseId: 'tri', sets: [{ reps: 12 }] },
      ],
      restSec: 60,
    },
    { type: 'cardio', id: 'cardio1', cardioType: 'treadmill', durationMin: 10 },
  ],
};

describe('WorkoutEngine', () => {
  it('startSession expands exercises, superset rounds, and cardio', () => {
    const s = startSession('prog', workout);
    // 1 bench + 2 rounds × 2 exercises + 1 cardio = 6 items
    expect(s.items).toHaveLength(6);
    expect(s.items[0].kind).toBe('exercise');
    expect(s.items[1].supersetRound).toBe(1);
    expect(s.items[2].supersetRound).toBe(1);
    expect(s.items[3].supersetRound).toBe(2);
    expect(s.items[5].kind).toBe('cardio');
    expect(s.state).toBe('Active');
  });

  it('completeSet advances through sets and starts rest', () => {
    let s = startSession('prog', workout);
    s = reduce(s, { type: 'COMPLETE_SET', reps: 8, weight: 60 });
    expect(s.items[0].completedSets).toHaveLength(1);
    expect(s.state).toBe('Resting');
    expect(s.restEndsAt).toBeGreaterThan(Date.now());
    expect(s.currentSetIndex).toBe(1);
    // skip rest, complete remaining sets
    s = reduce(s, { type: 'SKIP_REST' });
    expect(s.state).toBe('Active');
    s = reduce(s, { type: 'COMPLETE_SET', reps: 8, weight: 60 });
    s = reduce(s, { type: 'SKIP_REST' });
    s = reduce(s, { type: 'COMPLETE_SET', reps: 8, weight: 60 });
    // bench fully completed → pointer advances to superset (stays pending until first set logged)
    expect(s.items[0].status).toBe('completed');
    expect(s.currentItemIndex).toBe(1);
    expect(s.items[1].status).toBe('pending');
  });

  it('superset advances through both exercises per round for all rounds', () => {
    let s = startSession('prog', workout);
    // complete bench
    for (let i = 0; i < 3; i++) {
      s = reduce(s, { type: 'COMPLETE_SET', reps: 8, weight: 60 });
      s = reduce(s, { type: 'SKIP_REST' });
    }
    // superset: 2 rounds × 2 exercises, each one set
    for (let r = 0; r < 4; r++) {
      const item = s.items[s.currentItemIndex];
      expect(item.kind).toBe('exercise');
      s = reduce(s, { type: 'COMPLETE_SET', reps: 12, weight: 20 });
      s = reduce(s, { type: 'SKIP_REST' });
    }
    expect(s.items.filter((i) => i.supersetId === 'ss1').every((i) => i.status === 'completed')).toBe(true);
  });

  it('skip exercise marks skipped and advances', () => {
    let s = startSession('prog', workout);
    s = reduce(s, { type: 'SKIP_EXERCISE', reason: 'hurts' });
    expect(s.items[0].status).toBe('skipped');
    expect(s.items[0].skipReason).toBe('hurts');
    expect(s.currentItemIndex).toBe(1);
  });

  it('equipment unavailable → waiting queue → resume continues', () => {
    let s = startSession('prog', workout);
    s = reduce(s, { type: 'MARK_EQUIPMENT_UNAVAILABLE', reason: 'rack busy' });
    expect(s.items[0].status).toBe('waiting');
    expect(s.waitingItemIds).toContain(s.items[0].id);
    // pointer should have moved past the waiting item
    expect(s.currentItemIndex).toBe(1);
    // complete a different item, then resume the waiting one
    s = reduce(s, { type: 'COMPLETE_SET', reps: 12, weight: 20 });
    s = reduce(s, { type: 'SKIP_REST' });
    const waitingId = s.waitingItemIds[0];
    s = reduce(s, { type: 'RESUME_EXERCISE', itemId: waitingId });
    const resumed = s.items.find((i) => i.id === waitingId);
    expect(resumed?.status).toBe('inProgress');
    expect(s.waitingItemIds).not.toContain(waitingId);
    expect(s.currentItemIndex).toBe(s.items.indexOf(resumed!));
  });

  it('substituteExercise records planned-vs-performed mapping', () => {
    let s = startSession('prog', workout);
    s = reduce(s, { type: 'SUBSTITUTE_EXERCISE', exerciseId: 'bench', performedExerciseId: 'db-bench' });
    expect(s.items[0].exerciseId).toBe('db-bench');
    expect(s.substitutions['bench']).toBe('db-bench');
  });

  it('cardio completion records actuals', () => {
    let s = startSession('prog', workout);
    // advance to cardio (last item) by skipping everything else
    for (let i = 0; i < 5; i++) {
      s = reduce(s, { type: 'SKIP_EXERCISE' });
    }
    const cardioIndex = s.currentItemIndex;
    s = reduce(s, { type: 'COMPLETE_CARDIO', actual: { actualDurationMin: 12, actualDistance: 1.5 } });
    expect(s.items[cardioIndex].cardioActual?.actualDurationMin).toBe(12);
    expect(s.items[cardioIndex].status).toBe('completed');
    expect(s.state).toBe('WorkoutComplete');
  });

  it('finishWorkout / summarize counts completed and skipped', () => {
    let s = startSession('prog', workout);
    // skip bench, complete the rest
    s = reduce(s, { type: 'SKIP_EXERCISE' });
    for (let i = 0; i < 4; i++) {
      s = reduce(s, { type: 'COMPLETE_SET', reps: 12, weight: 20 });
      s = reduce(s, { type: 'SKIP_REST' });
    }
    s = reduce(s, { type: 'COMPLETE_CARDIO', actual: { actualDurationMin: 10 } });
    expect(s.state).toBe('WorkoutComplete');
    const sum = summarize(s);
    // exercise items: bench(skipped) + 4 superset exercises = 5; bench skipped
    expect(sum.exercisesTotal).toBe(5);
    expect(sum.exercisesCompleted).toBe(4);
    expect(sum.exercisesSkipped).toBe(1);
    expect(sum.cardioCount).toBe(1);
    expect(sum.cardioCompleted).toBe(1);
    expect(sum.setsCompleted).toBe(4);
  });

  it('discardSession sets Discarded state', () => {
    let s = startSession('prog', workout);
    s = reduce(s, { type: 'DISCARD_SESSION' });
    expect(s.state).toBe('Discarded');
    expect(s.endTime).toBeGreaterThan(0);
  });

  it('adjustRest shifts the rest end', () => {
    let s = startSession('prog', workout);
    s = reduce(s, { type: 'COMPLETE_SET', reps: 8, weight: 60 });
    const before = s.restEndsAt!;
    s = reduce(s, { type: 'ADJUST_REST', deltaSec: 30 });
    expect(s.restEndsAt).toBe(before + 30_000);
    s = reduce(s, { type: 'ADJUST_REST', deltaSec: -30 });
    expect(s.restEndsAt).toBe(before);
  });

  it('reduce is pure and does not mutate input', () => {
    const s = startSession('prog', workout);
    const snapshot = JSON.stringify(s);
    const next = reduce(s, { type: 'COMPLETE_SET', reps: 8, weight: 60 });
    expect(JSON.stringify(s)).toBe(snapshot);
    expect(next).not.toBe(s);
  });
});
