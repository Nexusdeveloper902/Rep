import { InMemoryProgramRepository, InMemorySessionRepository } from '@/database/repositories/inMemoryRepositories';
import type { IProgramRepository, ISessionRepository } from '@/database/repositories/types';

/**
 * Dependency injection container for repositories. Defaults to in-memory
 * implementations (used in tests + sandbox). At runtime, app boot swaps in the
 * SQLite implementations so persistence is real on-device.
 */
export interface Repos {
  programs: IProgramRepository;
  sessions: ISessionRepository;
}

export const repos: Repos = {
  programs: new InMemoryProgramRepository(),
  sessions: new InMemorySessionRepository(),
};

export function configureRepos(r: Partial<Repos>): void {
  Object.assign(repos, r);
}
