import { create } from 'zustand';
import { repos } from '@/lib/repositories';
import { validateProgramDocument, serializeProgram } from '@/services/json/programValidator';
import { pickAndValidateProgram, confirmImport } from '@/services/json/importService';
import { exportProgram } from '@/services/json/exportService';
import { SAMPLE_PROGRAM } from '@/services/json/sampleProgram';
import type { ProgramDocument, Workout, ExerciseMeta } from '@/domain/program/schema';
import { getTodayWorkout } from '@/lib/datetime';

interface ProgramState {
  program: ProgramDocument | null;
  loaded: boolean;
  loadProgram: () => Promise<void>;
  seedSampleIfEmpty: () => Promise<void>;
  importProgram: () => Promise<{ ok: boolean; errors: string[]; stats?: ImportPreview['stats'] }>;
  confirmImportProgram: (doc: ProgramDocument) => Promise<void>;
  exportActiveProgram: () => Promise<void>;
  getWorkout: (id: string) => Workout | undefined;
  getExercise: (id: string) => ExerciseMeta | undefined;
  todayWorkout: () => Workout | null;
}

type ImportPreview = Awaited<ReturnType<typeof pickAndValidateProgram>>;

export const useProgramStore = create<ProgramState>((set, get) => ({
  program: null,
  loaded: false,

  async loadProgram() {
    const doc = await repos.programs.getActive();
    set({ program: doc, loaded: true });
  },

  async seedSampleIfEmpty() {
    const existing = await repos.programs.getActive();
    if (existing) return;
    const validation = validateProgramDocument(SAMPLE_PROGRAM);
    if (validation.ok && validation.program) {
      await repos.programs.setActive(validation.program);
      set({ program: validation.program });
    }
  },

  async importProgram() {
    const preview = await pickAndValidateProgram();
    if (!preview.ok || !preview.program) {
      return { ok: false, errors: preview.errors };
    }
    return { ok: true, errors: [], stats: preview.stats };
  },

  async confirmImportProgram(doc) {
    await confirmImport(doc, repos.programs);
    set({ program: doc });
  },

  async exportActiveProgram() {
    const doc = get().program;
    if (!doc) return;
    await exportProgram(doc);
  },

  getWorkout(id) {
    return get().program?.workouts.find((w) => w.id === id);
  },
  getExercise(id) {
    return get().program?.exercises.find((e) => e.id === id);
  },
  todayWorkout() {
    const doc = get().program;
    return doc ? getTodayWorkout(doc) : null;
  },
}));

export { serializeProgram };
