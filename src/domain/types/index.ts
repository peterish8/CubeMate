// ─── Branded primitives ───────────────────────────────────────────────────────
// Prevents accidentally passing a SolveId where a RoomCode is expected (and vice versa).

export type RoomCode  = string & { readonly __brand: "RoomCode" };
export type SolveId   = string & { readonly __brand: "SolveId" };
export type SessionId = string & { readonly __brand: "SessionId" };

export function toRoomCode(s: string):  RoomCode  { return s as RoomCode; }
export function toSolveId(s: string):   SolveId   { return s as SolveId; }
export function toSessionId(s: string): SessionId { return s as SessionId; }

// ─── Session ──────────────────────────────────────────────────────────────────

export interface CubeSession {
  id: SessionId;
  startedAt: number;
  label: string;
}

// ─── Result type ──────────────────────────────────────────────────────────────
// Callers cannot ignore errors — they must handle both branches.

export type Result<T> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── Domain enums ─────────────────────────────────────────────────────────────

export type CubeEvent =
  | "333" | "222" | "444" | "555" | "666" | "777"
  | "333bf" | "333fm" | "333oh"
  | "clock" | "minx" | "pyram" | "skewb" | "sq1"
  | "444bf" | "555bf" | "333mbf";

export const WCA_EVENTS: { id: CubeEvent; label: string }[] = [
  { id: "333",    label: "3×3×3" },
  { id: "222",    label: "2×2×2" },
  { id: "444",    label: "4×4×4" },
  { id: "555",    label: "5×5×5" },
  { id: "666",    label: "6×6×6" },
  { id: "777",    label: "7×7×7" },
  { id: "333oh",  label: "3×3 OH" },
  { id: "333bf",  label: "3×3 BLD" },
  { id: "333fm",  label: "3×3 FM" },
  { id: "pyram",  label: "Pyraminx" },
  { id: "skewb",  label: "Skewb" },
  { id: "clock",  label: "Clock" },
  { id: "minx",   label: "Megaminx" },
  { id: "sq1",    label: "Square-1" },
  { id: "444bf",  label: "4×4 BLD" },
  { id: "555bf",  label: "5×5 BLD" },
  { id: "333mbf", label: "Multi BLD" },
];

export type Penalty = "OK" | "+2" | "DNF";

// ─── Timer state machine ──────────────────────────────────────────────────────
// Discriminated union: each state carries only the fields that actually exist in it.
// This replaces the flat string union + scattered refs pattern.

export type TimerSnapshot =
  | { state: "idle" }
  | { state: "inspection"; remainingMs: number; elapsedMs: number; warning: string | null }
  | { state: "running";    elapsedMs: number; penalty: Penalty }
  | { state: "stopped";   rawMs: number; penalty: Penalty; finalMs: number | null }
  | { state: "ready" };

// Legacy string union kept for sync messages / opponent state
export type TimerState = TimerSnapshot["state"];

// ─── Timer machine actions ────────────────────────────────────────────────────

export type TimerAction =
  | { type: "START_INSPECTION" }
  | { type: "START_SOLVE" }
  | { type: "STOP_SOLVE" }
  | { type: "SET_PENALTY"; penalty: Penalty }
  | { type: "RESET" }
  | { type: "TICK"; nowMs?: number } // nowMs injected by hook; optional so callers can omit it
  | { type: "PRESS_READY" };         // space held in idle → green "ready" display

// ─── Solve ────────────────────────────────────────────────────────────────────

export interface Solve {
  id: SolveId;
  sessionId?: SessionId;
  event: CubeEvent;
  scramble: string;
  rawTimeMs: number;
  penalty: Penalty;
  finalTimeMs: number | null;
  inspectionMs: number;
  startedAt: number;
  endedAt: number;
  dateISO: string;
  comment?: string;
}

// ─── Sync messages ────────────────────────────────────────────────────────────
// Exhaustive: if a new type is added, TypeScript will error on any unhandled switch branch.

export type MatchN = 1 | 3 | 5;

export interface RoundResult {
  round: number;
  myTime: number | null;
  oppTime: number | null;
  winner: "me" | "opponent" | "tie";
}

export type SyncMessage =
  | { type: "EVENT_CHANGED";  event: CubeEvent }
  | { type: "SCRAMBLE_CHANGED"; event: CubeEvent; scramble: string }
  | { type: "INSPECTION_STARTED"; at: number }
  | { type: "TIMER_STARTED"; at: number }
  | { type: "TIMER_STOPPED"; at: number; rawTimeMs: number; penalty: Penalty; finalTimeMs: number | null; solveId: SolveId }
  | { type: "PENALTY_CHANGED"; penalty: Penalty; solveId: SolveId }
  | { type: "STATE_CHANGED"; state: TimerState }
  | { type: "MATCH_CONFIG"; n: MatchN }
  | { type: "MATCH_RESET" };

// Helper — triggers a compile error if a switch is missing a case
export function assertNever(x: never): never {
  throw new Error(`Unhandled sync message type: ${JSON.stringify(x)}`);
}

// ─── Opponent state ───────────────────────────────────────────────────────────

export interface OpponentState {
  event: CubeEvent;
  state: TimerState;
  latestTime: number | null;
  latestPenalty: Penalty;
  connected: boolean;
  solveCount: number;
}

// ─── Session stats ────────────────────────────────────────────────────────────

export interface SessionStats {
  count: number;
  best: number | null;
  worst: number | null;
  mean: number | null;
  stdDev: number | null;
  ao5: number | null;
  ao12: number | null;
  ao50: number | null;
  ao100: number | null;
}
