import { applyPenalty } from "../../domain/timer/timerEngine";
import type { CubeSession, Penalty, Result, SessionId, Solve, SolveId } from "../../domain/types";
import { toSessionId } from "../../domain/types";
import type { SolveRepository } from "../SolveRepository";
import type { SessionStoreSnapshot, SyncStatus } from "../types";

const SOLVES_KEY = "cuberoom_solves";
const SESSIONS_KEY = "cuberoom_sessions";
const SCHEMA_VERSION = 1;

interface StoredData {
  version: number;
  solves: Solve[];
}

function genId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function migrate(data: StoredData): Result<Solve[]> {
  if (data.version === 0) return { ok: true, data: data.solves ?? [] };
  return { ok: false, error: `Unknown schema version ${data.version}` };
}

function loadSolves(): Result<Solve[]> {
  try {
    const raw = localStorage.getItem(SOLVES_KEY);
    if (!raw) return { ok: true, data: [] };
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return { ok: true, data: parsed as Solve[] };
    const stored = parsed as StoredData;
    if (stored.version === SCHEMA_VERSION) return { ok: true, data: stored.solves };
    return migrate(stored);
  } catch (err) {
    return { ok: false, error: `Failed to parse solve data: ${String(err)}` };
  }
}

function saveSolves(solves: Solve[]): Result<void> {
  try {
    localStorage.setItem(SOLVES_KEY, JSON.stringify({ version: SCHEMA_VERSION, solves }));
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: `Failed to save solves: ${String(err)}` };
  }
}

function loadSessions(): Result<CubeSession[]> {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return { ok: true, data: [] };
    return { ok: true, data: JSON.parse(raw) as CubeSession[] };
  } catch (err) {
    return { ok: false, error: `Failed to load sessions: ${String(err)}` };
  }
}

function saveSessions(sessions: CubeSession[]): Result<void> {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: `Failed to save sessions: ${String(err)}` };
  }
}

const SESSION_TAB_KEY = "cubemate_current_session_id";

function buildInitialState(): SessionStoreSnapshot {
  const sessionsResult = loadSessions();
  const solvesResult = loadSolves();
  const corrupted = !sessionsResult.ok || !solvesResult.ok;

  let existingSessions = sessionsResult.ok ? sessionsResult.data : [];
  let existingSolves = solvesResult.ok ? solvesResult.data : [];

  const legacySolves = existingSolves.filter((s) => !s.sessionId);
  if (legacySolves.length > 0) {
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

  const tabSessionId = sessionStorage.getItem(SESSION_TAB_KEY) as SessionId | null;
  const reuseSession =
    tabSessionId != null && existingSessions.some((s) => s.id === tabSessionId);

  let currentSessionId: SessionId;
  let allSessions: CubeSession[];

  if (reuseSession) {
    currentSessionId = tabSessionId!;
    allSessions = existingSessions;
  } else {
    const n = existingSessions.length + 1;
    const session: CubeSession = {
      id: toSessionId(genId()),
      startedAt: Date.now(),
      label: `Session ${n}`,
    };
    allSessions = [...existingSessions, session];
    saveSessions(allSessions);
    currentSessionId = session.id;
    sessionStorage.setItem(SESSION_TAB_KEY, currentSessionId);
  }

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

  return { sessions, allSolves: existingSolves, currentSessionId, corrupted };
}

export const localStorageRepository: SolveRepository = {
  loadInitialState: buildInitialState,

  appendSolve(solve) {
    const loaded = loadSolves();
    if (!loaded.ok) return loaded;
    const solves = [...loaded.data, solve];
    const saved = saveSolves(solves);
    if (!saved.ok) return saved;
    return { ok: true, data: solves };
  },

  updatePenalty(id, penalty) {
    const loaded = loadSolves();
    if (!loaded.ok) return loaded;
    const solves = loaded.data.map((s) =>
      s.id === id ? { ...s, penalty, finalTimeMs: applyPenalty(s.rawTimeMs, penalty) } : s
    );
    const saved = saveSolves(solves);
    if (!saved.ok) return saved;
    return { ok: true, data: solves };
  },

  deleteSolve(id) {
    const loaded = loadSolves();
    if (!loaded.ok) return loaded;
    const solves = loaded.data.filter((s) => s.id !== id);
    const saved = saveSolves(solves);
    if (!saved.ok) return saved;
    return { ok: true, data: solves };
  },

  deleteSessions(ids) {
    const idSet = new Set<string>(ids);
    const loadedSessions = loadSessions();
    if (!loadedSessions.ok) return { ok: false, error: loadedSessions.error };
    const loadedSolves = loadSolves();
    if (!loadedSolves.ok) return { ok: false, error: loadedSolves.error };

    const sessions = loadedSessions.data.filter((s) => !idSet.has(s.id));
    const solves = loadedSolves.data.filter((s) => !s.sessionId || !idSet.has(s.sessionId));

    const s1 = saveSessions(sessions);
    if (!s1.ok) return { ok: false, error: s1.error };
    const s2 = saveSolves(solves);
    if (!s2.ok) return { ok: false, error: s2.error };
    return { ok: true, data: { sessions, solves } };
  },

  clearAll() {
    try {
      localStorage.removeItem(SOLVES_KEY);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  },

  createSession() {
    const loaded = loadSessions();
    if (!loaded.ok) return { ok: false, error: loaded.error };
    const n = loaded.data.length + 1;
    const session: CubeSession = {
      id: toSessionId(genId()),
      startedAt: Date.now(),
      label: `Session ${n}`,
    };
    const saved = saveSessions([...loaded.data, session]);
    if (!saved.ok) return { ok: false, error: saved.error };
    return { ok: true, data: session };
  },

  saveSolves(solves) {
    return saveSolves(solves);
  },

  getSyncStatus() {
    return "idle" as SyncStatus;
  },
};