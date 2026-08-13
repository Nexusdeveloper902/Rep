import type { Workout } from '@/domain/program/schema';

/** Predefined flexible workouts for unscheduled days. Not part of any program. */
export const EXTRA_TEMPLATES: Workout[] = [
  {
    id: 'extra-quick-fullbody',
    name: 'Quick Full Body',
    description: 'A fast 30-minute full-body hit when you are short on time.',
    estimatedDurationMin: 30,
    items: [
      { type: 'exercise', exerciseId: 'extra-squat', sets: [{ reps: 10 }, { reps: 10 }], restSec: 60 },
      { type: 'exercise', exerciseId: 'extra-bench', sets: [{ reps: 10 }, { reps: 10 }], restSec: 60 },
      { type: 'exercise', exerciseId: 'extra-row', sets: [{ reps: 10 }, { reps: 10 }], restSec: 60 },
    ],
  },
  {
    id: 'extra-full-gym',
    name: 'Full Gym Session',
    description: 'A complete 60-minute resistance session.',
    estimatedDurationMin: 60,
    items: [
      { type: 'exercise', exerciseId: 'extra-squat', sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }], restSec: 120 },
      { type: 'exercise', exerciseId: 'extra-bench', sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }], restSec: 90 },
      {
        type: 'superset',
        id: 'extra-ss',
        name: 'Pull / Push',
        rounds: 3,
        exercises: [
          { exerciseId: 'extra-row', sets: [{ reps: 10 }] },
          { exerciseId: 'extra-press', sets: [{ reps: 10 }] },
        ],
        restSec: 60,
      },
    ],
  },
  {
    id: 'extra-cardio-core',
    name: 'Cardio + Core',
    description: 'Conditioning and core work, ~40 minutes.',
    estimatedDurationMin: 40,
    items: [
      { type: 'cardio', id: 'extra-cardio', cardioType: 'treadmill', durationMin: 20, intensity: 'moderate' },
      { type: 'exercise', exerciseId: 'extra-plank', sets: [{ reps: 1 }], restSec: 45, notes: 'Hold 45s' },
      { type: 'exercise', exerciseId: 'extra-legraise', sets: [{ reps: 12 }, { reps: 12 }], restSec: 60 },
    ],
  },
];

/** Minimal exercise metadata for the extra templates so the info panel works. */
export const EXTRA_EXERCISES = [
  { id: 'extra-squat', name: 'Bodyweight Squat', equipment: 'Bodyweight', targetMuscles: ['Quads', 'Glutes'] },
  { id: 'extra-bench', name: 'Push-up', equipment: 'Bodyweight', targetMuscles: ['Chest'] },
  { id: 'extra-row', name: 'Inverted Row', equipment: 'Bar', targetMuscles: ['Back'] },
  { id: 'extra-press', name: 'Shoulder Press', equipment: 'Dumbbells', targetMuscles: ['Shoulders'] },
  { id: 'extra-plank', name: 'Plank', equipment: 'Bodyweight', targetMuscles: ['Core'] },
  { id: 'extra-legraise', name: 'Hanging Leg Raise', equipment: 'Bodyweight', targetMuscles: ['Core'] },
];
