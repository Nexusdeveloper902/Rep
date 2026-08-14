import { create } from 'zustand';
import { PreferencesRepository, type PreferencesData, type Units } from '@/services/storage/preferencesRepository';

const repo = new PreferencesRepository();

interface PreferencesState extends PreferencesData {
  loaded: boolean;
  load: () => Promise<void>;
  setUnits: (u: Units) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  setDiscardConfirm: (v: boolean) => Promise<void>;
}

async function persist(data: PreferencesData) {
  await repo.save(data);
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  onboardingDone: false,
  units: 'kg',
  discardConfirm: true,
  loaded: false,
  async load() {
    const data = await repo.load();
    set({ ...data, loaded: true });
  },
  async setUnits(u) {
    const next = { ...get(), units: u };
    set({ units: u });
    await persist({ onboardingDone: next.onboardingDone, units: u, discardConfirm: next.discardConfirm });
  },
  async completeOnboarding() {
    set({ onboardingDone: true });
    const n = get();
    await persist({ onboardingDone: true, units: n.units, discardConfirm: n.discardConfirm });
  },
  async setDiscardConfirm(v) {
    set({ discardConfirm: v });
    const n = get();
    await persist({ onboardingDone: n.onboardingDone, units: n.units, discardConfirm: v });
  },
}));
