import type { CubeSession, Penalty, SessionId, Solve, SolveId } from "../../domain/types";
import { outboxClear, outboxCount, outboxEnqueue, outboxList, outboxRemove, type OutboxOp } from "./outbox";

export interface InsertSolvePayload {
  solve: Solve;
  session: CubeSession;
}

export interface CloudSyncHooks {
  isAuthenticated: () => boolean;
  ensureConvexSession: (session: CubeSession) => Promise<string>;
  insertSolve: (convexSessionId: string, solve: Solve) => Promise<void>;
  updatePenalty: (solveId: SolveId, penalty: Penalty) => Promise<void>;
  softDeleteSolve: (solveId: SolveId) => Promise<void>;
  bulkImportGuestData: (sessions: CubeSession[], solves: Solve[]) => Promise<void>;
}

let hooks: CloudSyncHooks | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;

const FLUSH_DEBOUNCE_MS = 5000;
const SESSION_MAP_KEY = "cubemate_convex_session_map";

export function setCloudSyncHooks(next: CloudSyncHooks | null): void {
  hooks = next;
  if (!next) {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = null;
  }
}

export function getCloudSyncHooks(): CloudSyncHooks | null {
  return hooks;
}

function loadSessionMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(SESSION_MAP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveSessionMap(map: Record<string, string>): void {
  localStorage.setItem(SESSION_MAP_KEY, JSON.stringify(map));
}

export function rememberConvexSession(clientSessionId: SessionId, convexSessionId: string): void {
  const map = loadSessionMap();
  map[clientSessionId] = convexSessionId;
  saveSessionMap(map);
}

export function getConvexSessionId(clientSessionId: SessionId): string | undefined {
  return loadSessionMap()[clientSessionId];
}

export function scheduleCloudFlush(): void {
  if (!hooks?.isAuthenticated()) return;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushOutbox();
  }, FLUSH_DEBOUNCE_MS);
}

export async function flushOutbox(): Promise<void> {
  if (!hooks?.isAuthenticated() || flushing) return;
  flushing = true;
  try {
    const ops = await outboxList();
    for (const op of ops) {
      const ok = await processOp(op);
      if (ok) await outboxRemove(op.id);
      else break;
    }
  } finally {
    flushing = false;
  }
}

async function processOp(op: OutboxOp): Promise<boolean> {
  if (!hooks) return false;
  try {
    if (op.type === "insert_solve") {
      const { solve, session } = op.payload as InsertSolvePayload;
      const convexSessionId = await hooks.ensureConvexSession(session);
      await hooks.insertSolve(convexSessionId, solve);
      return true;
    }
    if (op.type === "update_penalty") {
      const { solveId, penalty } = op.payload as { solveId: SolveId; penalty: Penalty };
      await hooks.updatePenalty(solveId, penalty);
      return true;
    }
    if (op.type === "delete_solve") {
      const { solveId } = op.payload as { solveId: SolveId };
      await hooks.softDeleteSolve(solveId);
      return true;
    }
    return true;
  } catch (err) {
    console.warn("[cloudSync] flush op failed:", op.type, err);
    return false;
  }
}

export async function enqueueSolveSync(solve: Solve, session: CubeSession): Promise<void> {
  if (!hooks?.isAuthenticated()) return;
  await outboxEnqueue({
    id: `solve-${solve.id}`,
    type: "insert_solve",
    payload: { solve, session } satisfies InsertSolvePayload,
    createdAt: Date.now(),
  });
  scheduleCloudFlush();
}

export async function enqueuePenaltySync(solveId: SolveId, penalty: Penalty): Promise<void> {
  if (!hooks?.isAuthenticated()) return;
  // Stable ID: one outbox slot per solve — later updates overwrite earlier ones
  // via IndexedDB's put() semantics, so we never accumulate stale penalty ops.
  await outboxEnqueue({
    id: `penalty-${solveId}`,
    type: "update_penalty",
    payload: { solveId, penalty },
    createdAt: Date.now(),
  });
  scheduleCloudFlush();
}

export async function enqueueDeleteSolveSync(solveId: SolveId): Promise<void> {
  if (!hooks?.isAuthenticated()) return;
  // Stable ID: if already queued for insert, this replaces it — net result is
  // a single delete op with no orphaned insert to flush.
  await outboxEnqueue({
    id: `delete-${solveId}`,
    type: "delete_solve",
    payload: { solveId },
    createdAt: Date.now(),
  });
  scheduleCloudFlush();
}

export async function getPendingSyncCount(): Promise<number> {
  return outboxCount();
}

export async function clearCloudSyncState(): Promise<void> {
  await outboxClear();
  localStorage.removeItem(SESSION_MAP_KEY);
  localStorage.removeItem("cubemate_guest_merged");
}

const MERGED_KEY = "cubemate_guest_merged";

export function hasMergedGuestData(): boolean {
  return localStorage.getItem(MERGED_KEY) === "1";
}

export function markGuestDataMerged(): void {
  localStorage.setItem(MERGED_KEY, "1");
}

export async function runGuestMergeIfNeeded(
  sessions: CubeSession[],
  solves: Solve[]
): Promise<void> {
  if (!hooks?.isAuthenticated() || hasMergedGuestData()) return;
  try {
    await hooks.bulkImportGuestData(sessions, solves);
    markGuestDataMerged();
    await outboxClear();
  } catch (err) {
    console.warn("[cloudSync] guest merge failed:", err);
  }
}
