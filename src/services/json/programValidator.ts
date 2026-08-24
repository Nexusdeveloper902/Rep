import { ProgramDocumentSchema, DAYS_OF_WEEK } from '@/domain/program/schema';
import type { ProgramDocument } from '@/domain/program/schema';

export interface ValidationResult {
  ok: boolean;
  program?: ProgramDocument;
  errors: string[];
}

/** Human-readable error for a Zod issue path. */
function pathLabel(path: (string | number)[]): string {
  if (path.length === 0) return 'Program document';
  return path
    .map((seg) => (typeof seg === 'number' ? `#${seg + 1}` : String(seg)))
    .join(' → ');
}

function mapZodErrors(issues: { path: (string | number)[]; message: string }[]): string[] {
  return issues.map((i) => `${pathLabel(i.path)}: ${i.message}`);
}

/**
 * Cross-reference / semantic checks beyond Zod (§33):
 *  - duplicate exercise/workout IDs
 *  - schedule references unknown workoutId
 *  - exercise items reference unknown exerciseId
 *  - alternatives reference unknown exerciseId
 *  - set/rep/rest ranges reasonable
 */
function semanticChecks(doc: ProgramDocument): string[] {
  const errors: string[] = [];

  const exerciseIds = new Set<string>();
  for (const ex of doc.exercises) {
    if (exerciseIds.has(ex.id)) errors.push(`Duplicate exercise id: "${ex.id}".`);
    exerciseIds.add(ex.id);
  }

  const workoutIds = new Set<string>();
  for (const w of doc.workouts) {
    if (workoutIds.has(w.id)) errors.push(`Duplicate workout id: "${w.id}".`);
    workoutIds.add(w.id);
  }

  // Schedule references must point to real workouts.
  for (const day of DAYS_OF_WEEK) {
    const ref = doc.schedule[day];
    if (ref && !workoutIds.has(ref)) {
      errors.push(`Schedule ${day} references unknown workout "${ref}".`);
    }
  }

  // Exercise items / superset exercises must reference real exercises.
  for (const w of doc.workouts) {
    for (const item of w.items) {
      if (item.type === 'exercise') {
        if (!exerciseIds.has(item.exerciseId)) {
          errors.push(`Workout "${w.name}" contains an exercise referencing unknown exerciseId "${item.exerciseId}".`);
        }
      } else if (item.type === 'superset') {
        for (const ex of item.exercises) {
          if (!exerciseIds.has(ex.exerciseId)) {
            errors.push(`Superset "${item.id}" in workout "${w.name}" references unknown exerciseId "${ex.exerciseId}".`);
          }
        }
      }
    }
  }

  // Alternatives must reference real exercises.
  for (const ex of doc.exercises) {
    for (const alt of ex.alternatives ?? []) {
      if (!exerciseIds.has(alt)) {
        errors.push(`Exercise "${ex.name}" lists unknown alternative exerciseId "${alt}".`);
      }
    }
  }

  // Per-set sanity: fields must match the item's setMode (defaults to 'reps').
  for (const w of doc.workouts) {
    for (const item of w.items) {
      if (item.type === 'exercise') {
        const mode = item.setMode ?? 'reps';
        for (let i = 0; i < item.sets.length; i++) {
          const set = item.sets[i];
          if (mode === 'reps') {
            if (set.reps === undefined) {
              errors.push(`Workout "${w.name}", set #${i + 1}: reps is required for a reps-mode exercise.`);
            } else if (typeof set.reps === 'number' && set.reps < 1) {
              errors.push(`Workout "${w.name}", set #${i + 1}: reps must be ≥ 1.`);
            }
            if (set.holdSec !== undefined || set.distanceKm !== undefined) {
              errors.push(`Workout "${w.name}", set #${i + 1}: holdSec/distanceKm are not valid for reps-mode exercises.`);
            }
          } else if (mode === 'timed') {
            if (set.holdSec === undefined) {
              errors.push(`Workout "${w.name}", set #${i + 1}: holdSec is required for a timed-mode exercise.`);
            }
            if (set.reps !== undefined || set.distanceKm !== undefined) {
              errors.push(`Workout "${w.name}", set #${i + 1}: reps/distanceKm are not valid for timed-mode exercises.`);
            }
          } else if (mode === 'distance') {
            if (set.distanceKm === undefined) {
              errors.push(`Workout "${w.name}", set #${i + 1}: distanceKm is required for a distance-mode exercise.`);
            }
            if (set.reps !== undefined || set.holdSec !== undefined) {
              errors.push(`Workout "${w.name}", set #${i + 1}: reps/holdSec are not valid for distance-mode exercises.`);
            }
          }
        }
        if (item.restSec !== undefined && item.restSec > 600) {
          errors.push(`Workout "${w.name}": restSec must be ≤ 600.`);
        }
      } else if (item.type === 'superset') {
        for (let j = 0; j < item.exercises.length; j++) {
          const ex = item.exercises[j];
          const mode = ex.setMode ?? 'reps';
          for (let i = 0; i < ex.sets.length; i++) {
            const set = ex.sets[i];
            if (mode === 'reps' && set.reps === undefined) {
              errors.push(`Superset "${item.id}" exercise #${j + 1}, set #${i + 1}: reps is required for reps-mode.`);
            } else if (mode === 'timed' && set.holdSec === undefined) {
              errors.push(`Superset "${item.id}" exercise #${j + 1}, set #${i + 1}: holdSec is required for timed-mode.`);
            } else if (mode === 'distance' && set.distanceKm === undefined) {
              errors.push(`Superset "${item.id}" exercise #${j + 1}, set #${i + 1}: distanceKm is required for distance-mode.`);
            }
          }
        }
      }
    }
  }

  return errors;
}

/** Parse + validate arbitrary JSON into a typed ProgramDocument or friendly errors. */
export function validateProgramDocument(raw: unknown): ValidationResult {
  let json: unknown;
  try {
    if (typeof raw === 'string') json = JSON.parse(raw);
    else json = raw;
  } catch {
    return { ok: false, errors: ['File is not valid JSON.'] };
  }

  const parsed = ProgramDocumentSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, errors: mapZodErrors(parsed.error.issues as unknown as { path: (string | number)[]; message: string }[]) };
  }

  const semantic = semanticChecks(parsed.data);
  if (semantic.length > 0) {
    return { ok: false, errors: semantic };
  }

  return { ok: true, program: parsed.data, errors: [] };
}

/** Re-serialize a ProgramDocument to pretty JSON for export (round-trip fidelity). */
export function serializeProgram(doc: ProgramDocument): string {
  return JSON.stringify(doc, null, 2);
}
