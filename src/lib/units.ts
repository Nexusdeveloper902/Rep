import type { Units } from '@/services/storage/preferencesRepository';

/** Display label for a unit setting. */
export function unitLabel(units: Units): string {
  return units === 'lb' ? 'lb' : 'kg';
}

/**
 * Format a weight value for display in the current unit system.
 * The stored value is always in kilograms (the canonical store unit); when the
 * user prefers pounds we convert on display only, never mutating stored data.
 */
export function formatWeight(weightKg: number | undefined | null, units: Units): string {
  if (weightKg == null || Number.isNaN(weightKg)) return '';
  const value = units === 'lb' ? kgToLb(weightKg) : weightKg;
  // Trim trailing zeros but keep one decimal when needed.
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}${unitLabel(units)}`;
}

/** Read a user-entered weight in the current unit system and return kilograms for storage. */
export function parseWeightToKg(input: string, units: Units): number | undefined {
  if (!input.trim()) return undefined;
  const v = parseFloat(input);
  if (Number.isNaN(v)) return undefined;
  return units === 'lb' ? lbToKg(v) : v;
}

export function kgToLb(kg: number): number {
  return kg * 2.2046226218;
}

export function lbToKg(lb: number): number {
  return lb / 2.2046226218;
}
