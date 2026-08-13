import { z } from 'zod';

export const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

/** Exercise metadata — the "library" describing how to perform an exercise. */
export const ExerciseMetaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  instructions: z.array(z.string()).optional(),
  targetMuscles: z.array(z.string()).optional(),
  equipment: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  commonMistakes: z.array(z.string()).optional(),
  tips: z.array(z.string()).optional(),
  alternatives: z.array(z.string()).optional(),
});
export type ExerciseMeta = z.infer<typeof ExerciseMetaSchema>;

const PlannedSetSchema = z.object({
  reps: z.union([z.string(), z.number()]),
  rpe: z.number().min(1).max(10).optional(),
});

/** Resistance exercise item within a workout. */
export const ExerciseWorkoutItemSchema = z.object({
  type: z.literal('exercise'),
  id: z.string().optional(),
  exerciseId: z.string().min(1),
  sets: z.array(PlannedSetSchema).min(1),
  restSec: z.number().int().min(0).max(600).optional(),
  notes: z.string().optional(),
  equipmentOverride: z.string().optional(),
});
export type ExerciseWorkoutItem = z.infer<typeof ExerciseWorkoutItemSchema>;

const SupersetExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.array(PlannedSetSchema).min(1),
  restSec: z.number().int().min(0).max(600).optional(),
});

/** Superset: N exercises performed back-to-back, repeated for `rounds` rounds. */
export const SupersetWorkoutItemSchema = z.object({
  type: z.literal('superset'),
  id: z.string().min(1),
  name: z.string().optional(),
  rounds: z.number().int().min(1).max(10),
  exercises: z.array(SupersetExerciseSchema).min(2),
  restSec: z.number().int().min(0).max(600).optional(),
});
export type SupersetWorkoutItem = z.infer<typeof SupersetWorkoutItemSchema>;

/** Cardio item (optional equipment; planned vs actual fields). */
export const CardioWorkoutItemSchema = z.object({
  type: z.literal('cardio'),
  id: z.string().min(1),
  name: z.string().optional(),
  cardioType: z.string().min(1),
  equipment: z.string().optional(),
  durationMin: z.number().min(1).max(600).optional(),
  distance: z.number().min(0).optional(),
  intensity: z.enum(['easy', 'moderate', 'hard', 'interval']).optional(),
  incline: z.number().optional(),
  speed: z.number().optional(),
  resistance: z.number().optional(),
  hrTarget: z.number().min(30).max(220).optional(),
  notes: z.string().optional(),
});
export type CardioWorkoutItem = z.infer<typeof CardioWorkoutItemSchema>;

/** Discriminated union of all workout item kinds. */
export const WorkoutItemSchema = z.discriminatedUnion('type', [
  ExerciseWorkoutItemSchema,
  SupersetWorkoutItemSchema,
  CardioWorkoutItemSchema,
]);
export type WorkoutItem = z.infer<typeof WorkoutItemSchema>;

export const WorkoutSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  estimatedDurationMin: z.number().int().min(1).max(600).optional(),
  items: z.array(WorkoutItemSchema).min(1),
});
export type Workout = z.infer<typeof WorkoutSchema>;

export const ScheduleSchema = z.object({
  monday: z.string().nullable().optional(),
  tuesday: z.string().nullable().optional(),
  wednesday: z.string().nullable().optional(),
  thursday: z.string().nullable().optional(),
  friday: z.string().nullable().optional(),
  saturday: z.string().nullable().optional(),
  sunday: z.string().nullable().optional(),
});
export type Schedule = z.infer<typeof ScheduleSchema>;

/** Versioned root document. Zod is the single source of truth for import/export. */
export const ProgramDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  program: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
  }),
  schedule: ScheduleSchema,
  workouts: z.array(WorkoutSchema).min(1),
  exercises: z.array(ExerciseMetaSchema).min(1),
});
export type ProgramDocument = z.infer<typeof ProgramDocumentSchema>;
