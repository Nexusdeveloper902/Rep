import { create } from 'zustand';
import { repos } from '@/lib/repositories';
import type { SessionRecord, SetLogRecord } from '@/database/repositories/types';

interface HistoryState {
  records: SessionRecord[];
  loaded: boolean;
  loadHistory: () => Promise<void>;
  previousPerformance: (exerciseId: string) => Promise<SetLogRecord[]>;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  records: [],
  loaded: false,
  async loadHistory() {
    const records = await repos.sessions.listCompleted();
    set({ records, loaded: true });
  },
  async previousPerformance(exerciseId) {
    return repos.sessions.previousPerformance(exerciseId);
  },
}));
