import { create } from 'zustand';
import { repos } from '@/lib/repositories';
import type { SessionRecord, SetLogRecord, WorkoutStats } from '@/database/repositories/types';

interface HistoryState {
  records: SessionRecord[];
  loaded: boolean;
  stats: WorkoutStats | null;
  loadHistory: () => Promise<void>;
  loadStats: () => Promise<void>;
  previousPerformance: (exerciseId: string) => Promise<SetLogRecord[]>;
  bestSet: (exerciseId: string) => Promise<SetLogRecord | null>;
  wipeHistory: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  records: [],
  loaded: false,
  stats: null,
  async loadHistory() {
    const records = await repos.sessions.listCompleted();
    set({ records, loaded: true });
  },
  async loadStats() {
    const stats = await repos.sessions.stats();
    set({ stats });
  },
  async previousPerformance(exerciseId) {
    return repos.sessions.previousPerformance(exerciseId);
  },
  async bestSet(exerciseId) {
    return repos.sessions.bestSet(exerciseId);
  },
  async wipeHistory() {
    await repos.sessions.wipeHistory();
    await get().loadHistory();
    await get().loadStats();
  },
}));
