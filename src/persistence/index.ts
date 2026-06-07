import { hybridRepository } from "./adapters/hybridRepository";
import { localStorageRepository } from "./adapters/localStorageRepository";
import type { SolveRepository } from "./SolveRepository";

export function isConvexConfigured(): boolean {
  const url = import.meta.env.VITE_CONVEX_URL;
  return typeof url === "string" && url.length > 0;
}

/** Guests use local-only; when Convex URL is set, hybrid queues cloud sync after sign-in. */
export function getSolveRepository(): SolveRepository {
  return isConvexConfigured() ? hybridRepository : localStorageRepository;
}

export type { SolveRepository } from "./SolveRepository";
export type { SessionStoreSnapshot, SyncStatus } from "./types";