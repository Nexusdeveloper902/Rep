import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  onboardingDone: 'pref.onboardingDone',
  units: 'pref.units',
  discardConfirm: 'pref.discardConfirm',
} as const;

export type Units = 'kg' | 'lb';

export interface PreferencesData {
  onboardingDone: boolean;
  units: Units;
  discardConfirm: boolean;
}

const DEFAULTS: PreferencesData = { onboardingDone: false, units: 'kg', discardConfirm: true };

export class PreferencesRepository {
  async load(): Promise<PreferencesData> {
    const raw = await AsyncStorage.getItem('pref.all');
    if (!raw) return { ...DEFAULTS };
    try {
      return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<PreferencesData>) };
    } catch {
      return { ...DEFAULTS };
    }
  }
  async save(data: PreferencesData): Promise<void> {
    await AsyncStorage.setItem('pref.all', JSON.stringify(data));
  }
}

export { KEYS };
