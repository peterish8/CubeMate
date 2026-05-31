import { useCallback, useState } from "react";
import {
  appendSolve,
  clearAll as storagelearAll,
  createSession,
  deleteSessions as storageDeleteSessions,
  deleteSolve as storageDeleteSolve,
  loadSessions,
  loadSolves,
  saveSolves,
  updateSolvePenalty,
} from "../lib/storage";
import type { CubeSession, Penalty, SessionId, Solve, SolveId } from "../lib/types";

export interface UseSessionResult {
  /** Solves from the current visit's session only — for SessionStats */
  solves: Solve[];
  /** Every solve ever stored */
  allSolves: Solve[];
  /** All session metadata, oldest first */
  sessions: CubeSession[];
  currentSessionId: SessionId;
  corrupted: boolean;
  addSolve: (solve: Solve) => void;
  updatePenalty: (id: SolveId, penalty: Penalty) => void;
  deleteSolve: (id: SolveId) => void;
  deleteSessions: (ids: SessionId[]) => void;
  clearAll: () => void;
}

export function useSession(): UseSessionResult {
  // All state is initialised atomically so storage reads/writes happen in the right order.
  const [state, setState] = useState<{
    sessions: CubeSession[];
    allSolves: Solve[];
    currentSessionId: SessionId;
    corrupted: boolean;
  }>(() => {
    let existingSessions = (() => {
      const r = loadSessions();
      return r.ok ? r.data : [];
    })();

    let existingSolves = (() => {
      const r = loadSolves();
      return r.ok ? r.data : [];
    })();

    // Migrate legacy solves that pre-date the session system
    const legacySolves = existingSolves.filter((s) => !s.sessionId);
    if (legacySolves.length > 0) {
      // Assign them to the earliest existing session, or create a "Legacy" one
      let legacyId: SessionId;
      if (existingSessions.length > 0) {
        legacyId = existingSessions[0].id;
      } else {
        const legacy: CubeSession = {
          id: ("legacy-" + legacySolves[0].startedAt) as SessionId,
          startedAt: legacySolves[0].startedAt,
          label: "Legacy Session",
        };
        existingSessions = [legacy];
        legacyId = legacy.id;
      }
      existingSolves = existingSolves.map((s) =>
        s.sessionId ? s : { ...s, sessionId: legacyId }
      );
      saveSolves(existingSolves);
    }

    // Reuse the session from this browser tab if it still exists in storage,
    // otherwise create a new one. This lets the user leave a room and join
    // another without starting a brand-new session every time.
    const SESSION_TAB_KEY = "cubemate_current_session_id";
    const tabSessionId = sessionStorage.getItem(SESSION_TAB_KEY) as SessionId | null;
    const reuseSession =
      tabSessionId != null &&
      existingSessions.some((s) => s.id === tabSessionId);

    let currentSessionId: SessionId;
    let allSessions: CubeSession[];

    if (reuseSession) {
      currentSessionId = tabSessionId!;
      allSessions = existingSessions;
    } else {
      const sessionResult = createSession();
      allSessions = (() => {
        const r = loadSessions();
        return r.ok ? r.data : [...existingSessions];
      })();
      currentSessionId = sessionResult.ok
        ? sessionResult.data.id
        : (("fallback-" + Date.now()) as SessionId);
      sessionStorage.setItem(SESSION_TAB_KEY, currentSessionId);
    }

    // Ensure the current session always appears in the list (guards against createSession failure)
    const sessions = allSessions.find((s) => s.id === currentSessionId)
      ? allSessions
      : [
          ...allSessions,
          {
            id: currentSessionId,
            startedAt: Date.now(),
            label: `Session ${allSessions.length + 1}`,
          } as CubeSession,
        ];

    return { sessions, allSolves: existingSolves, currentSessionId, corrupted: false };
  });

  const addSolve = useCallback(
    (solve: Solve) => {
      const withSession: Solve = { ...solve, sessionId: state.currentSessionId };
      const result = appendSolve(withSession);
      if (!result.ok) {
        console.error("[useSession] Failed to save solve:", result.error);
        setState((prev) => ({ ...prev, allSolves: [...prev.allSolves, withSession] }));
        return;
      }
      setState((prev) => ({ ...prev, allSolves: result.data }));
    },
    [state.currentSessionId]
  );

  const updatePenalty = useCallback((id: SolveId, penalty: Penalty) => {
    const result = updateSolvePenalty(id, penalty);
    if (!result.ok) {
      console.error("[useSession] Failed to update penalty:", result.error);
      return;
    }
    setState((prev) => ({ ...prev, allSolves: result.data }));
  }, []);

  const deleteSolve = useCallback((id: SolveId) => {
    const result = storageDeleteSolve(id);
    if (!result.ok) {
      console.error("[useSession] Failed to delete solve:", result.error);
      setState((prev) => ({ ...prev, allSolves: prev.allSolves.filter((s) => s.id !== id) }));
      return;
    }
    setState((prev) => ({ ...prev, allSolves: result.data }));
  }, []);

  const deleteSessions = useCallback((ids: SessionId[]) => {
    const result = storageDeleteSessions(ids);
    if (!result.ok) {
      console.error("[useSession] Failed to delete sessions:", result.error);
      return;
    }
    setState((prev) => ({
      ...prev,
      sessions: result.data.sessions,
      allSolves: result.data.solves,
    }));
  }, []);

  const clearAll = useCallback(() => {
    storagelearAll();
    setState((prev) => ({
      ...prev,
      // Keep the current (empty) session so the UI stays coherent
      sessions: prev.sessions.filter((s) => s.id === prev.currentSessionId),
      allSolves: [],
    }));
  }, []);

  const solves = state.allSolves.filter((s) => s.sessionId === state.currentSessionId);

  return {
    solves,
    allSolves: state.allSolves,
    sessions: state.sessions,
    currentSessionId: state.currentSessionId,
    corrupted: state.corrupted,
    addSolve,
    updatePenalty,
    deleteSolve,
    deleteSessions,
    clearAll,
  };
}
