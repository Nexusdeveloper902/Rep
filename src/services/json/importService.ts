import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { validateProgramDocument } from './programValidator';
import type { ProgramDocument } from '@/domain/program/schema';
import type { IProgramRepository } from '@/database/repositories/types';

export interface ImportPreview {
  ok: boolean;
  program?: ProgramDocument;
  errors: string[];
  /** Quick stats for the confirm screen. */
  stats?: {
    programName: string;
    workoutCount: number;
    exerciseCount: number;
    scheduledDays: string[];
  };
  sourceUri?: string;
}

/** Pick a JSON file, read it, validate, and produce a preview (no persistence yet). */
export async function pickAndValidateProgram(): Promise<ImportPreview> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', 'public.json'] });
  if (!result.assets || result.assets.length === 0) {
    return { ok: false, errors: ['No file selected.'] };
  }
  const asset = result.assets[0];
  try {
    const contents = await FileSystem.readAsStringAsync(asset.uri);
    const validation = validateProgramDocument(contents);
    if (!validation.ok || !validation.program) {
      return { ok: false, errors: validation.errors, sourceUri: asset.uri };
    }
    const doc = validation.program;
    const days = Object.entries(doc.schedule)
      .filter(([, v]) => v)
      .map(([k]) => k);
    return {
      ok: true,
      program: doc,
      errors: [],
      sourceUri: asset.uri,
      stats: {
        programName: doc.program.name,
        workoutCount: doc.workouts.length,
        exerciseCount: doc.exercises.length,
        scheduledDays: days,
      },
    };
  } catch (e) {
    return { ok: false, errors: [`Could not read file: ${(e as Error).message}`] };
  }
}

/** Persist a validated program as the active program. Confirms overwrite is the caller's job (§21). */
export async function confirmImport(program: ProgramDocument, repo: IProgramRepository): Promise<void> {
  await repo.setActive(program);
}
