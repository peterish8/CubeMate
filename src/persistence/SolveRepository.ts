import type { CubeSession, Penalty, Result, SessionId, Solve, SolveId } from "../domain/types";
import type { SessionStoreSnapshot, SyncStatus } from "./types";

export interface SolveRepository {
  loadInitialState(): SessionStoreSnapshot;
  appendSolve(solve: Solve): Result<Solve[]>;
  updatePenalty(id: SolveId, penalty: Penalty): Result<Solve[]>;
  deleteSolve(id: SolveId): Result<Solve[]>;
  deleteSessions(ids: SessionId[]): Result<{ sessions: CubeSession[]; solves: Solve[] }>;
  clearAll(): Result<void>;
  createSession(): Result<CubeSession>;
  saveSolves(solves: Solve[]): Result<void>;
  getSyncStatus(): SyncStatus;
}