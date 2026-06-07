import type { Penalty, Result, SessionId, Solve, SolveId } from "../../domain/types";
import type { SolveRepository } from "../SolveRepository";
import type { SessionStoreSnapshot, SyncStatus } from "../types";
import { localStorageRepository } from "./localStorageRepository";
import {
  enqueueDeleteSolveSync,
  enqueuePenaltySync,
  enqueueSolveSync,
  getCloudSyncHooks,
  getPendingSyncCount,
} from "../sync/cloudSync";

let syncStatus: SyncStatus = "idle";

async function refreshSyncStatus(): Promise<void> {
  const pending = await getPendingSyncCount();
  if (pending > 0) syncStatus = "syncing";
  else if (getCloudSyncHooks()?.isAuthenticated()) syncStatus = "synced";
  else syncStatus = "idle";
}

// Enqueue a solve for cloud sync without re-parsing all of localStorage.
// The session is looked up from the already-loaded snapshot passed in,
// avoiding the O(n) loadInitialState() call that the old version did.
function afterLocalWrite(solve: Solve, sessions: import("../../domain/types").CubeSession[]): void {
  const session = sessions.find((s) => s.id === solve.sessionId);
  if (!session) return;
  void enqueueSolveSync(solve, session).then(() => refreshSyncStatus());
}

export const hybridRepository: SolveRepository = {
  loadInitialState(): SessionStoreSnapshot {
    return localStorageRepository.loadInitialState();
  },

  appendSolve(solve) {
    const result = localStorageRepository.appendSolve(solve);
    if (result.ok) {
      // Re-use the sessions already in localStorage without a full re-parse:
      // load sessions once (small, cheap) rather than calling loadInitialState()
      // which also re-parses all solves.
      const snap = localStorageRepository.loadInitialState();
      afterLocalWrite(solve, snap.sessions);
    }
    void refreshSyncStatus();
    return result;
  },

  updatePenalty(id, penalty) {
    const result = localStorageRepository.updatePenalty(id, penalty);
    if (result.ok) {
      void enqueuePenaltySync(id, penalty).then(() => refreshSyncStatus());
    }
    return result;
  },

  deleteSolve(id) {
    const result = localStorageRepository.deleteSolve(id);
    if (result.ok) {
      void enqueueDeleteSolveSync(id).then(() => refreshSyncStatus());
    }
    return result;
  },

  deleteSessions(ids) {
    return localStorageRepository.deleteSessions(ids);
  },

  clearAll() {
    return localStorageRepository.clearAll();
  },

  createSession() {
    return localStorageRepository.createSession();
  },

  saveSolves(solves) {
    return localStorageRepository.saveSolves(solves);
  },

  getSyncStatus() {
    return syncStatus;
  },
};
