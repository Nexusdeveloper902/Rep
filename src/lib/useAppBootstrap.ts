import { useEffect } from 'react';
import { configureRepos } from '@/lib/repositories';
import { SQLiteProgramRepository, SQLiteSessionRepository } from '@/database/repositories/sqliteRepositories';
import { usePreferencesStore } from '@/stores/usePreferencesStore';
import { useProgramStore } from '@/stores/useProgramStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { useHistoryStore } from '@/stores/useHistoryStore';

let configured = false;

/** Configure repositories (SQLite at runtime) and hydrate all stores once on mount. */
export function useAppBootstrap(): void {
  const loadPreferences = usePreferencesStore((s) => s.load);
  const loadProgram = useProgramStore((s) => s.loadProgram);
  const seedSample = useProgramStore((s) => s.seedSampleIfEmpty);
  const loadActive = useSessionStore((s) => s.loadActive);
  const loadHistory = useHistoryStore((s) => s.loadHistory);
  const loadStats = useHistoryStore((s) => s.loadStats);

  useEffect(() => {
    (async () => {
      if (!configured) {
        configureRepos({ programs: new SQLiteProgramRepository(), sessions: new SQLiteSessionRepository() });
        configured = true;
      }
      await Promise.all([loadPreferences(), loadProgram()]);
      await seedSample();
      await Promise.all([loadActive(), loadHistory(), loadStats()]);
    })();
  }, [loadPreferences, loadProgram, seedSample, loadActive, loadHistory, loadStats]);
}
