import type { ProgramDocument } from '@/domain/program/schema';

/** Bundled sample program so the app is usable out of the box. Seeded on first run.
 *  Wed/Fri/Sat/Sun split with a superset and cardio, per the spec. */
export const SAMPLE_PROGRAM: ProgramDocument = {
  schemaVersion: 1,
  program: {
    id: 'sample-ppl-2026',
    name: 'Sample Push / Pull / Legs',
    description: 'A balanced 4-day split to get you started. Replace it any time by importing your own program JSON.',
  },
  schedule: {
    wednesday: 'upper-a',
    friday: 'lower-a',
    saturday: 'upper-b',
    sunday: 'cardio-core',
  },
  workouts: [
    {
      id: 'upper-a',
      name: 'Upper A',
      description: 'Chest, shoulders, triceps.',
      estimatedDurationMin: 55,
      items: [
        { type: 'exercise', id: 'ua-bench', exerciseId: 'barbell-bench', sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }], restSec: 120, notes: 'RPE 8 on last set.' },
        {
          type: 'superset',
          id: 'ua-ss1',
          name: 'Shoulder / Tri',
          rounds: 3,
          exercises: [
            { exerciseId: 'db-shoulder-press', sets: [{ reps: 10 }], restSec: 60 },
            { exerciseId: 'tricep-pushdown', sets: [{ reps: 12 }] },
          ],
          restSec: 90,
        },
        { type: 'exercise', id: 'ua-row', exerciseId: 'db-row', sets: [{ reps: 10 }, { reps: 10 }], restSec: 90 },
      ],
    },
    {
      id: 'lower-a',
      name: 'Lower A',
      description: 'Quads, hamstrings, calves.',
      estimatedDurationMin: 50,
      items: [
        { type: 'exercise', id: 'la-squat', exerciseId: 'back-squat', sets: [{ reps: 5 }, { reps: 5 }, { reps: 5 }], restSec: 180 },
        { type: 'exercise', id: 'la-rdl', exerciseId: 'romanian-deadlift', sets: [{ reps: 8 }, { reps: 8 }], restSec: 120 },
        { type: 'exercise', id: 'la-calf', exerciseId: 'calf-raise', sets: [{ reps: 15 }, { reps: 15 }], restSec: 60 },
      ],
    },
    {
      id: 'upper-b',
      name: 'Upper B',
      description: 'Back, biceps, rear delts.',
      estimatedDurationMin: 50,
      items: [
        { type: 'exercise', id: 'ub-pulldown', exerciseId: 'lat-pulldown', sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }], restSec: 90 },
        {
          type: 'superset',
          id: 'ub-ss1',
          name: 'Curl / Face Pull',
          rounds: 3,
          exercises: [
            { exerciseId: 'barbell-curl', sets: [{ reps: 10 }] },
            { exerciseId: 'face-pull', sets: [{ reps: 15 }] },
          ],
          restSec: 60,
        },
        { type: 'exercise', id: 'ub-row', exerciseId: 'seated-row', sets: [{ reps: 10 }, { reps: 10 }], restSec: 90 },
      ],
    },
    {
      id: 'cardio-core',
      name: 'Cardio + Core',
      description: 'Conditioning and abs.',
      estimatedDurationMin: 40,
      items: [
        { type: 'cardio', id: 'cc-cardio', cardioType: 'treadmill', durationMin: 20, intensity: 'moderate', notes: 'Incline 2%.' },
        { type: 'exercise', id: 'cc-plank', exerciseId: 'plank', sets: [{ reps: 1 }], restSec: 45, notes: 'Hold 45s.' },
        { type: 'exercise', id: 'cc-hang', exerciseId: 'hanging-leg-raise', sets: [{ reps: 12 }, { reps: 12 }], restSec: 60 },
      ],
    },
  ],
  exercises: [
    {
      id: 'barbell-bench',
      name: 'Barbell Bench Press',
      description: 'Horizontal pressing strength.',
      instructions: ['Lie flat, retract scapulae.', 'Lower to chest under control.', 'Press up and lock out.'],
      targetMuscles: ['Chest', 'Triceps', 'Front delts'],
      equipment: 'Barbell',
      difficulty: 'intermediate',
      commonMistakes: ['Bouncing the bar off the chest', 'Flaring elbows past 75°'],
      tips: ['Plant feet firmly', 'Maintain a slight arch'],
      alternatives: ['db-bench'],
    },
    { id: 'db-bench', name: 'Dumbbell Bench Press', equipment: 'Dumbbells', targetMuscles: ['Chest'], alternatives: ['barbell-bench'] },
    { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', equipment: 'Dumbbells', targetMuscles: ['Shoulders'] },
    { id: 'tricep-pushdown', name: 'Triceps Pushdown', equipment: 'Cable', targetMuscles: ['Triceps'] },
    { id: 'db-row', name: 'Dumbbell Row', equipment: 'Dumbbell', targetMuscles: ['Back'] },
    { id: 'back-squat', name: 'Back Squat', equipment: 'Barbell', targetMuscles: ['Quads', 'Glutes'] },
    { id: 'romanian-deadlift', name: 'Romanian Deadlift', equipment: 'Barbell', targetMuscles: ['Hamstrings'] },
    { id: 'calf-raise', name: 'Calf Raise', equipment: 'Machine', targetMuscles: ['Calves'] },
    { id: 'lat-pulldown', name: 'Lat Pulldown', equipment: 'Cable', targetMuscles: ['Back'] },
    { id: 'barbell-curl', name: 'Barbell Curl', equipment: 'Barbell', targetMuscles: ['Biceps'] },
    { id: 'face-pull', name: 'Face Pull', equipment: 'Cable', targetMuscles: ['Rear delts'] },
    { id: 'seated-row', name: 'Seated Cable Row', equipment: 'Cable', targetMuscles: ['Back'] },
    { id: 'plank', name: 'Plank', equipment: 'Bodyweight', targetMuscles: ['Core'] },
    { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', equipment: 'Bodyweight', targetMuscles: ['Core'] },
  ],
};
