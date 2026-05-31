import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  applyPenalty,
  computeInspectionPenalty,
  formatTime,
  getInspectionWarning,
  playBeep,
  vibrate,
} from "./timerEngine";
import type { Penalty, TimerAction, TimerSnapshot } from "./types";

// ─── Machine state ────────────────────────────────────────────────────────────

interface MachineState {
  snapshot: TimerSnapshot;
  inspectionStartMs: number | null;
  solveStartMs: number | null;
}

const INITIAL: MachineState = {
  snapshot: { state: "idle" },
  inspectionStartMs: null,
  solveStartMs: null,
};

// ─── Pure reducer ─────────────────────────────────────────────────────────────

function reducer(state: MachineState, action: TimerAction & { nowMs: number }): MachineState {
  const { snapshot, inspectionStartMs, solveStartMs } = state;
  const now = action.nowMs;

  switch (action.type) {
    case "PRESS_READY": {
      if (snapshot.state !== "idle") return state;
      return { ...state, snapshot: { state: "ready" } };
    }

    case "START_INSPECTION": {
      if (snapshot.state !== "idle" && snapshot.state !== "ready") return state;
      return {
        snapshot: { state: "inspection", remainingMs: 15000, elapsedMs: 0, warning: null },
        inspectionStartMs: now,
        solveStartMs: null,
      };
    }

    case "START_SOLVE": {
      if (
        snapshot.state !== "idle" &&
        snapshot.state !== "ready" &&
        snapshot.state !== "inspection"
      ) return state;
      const penalty: Penalty =
        inspectionStartMs !== null ? computeInspectionPenalty(now - inspectionStartMs) : "OK";
      return {
        ...state,
        solveStartMs: now,
        snapshot: { state: "running", elapsedMs: 0, penalty },
      };
    }

    case "STOP_SOLVE": {
      if (snapshot.state !== "running" || solveStartMs === null) return state;
      const rawMs = Math.round(now - solveStartMs);
      const { penalty } = snapshot;
      return {
        ...state,
        solveStartMs: null,
        snapshot: { state: "stopped", rawMs, penalty, finalMs: applyPenalty(rawMs, penalty) },
      };
    }

    case "SET_PENALTY": {
      if (snapshot.state !== "stopped") return state;
      return {
        ...state,
        snapshot: {
          ...snapshot,
          penalty: action.penalty,
          finalMs: applyPenalty(snapshot.rawMs, action.penalty),
        },
      };
    }

    case "RESET": {
      return INITIAL;
    }

    case "TICK": {
      if (snapshot.state === "inspection" && inspectionStartMs !== null) {
        const elapsedMs = now - inspectionStartMs;
        return {
          ...state,
          snapshot: {
            state: "inspection",
            elapsedMs,
            remainingMs: Math.max(0, 15000 - elapsedMs),
            warning: getInspectionWarning(elapsedMs),
          },
        };
      }
      if (snapshot.state === "running" && solveStartMs !== null) {
        return { ...state, snapshot: { ...snapshot, elapsedMs: now - solveStartMs } };
      }
      return state;
    }

    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

export interface UseTimerMachineConfig {
  inspectionEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  /** Called once when STOP_SOLVE fires. */
  onSolveComplete: (result: {
    rawMs: number;
    penalty: Penalty;
    finalMs: number | null;
    inspectionMs: number;
  }) => void;
}

// ─── Public interface ─────────────────────────────────────────────────────────

export interface UseTimerMachineResult {
  snapshot: TimerSnapshot;
  displayValue: string;
  timerColorClass: string;
  /** True when user is holding Space (ready to release-to-start). */
  isHolding: boolean;
  startInspection: () => void;
  startSolve: () => void;
  stopSolve: () => void;
  setPenalty: (p: Penalty) => void;
  reset: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTimerMachine(config: UseTimerMachineConfig): UseTimerMachineResult {
  const configRef = useRef(config);
  configRef.current = config;

  // Inject performance.now() so the reducer stays pure
  const [state, rawDispatch] = useReducer(
    (s: MachineState, a: TimerAction) => reducer(s, { ...a, nowMs: performance.now() }),
    INITIAL
  );

  const stateRef = useRef(state);
  stateRef.current = state;

  const dispatch = useCallback((action: TimerAction) => rawDispatch(action), []);

  const startInspection = useCallback(() => dispatch({ type: "START_INSPECTION" }), [dispatch]);
  const startSolve      = useCallback(() => dispatch({ type: "START_SOLVE" }), [dispatch]);
  const stopSolve       = useCallback(() => dispatch({ type: "STOP_SOLVE" }), [dispatch]);
  const setPenalty      = useCallback((p: Penalty) => dispatch({ type: "SET_PENALTY", penalty: p }), [dispatch]);
  const reset           = useCallback(() => dispatch({ type: "RESET" }), [dispatch]);

  // ─── Hold-space state ──────────────────────────────────────────────────────
  // spaceHeld is true when user holds Space during inspection (for green flash).
  // The "ready" snapshot state covers the idle-hold case.
  const [spaceHeld, setSpaceHeld] = useState(false);
  const spaceHeldRef = useRef(false); // ref so keyup handler reads latest value without stale closure

  // ─── Tick interval ─────────────────────────────────────────────────────────

  useEffect(() => {
    const s = state.snapshot.state;
    if (s !== "inspection" && s !== "running") return;
    const id = setInterval(() => dispatch({ type: "TICK" }), 16);
    return () => clearInterval(id);
  }, [state.snapshot.state, dispatch]);

  // ─── Side-effects on transitions ───────────────────────────────────────────

  const prevStateRef = useRef<string>("idle");

  useEffect(() => {
    const snap = state.snapshot;
    const prev = prevStateRef.current;
    prevStateRef.current = snap.state;
    const { soundEnabled, vibrationEnabled, onSolveComplete } = configRef.current;

    if (snap.state === "inspection" && prev !== "inspection") {
      if (soundEnabled) playBeep(440, 100);
      if (vibrationEnabled) vibrate(50);
    }

    if (snap.state === "stopped" && prev !== "stopped") {
      if (soundEnabled) playBeep(660, 100);
      if (vibrationEnabled) vibrate(100);
      onSolveComplete({
        rawMs: snap.rawMs,
        penalty: snap.penalty,
        finalMs: snap.finalMs,
        inspectionMs:
          state.inspectionStartMs !== null && state.solveStartMs !== null
            ? Math.round(state.solveStartMs - state.inspectionStartMs)
            : 0,
      });
    }

    // Clear spaceHeld whenever we leave inspection
    if (prev === "inspection" && snap.state !== "inspection") {
      spaceHeldRef.current = false;
      setSpaceHeld(false);
    }
  }, [state.snapshot.state]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Warning beeps ─────────────────────────────────────────────────────────

  const prevWarningRef = useRef<string | null>(null);
  useEffect(() => {
    if (state.snapshot.state !== "inspection") { prevWarningRef.current = null; return; }
    const { warning } = state.snapshot;
    if (warning && warning !== prevWarningRef.current) {
      prevWarningRef.current = warning;
      if (configRef.current.soundEnabled) playBeep(880, 80);
      if (configRef.current.vibrationEnabled) vibrate(80);
    }
  }, [state.snapshot]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Keyboard handler (hold-space pattern) ─────────────────────────────────
  // WCA-style: hold Space → timer goes green ("ready") → release → start.
  // Running state stops immediately on keydown (no hold needed).

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.repeat) return; // ignore auto-repeat from holding key down
      e.preventDefault();

      const snap = stateRef.current.snapshot;
      if (snap.state === "idle") {
        dispatch({ type: "PRESS_READY" });
      } else if (snap.state === "inspection") {
        spaceHeldRef.current = true;
        setSpaceHeld(true);
      } else if (snap.state === "running") {
        stopSolve();
      }
      // "ready"   → key already held, do nothing
      // "stopped" → handled by TimerPanel's own keydown listener
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      e.preventDefault();

      const snap = stateRef.current.snapshot;
      if (snap.state === "ready") {
        // Release from idle-hold → start inspection or solve
        configRef.current.inspectionEnabled ? startInspection() : startSolve();
      } else if (snap.state === "inspection" && spaceHeldRef.current) {
        // Release during inspection → start solve
        spaceHeldRef.current = false;
        setSpaceHeld(false);
        startSolve();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [dispatch, startInspection, startSolve, stopSolve]);

  // ─── Derived display ───────────────────────────────────────────────────────

  const snap = state.snapshot;

  const displayValue = (() => {
    if (snap.state === "inspection") return String(Math.max(0, Math.ceil(snap.remainingMs / 1000)));
    if (snap.state === "running")    return formatTime(snap.elapsedMs);
    if (snap.state === "stopped")    return snap.penalty === "DNF" ? "DNF" : formatTime(snap.finalMs ?? snap.rawMs);
    return "0.00";
  })();

  const isHolding = snap.state === "ready" || spaceHeld;

  const timerColorClass = (() => {
    if (snap.state === "ready")   return "text-green-400";
    if (snap.state === "running") return "text-green-400";
    if (snap.state === "stopped") {
      if (snap.penalty === "DNF") return "text-red-400";
      if (snap.penalty === "+2")  return "text-amber-400";
      return "text-white";
    }
    if (snap.state === "inspection") {
      if (spaceHeld) return "text-green-400"; // holding → about to start solve
      if (snap.elapsedMs > 12000) return "text-red-400";
      if (snap.elapsedMs > 8000)  return "text-amber-400";
      return "text-cyan-400";
    }
    return "text-white/70";
  })();

  return {
    snapshot: snap,
    displayValue,
    timerColorClass,
    isHolding,
    startInspection,
    startSolve,
    stopSolve,
    setPenalty,
    reset,
  };
}
