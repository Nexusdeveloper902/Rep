import { validateProgramDocument, serializeProgram } from '@/services/json/programValidator';
import type { ProgramDocument } from '@/domain/program/schema';

const validDoc: ProgramDocument = {
  schemaVersion: 1,
  program: { id: 'p1', name: 'PPL', description: 'Test' },
  schedule: { monday: 'a', wednesday: 'b', friday: null },
  workouts: [
    {
      id: 'a',
      name: 'Upper A',
      items: [
        { type: 'exercise', exerciseId: 'bench', sets: [{ reps: 8 }], restSec: 90 },
        {
          type: 'superset',
          id: 'ss1',
          rounds: 2,
          exercises: [
            { exerciseId: 'curl', sets: [{ reps: 12 }] },
            { exerciseId: 'tri', sets: [{ reps: 12 }] },
          ],
        },
        { type: 'cardio', id: 'c1', cardioType: 'treadmill', durationMin: 10 },
      ],
    },
    { id: 'b', name: 'Lower A', items: [{ type: 'exercise', exerciseId: 'squat', sets: [{ reps: 5 }] }] },
  ],
  exercises: [
    { id: 'bench', name: 'Bench Press', alternatives: ['db-bench'] },
    { id: 'db-bench', name: 'DB Bench' },
    { id: 'curl', name: 'Curl' },
    { id: 'tri', name: 'Triceps' },
    { id: 'squat', name: 'Squat' },
  ],
};

describe('validateProgramDocument', () => {
  it('accepts a valid document', () => {
    const r = validateProgramDocument(JSON.stringify(validDoc));
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.program?.program.name).toBe('PPL');
  });

  it('rejects non-JSON', () => {
    const r = validateProgramDocument('{not json');
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toContain('not valid JSON');
  });

  it('rejects duplicate exercise id', () => {
    const doc = JSON.parse(JSON.stringify(validDoc)) as ProgramDocument;
    doc.exercises[1].id = 'bench';
    const r = validateProgramDocument(doc);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes('Duplicate exercise id'))).toBe(true);
  });

  it('rejects schedule referencing unknown workout', () => {
    const doc = JSON.parse(JSON.stringify(validDoc)) as ProgramDocument;
    doc.schedule.tuesday = 'nope';
    const r = validateProgramDocument(doc);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes('unknown workout'))).toBe(true);
  });

  it('rejects exercise referencing unknown exerciseId', () => {
    const doc = JSON.parse(JSON.stringify(validDoc)) as ProgramDocument;
    (doc.workouts[0].items[0] as any).exerciseId = 'ghost';
    const r = validateProgramDocument(doc);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes('unknown exerciseId "ghost"'))).toBe(true);
  });

  it('rejects alternatives referencing unknown exerciseId', () => {
    const doc = JSON.parse(JSON.stringify(validDoc)) as ProgramDocument;
    doc.exercises[0].alternatives = ['ghost'];
    const r = validateProgramDocument(doc);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes('unknown alternative exerciseId "ghost"'))).toBe(true);
  });

  it('rejects missing required name', () => {
    const doc = JSON.parse(JSON.stringify(validDoc)) as ProgramDocument;
    delete (doc.program as any).name;
    const r = validateProgramDocument(doc);
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('round-trips through serialize', () => {
    const r1 = validateProgramDocument(validDoc);
    expect(r1.ok).toBe(true);
    const json = serializeProgram(r1.program!);
    const r2 = validateProgramDocument(json);
    expect(r2.ok).toBe(true);
    expect(JSON.stringify(r2.program)).toBe(JSON.stringify(r1.program));
  });

  it('accepts timed setMode with holdSec and round-trips', () => {
    const doc = JSON.parse(JSON.stringify(validDoc)) as ProgramDocument;
    (doc.workouts[0].items[0] as any).setMode = 'timed';
    (doc.workouts[0].items[0] as any).sets = [{ holdSec: 60 }, { holdSec: 45, eachSide: true }];
    const r = validateProgramDocument(doc);
    expect(r.ok).toBe(true);
    const item = r.program!.workouts[0].items[0];
    expect(item.type === 'exercise' && item.setMode).toBe('timed');
  });

  it('accepts distance setMode with distanceKm', () => {
    const doc = JSON.parse(JSON.stringify(validDoc)) as ProgramDocument;
    (doc.workouts[0].items[0] as any).setMode = 'distance';
    (doc.workouts[0].items[0] as any).sets = [{ distanceKm: 0.05 }, { distanceKm: 0.05 }];
    const r = validateProgramDocument(doc);
    expect(r.ok).toBe(true);
  });

  it('rejects timed set missing holdSec', () => {
    const doc = JSON.parse(JSON.stringify(validDoc)) as ProgramDocument;
    (doc.workouts[0].items[0] as any).setMode = 'timed';
    (doc.workouts[0].items[0] as any).sets = [{ reps: 1 }];
    const r = validateProgramDocument(doc);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes('holdSec is required'))).toBe(true);
  });

  it('rejects distance set missing distanceKm', () => {
    const doc = JSON.parse(JSON.stringify(validDoc)) as ProgramDocument;
    (doc.workouts[0].items[0] as any).setMode = 'distance';
    (doc.workouts[0].items[0] as any).sets = [{ reps: 1 }];
    const r = validateProgramDocument(doc);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes('distanceKm is required'))).toBe(true);
  });

  it('rejects reps-mode set missing reps', () => {
    const doc = JSON.parse(JSON.stringify(validDoc)) as ProgramDocument;
    (doc.workouts[0].items[0] as any).setMode = 'reps';
    (doc.workouts[0].items[0] as any).sets = [{ holdSec: 30 }];
    const r = validateProgramDocument(doc);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes('reps is required'))).toBe(true);
  });

  it('accepts a legacy document with no setMode fields (backward compatible)', () => {
    // The base validDoc already has no setMode anywhere; it must still pass.
    const r = validateProgramDocument(validDoc);
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
  });
});
