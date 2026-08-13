import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { serializeProgram } from './programValidator';
import type { ProgramDocument } from '@/domain/program/schema';

/** Serialize the active program to pretty JSON, write to a file, and present the share sheet.
 *  History is NEVER included in the export (§22 — program/history separation). */
export async function exportProgram(program: ProgramDocument): Promise<void> {
  const json = serializeProgram(program);
  const safeName = program.program.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const filename = `${safeName || 'program'}.json`;
  const uri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Export workout program' });
  }
}

export function programToJSONString(program: ProgramDocument): string {
  return serializeProgram(program);
}
