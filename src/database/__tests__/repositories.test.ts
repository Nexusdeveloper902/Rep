import { InMemoryProgramRepository, InMemorySessionRepository } from '@/database/repositories/inMemoryRepositories';
import { validateProgramDocument } from '@/services/json/programValidator';
import { SAMPLE_PROGRAM } from '@/services/json/sampleProgram';
import { startSession, reduce, summarize } from '@/domain/workout/WorkoutEngine';
import type { Workout } from '@/domain/program/schema';

const sampleWorkout: Workout = {
  id: 'upper-a',
  name: 'Upper A',
  items: [
    { type: 'exercise', exerciseId: 'bench', sets: [{ reps: 8 }, { reps: 8 }], restSec: 90 },
    { type: 'cardio', id: 'c1', cardioType: 'row', durationMin: 5 },
  ],
};

describe('InMemory repositories + engine integration', () => {
  it('sample program validates and round-trips through the program repo', async () => {
    const v = validateProgramDocument(SAMPLE_PROGRAM);
    expect(v.ok).toBe(true);
    const repo = new InMemoryProgramRepository();
    await repo.setActive(v.program!);
    const active = await repo.getActive();
    expect(active?.program.name).toBe(SAMPLE_PROGRAM.program.name);
  });

  it('active session persists across save/load and previousPerformance returns last session', async () => {
    const sessions = new InMemorySessionRepository();
    let s = startSession('prog', sampleWorkout, { label: 'Upper A' });
    await sessions.saveActiveState(s);
    const loaded = await sessions.getActiveState();
    expect(loaded?.id).toBe(s.id);
    expect(loaded?.items.length).toBe(2);

    // complete bench sets and cardio, finish
    s = reduce(s, { type: 'COMPLETE_SET', reps: 8, weight: 60 });
    s = reduce(s, { type: 'SKIP_REST' });
    s = reduce(s, { type: 'COMPLETE_SET', reps: 8, weight: 62.5 });
    s = reduce(s, { type: 'SKIP_REST' });
    s = reduce(s, { type: 'COMPLETE_CARDIO', actual: { actualDurationMin: 5 } });
    s = reduce(s, { type: 'FINISH_WORKOUT' });
    const sum = summarize(s);
    await sessions.saveCompleted(s, sum);

    const activeAfter = await sessions.getActiveState();
    expect(activeAfter).toBeNull();

    const history = await sessions.listCompleted();
    expect(history).toHaveLength(1);

    const prev = await sessions.previousPerformance('bench');
    expect(prev).toHaveLength(2);
    expect(prev[0].weight).toBe(60);
    expect(prev[1].weight).toBe(62.5);
  });

  it('bestSet returns the highest e1rm set and stats aggregates volume; wipeHistory clears history but keeps program', async () => {
    const programs = new InMemoryProgramRepository();
    const v = validateProgramDocument(SAMPLE_PROGRAM);
    await programs.setActive(v.program!);
    expect((await programs.getActive())?.program.name).toBe(SAMPLE_PROGRAM.program.name);

    const sessions = new InMemorySessionRepository();
    let s = startSession('prog', sampleWorkout, { label: 'Upper A' });
    s = reduce(s, { type: 'COMPLETE_SET', reps: 8, weight: 60 });
    s = reduce(s, { type: 'SKIP_REST' });
    s = reduce(s, { type: 'COMPLETE_SET', reps: 8, weight: 70 });
    s = reduce(s, { type: 'SKIP_REST' });
    s = reduce(s, { type: 'COMPLETE_CARDIO', actual: { actualDurationMin: 5 } });
    s = reduce(s, { type: 'FINISH_WORKOUT' });
    await sessions.saveCompleted(s, summarize(s));

    const best = await sessions.bestSet('bench');
    expect(best?.weight).toBe(70);

    const stats = await sessions.stats();
    expect(stats.totalSessions).toBe(1);
    expect(stats.totalSets).toBe(2);
    // 60*8 + 70*8 = 480 + 560 = 1040
    expect(stats.totalVolumeKg).toBeCloseTo(1040, 2);
    expect(stats.totalCardioMin).toBe(5);

    // Wipe clears sessions/history but the program is untouched.
    await sessions.wipeHistory();
    expect(await sessions.listCompleted()).toHaveLength(0);
    expect(await sessions.getActiveState()).toBeNull();
    expect(await sessions.stats()).toMatchObject({ totalSessions: 0, totalSets: 0 });
    const stillActive = await programs.getActive();
    expect(stillActive?.program.name).toBe(SAMPLE_PROGRAM.program.name);
  });
});
