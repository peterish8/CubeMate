import type { CubeSession, SessionId, Solve } from "../domain/types";

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

export interface SessionStoreSnapshot {
  sessions: CubeSession[];
  allSolves: Solve[];
  currentSessionId: SessionId;
  corrupted: boolean;
}