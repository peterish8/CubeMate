import { useCallback, useMemo, useState } from "react";
import type { CubeSession, Penalty, SessionId, Solve, SolveId } from "../../domain/types";
import { getSolveRepository } from "../../persistence";

export interface UseSessionResult {
  solves: Solve[];
  allSolves: Solve[];
  sessions: CubeSession[];
  currentSessionId: SessionId;
  corrupted: boolean;
  syncStatus: ReturnType<ReturnType<typeof getSolveRepository>["getSyncStatus"]>;
  addSolve: (solve: Solve) => void;
  updatePenalty: (id: SolveId, penalty: Penalty) => void;
  deleteSolve: (id: SolveId) => void;
  deleteSessions: (ids: SessionId[]) => void;
  clearAll: () => void;
}

export function useSession(): UseSessionResult {
  const repo = useMemo(() => getSolveRepository(), []);

  const [state, setState] = useState(() => repo.loadInitialState());

  const addSolve = useCallback(
    (solve: Solve) => {
      const withSession: Solve = { ...solve, sessionId: state.currentSessionId };
      const result = repo.appendSolve(withSession);
      if (!result.ok) {
        console.error("[useSession] Failed to save solve:", result.error);
        setState((prev) => ({ ...prev, allSolves: [...prev.allSolves, withSession] }));
        return;
      }
      setState((prev) => ({ ...prev, allSolves: result.data }));
    },
    [repo, state.currentSessionId]
  );

  const updatePenalty = useCallback(
    (id: SolveId, penalty: Penalty) => {
      const result = repo.updatePenalty(id, penalty);
      if (!result.ok) {
        console.error("[useSession] Failed to update penalty:", result.error);
        return;
      }
      setState((prev) => ({ ...prev, allSolves: result.data }));
    },
    [repo]
  );

  const deleteSolve = useCallback(
    (id: SolveId) => {
      const result = repo.deleteSolve(id);
      if (!result.ok) {
        console.error("[useSession] Failed to delete solve:", result.error);
        setState((prev) => ({ ...prev, allSolves: prev.allSolves.filter((s) => s.id !== id) }));
        return;
      }
      setState((prev) => ({ ...prev, allSolves: result.data }));
    },
    [repo]
  );

  const deleteSessions = useCallback(
    (ids: SessionId[]) => {
      const result = repo.deleteSessions(ids);
      if (!result.ok) {
        console.error("[useSession] Failed to delete sessions:", result.error);
        return;
      }
      setState((prev) => ({
        ...prev,
        sessions: result.data.sessions,
        allSolves: result.data.solves,
      }));
    },
    [repo]
  );

  const clearAll = useCallback(() => {
    repo.clearAll();
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id === prev.currentSessionId),
      allSolves: [],
    }));
  }, [repo]);

  const solves = state.allSolves.filter((s) => s.sessionId === state.currentSessionId);

  return {
    solves,
    allSolves: state.allSolves,
    sessions: state.sessions,
    currentSessionId: state.currentSessionId,
    corrupted: state.corrupted,
    syncStatus: repo.getSyncStatus(),
    addSolve,
    updatePenalty,
    deleteSolve,
    deleteSessions,
    clearAll,
  };
}