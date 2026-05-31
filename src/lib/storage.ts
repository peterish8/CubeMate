import { applyPenalty } from "./timerEngine";
import type { CubeSession, Penalty, Result, Solve, SessionId, SolveId } from "./types";
import { toSessionId } from "./types";

const SOLVES_KEY   = "cuberoom_solves";
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

// ─── Migration ────────────────────────────────────────────────────────────────

function migrate(data: StoredData): Result<Solve[]> {
  if (data.version === 0) return { ok: true, data: data.solves ?? [] };
  return { ok: false, error: `Unknown schema version ${data.version}` };
}

// ─── Solve storage ────────────────────────────────────────────────────────────

export function loadSolves(): Result<Solve[]> {
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

export function saveSolves(solves: Solve[]): Result<void> {
  try {
    localStorage.setItem(SOLVES_KEY, JSON.stringify({ version: SCHEMA_VERSION, solves }));
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: `Failed to save solves: ${String(err)}` };
  }
}

export function appendSolve(solve: Solve): Result<Solve[]> {
  const loaded = loadSolves();
  if (!loaded.ok) return loaded;
  const solves = [...loaded.data, solve];
  const saved = saveSolves(solves);
  if (!saved.ok) return saved;
  return { ok: true, data: solves };
}

export function updateSolvePenalty(id: SolveId, penalty: Penalty): Result<Solve[]> {
  const loaded = loadSolves();
  if (!loaded.ok) return loaded;
  const solves = loaded.data.map((s) =>
    s.id === id ? { ...s, penalty, finalTimeMs: applyPenalty(s.rawTimeMs, penalty) } : s
  );
  const saved = saveSolves(solves);
  if (!saved.ok) return saved;
  return { ok: true, data: solves };
}

export function deleteSolve(id: SolveId): Result<Solve[]> {
  const loaded = loadSolves();
  if (!loaded.ok) return loaded;
  const solves = loaded.data.filter((s) => s.id !== id);
  const saved = saveSolves(solves);
  if (!saved.ok) return saved;
  return { ok: true, data: solves };
}

export function clearSolves(): Result<void> {
  try {
    localStorage.removeItem(SOLVES_KEY);
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ─── Session storage ──────────────────────────────────────────────────────────

export function loadSessions(): Result<CubeSession[]> {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return { ok: true, data: [] };
    return { ok: true, data: JSON.parse(raw) as CubeSession[] };
  } catch (err) {
    return { ok: false, error: `Failed to load sessions: ${String(err)}` };
  }
}

export function saveSessions(sessions: CubeSession[]): Result<void> {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: `Failed to save sessions: ${String(err)}` };
  }
}

// Creates a new session (labelled "Session N") and persists it. Returns the new session.
export function createSession(): Result<CubeSession> {
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
}

// Deletes sessions and all their solves from storage.
export function deleteSessions(ids: SessionId[]): Result<{ sessions: CubeSession[]; solves: Solve[] }> {
  const idSet = new Set<string>(ids);
  const loadedSessions = loadSessions();
  if (!loadedSessions.ok) return { ok: false, error: loadedSessions.error };
  const loadedSolves = loadSolves();
  if (!loadedSolves.ok) return { ok: false, error: loadedSolves.error };

  const sessions = loadedSessions.data.filter((s) => !idSet.has(s.id));
  const solves   = loadedSolves.data.filter((s) => !s.sessionId || !idSet.has(s.sessionId));

  const s1 = saveSessions(sessions);
  if (!s1.ok) return { ok: false, error: s1.error };
  const s2 = saveSolves(solves);
  if (!s2.ok) return { ok: false, error: s2.error };
  return { ok: true, data: { sessions, solves } };
}

// Wipes all sessions and solves from localStorage.
export function clearAll(): Result<void> {
  try {
    localStorage.removeItem(SOLVES_KEY);
    localStorage.removeItem(SESSIONS_KEY);
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
