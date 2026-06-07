import { useCallback, useEffect, useRef, useState } from "react";
import { generateScramble } from "../../domain/scramble/generateScramble";
import { useTimerMachine } from "../../domain/timer/useTimerMachine";
import { formatTime } from "../../domain/timer/timerEngine";
import type { CubeEvent, Penalty, Solve, SolveId, SyncMessage } from "../../domain/types";
import { toSolveId } from "../../domain/types";
import { EventDropdown } from "./EventDropdown";
import { ScrambleViewer } from "./ScrambleViewer";

interface TimerPanelProps {
  onSolveComplete: (solve: Solve) => void;
  onPenaltyChange: (id: SolveId, penalty: Penalty) => void;
  onSync: (msg: SyncMessage) => void;
  inspectionEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  syncEnabled: boolean;
  onSyncEnabledChange: (v: boolean) => void;
  cinematic?: boolean;
  onEventChange?: (event: CubeEvent) => void;
  soloLevelingMode?: boolean;
  fullStage?: boolean;
}

function makeId(): SolveId {
  const raw =
    typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return toSolveId(raw);
}

function getTimerGlowClass(state: string, penalty: string): string {
  if (state === "running" || state === "ready") return "timer-glow-green";
  if (state === "inspection") return "timer-glow-amber";
  if (state === "stopped") {
    if (penalty === "DNF") return "timer-glow-red";
    if (penalty === "+2") return "timer-glow-amber";
    return "timer-glow-white";
  }
  return "";
}

function getStateLabel(state: string, isHolding: boolean): string {
  switch (state) {
    case "idle":
      return "READY";
    case "ready":
      return "HOLDING";
    case "inspection":
      return isHolding ? "HOLDING" : "INSPECTION";
    case "running":
      return "TIMING";
    case "stopped":
      return "STOPPED";
    default:
      return "";
  }
}

function getStateLabelColor(state: string, isHolding: boolean): string {
  switch (state) {
    case "idle":
      return "text-white/20";
    case "ready":
      return "text-green-400/60";
    case "inspection":
      return isHolding ? "text-green-400/60" : "text-amber-400/50";
    case "running":
      return "text-green-400/50";
    case "stopped":
      return "text-white/25";
    default:
      return "";
  }
}

export function TimerPanel({
  onSolveComplete,
  onPenaltyChange,
  onSync,
  inspectionEnabled,
  soundEnabled,
  vibrationEnabled,
  syncEnabled,
  onSyncEnabledChange,
  cinematic = false,
  onEventChange,
  soloLevelingMode = false,
  fullStage = false,
}: TimerPanelProps) {
  const [event, setEventState] = useState<CubeEvent>("333");
  const [scramble, setScramble] = useState("Generating…");
  const [systemResultFlash, setSystemResultFlash] = useState<"success" | "fail" | null>(null);
  const [touchHolding, setTouchHolding] = useState(false);
  const [touchMode, setTouchMode] = useState(false);

  const lastSolveIdRef = useRef<SolveId | null>(null);
  const eventRef = useRef(event);
  const scrambleRef = useRef(scramble);
  const syncEnabledRef = useRef(syncEnabled);
  const flashTimeoutRef = useRef<number | null>(null);
  const previousStateRef = useRef("idle");
  eventRef.current = event;
  scrambleRef.current = scramble;
  syncEnabledRef.current = syncEnabled;

  const syncMsg = useCallback(
    (msg: SyncMessage) => {
      if (syncEnabledRef.current) onSync(msg);
    },
    [onSync]
  );

  const machine = useTimerMachine({
    inspectionEnabled,
    soundEnabled,
    vibrationEnabled,
    onSolveComplete: useCallback(
      ({ rawMs, penalty, finalMs, inspectionMs }) => {
        const id = makeId();
        lastSolveIdRef.current = id;

        const solve: Solve = {
          id,
          event: eventRef.current,
          scramble: scrambleRef.current,
          rawTimeMs: rawMs,
          penalty,
          finalTimeMs: finalMs,
          inspectionMs,
          startedAt: Date.now() - rawMs,
          endedAt: Date.now(),
          dateISO: new Date().toISOString(),
        };

        onSolveComplete(solve);
        syncMsg({
          type: "TIMER_STOPPED",
          at: Date.now(),
          rawTimeMs: rawMs,
          penalty,
          finalTimeMs: finalMs,
          solveId: id,
        });
      },
      [onSolveComplete, syncMsg]
    ),
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (machine.snapshot.state === "stopped") {
        e.preventDefault();
        handleNewScramble();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    const updateTouchMode = () => setTouchMode(media.matches || navigator.maxTouchPoints > 0);
    updateTouchMode();
    media.addEventListener?.("change", updateTouchMode);
    return () => media.removeEventListener?.("change", updateTouchMode);
  }, []);

  const fetchScramble = useCallback(async (ev: CubeEvent) => {
    setScramble("Generating…");
    const nextScramble = await generateScramble(ev);
    setScramble(nextScramble);
    scrambleRef.current = nextScramble;
    return nextScramble;
  }, []);

  const handleNewScramble = useCallback(async () => {
    machine.reset();
    const nextScramble = await fetchScramble(eventRef.current);
    syncMsg({ type: "SCRAMBLE_CHANGED", event: eventRef.current, scramble: nextScramble });
  }, [machine, fetchScramble, syncMsg]);

  const handleEventChange = useCallback(
    async (ev: CubeEvent) => {
      setEventState(ev);
      eventRef.current = ev;
      onEventChange?.(ev);
      machine.reset();
      const nextScramble = await fetchScramble(ev);
      syncMsg({ type: "EVENT_CHANGED", event: ev });
      syncMsg({ type: "SCRAMBLE_CHANGED", event: ev, scramble: nextScramble });
    },
    [machine, fetchScramble, onEventChange, syncMsg]
  );

  useEffect(() => {
    fetchScramble("333");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerSystemResultFeedback = useCallback(
    (type: "success" | "fail") => {
      if (!soloLevelingMode) return;
      setSystemResultFlash(type);
      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current);
      }
      flashTimeoutRef.current = window.setTimeout(() => {
        setSystemResultFlash(null);
        flashTimeoutRef.current = null;
      }, 520);
      playSystemResultChime(type);
    },
    [soloLevelingMode]
  );

  const handlePenaltyChange = useCallback(
    (penalty: Penalty) => {
      machine.setPenalty(penalty);
      const solveId = lastSolveIdRef.current;
      if (solveId) {
        onPenaltyChange(solveId, penalty);
        syncMsg({ type: "PENALTY_CHANGED", penalty, solveId });
      }
      if (penalty === "DNF" || penalty === "+2") {
        triggerSystemResultFeedback("fail");
      }
    },
    [machine, onPenaltyChange, syncMsg, triggerSystemResultFeedback]
  );

  const { snapshot, displayValue, timerColorClass, isHolding } = machine;
  const glowClass = getTimerGlowClass(snapshot.state, snapshot.state === "stopped" ? snapshot.penalty : "OK");
  const stoppedPenalty = snapshot.state === "stopped" ? snapshot.penalty : "OK";
  const effectiveHolding = isHolding || touchHolding;
  useEffect(() => {
    if (previousStateRef.current !== "stopped" && snapshot.state === "stopped") {
      triggerSystemResultFeedback(stoppedPenalty === "OK" ? "success" : "fail");
    }
    previousStateRef.current = snapshot.state;
  }, [snapshot.state, stoppedPenalty, triggerSystemResultFeedback]);

  useEffect(() => {
    if (snapshot.state !== "inspection") {
      setTouchHolding(false);
    }
  }, [snapshot.state]);

  const handleTouchStagePress = useCallback(() => {
    if (!touchMode) return;
    if (snapshot.state === "inspection") {
      setTouchHolding(true);
    }
  }, [snapshot.state, touchMode]);

  const handleTouchStageRelease = useCallback(() => {
    if (!touchMode) return;
    if (snapshot.state === "idle") {
      if (inspectionEnabled) {
        machine.startInspection();
      } else {
        machine.startSolve();
      }
      return;
    }
    if (snapshot.state === "inspection" && touchHolding) {
      setTouchHolding(false);
      machine.startSolve();
      return;
    }
    if (snapshot.state === "running") {
      machine.stopSolve();
      return;
    }
    if (snapshot.state === "stopped") {
      void handleNewScramble();
    }
  }, [handleNewScramble, inspectionEnabled, machine, snapshot.state, touchHolding, touchMode]);

  return (
    <div
      className={
        cinematic
          ? soloLevelingMode
            ? systemResultFlash === "success"
              ? "practice-timer-shell practice-timer-shell-system practice-timer-shell-system-success"
              : systemResultFlash === "fail"
                ? "practice-timer-shell practice-timer-shell-system practice-timer-shell-system-fail"
                : "practice-timer-shell practice-timer-shell-system"
            : "practice-timer-shell"
          : "flex flex-col h-full select-none"
      }
    >
      {cinematic && (
        <>
          <div className="practice-timer-spotlight" />
          <div className="practice-timer-bars practice-timer-bars-top" />
          <div className="practice-timer-bars practice-timer-bars-bottom" />
          {soloLevelingMode && <div className="practice-system-runes" aria-hidden="true" />}
          {soloLevelingMode && systemResultFlash && (
            <div
              className={
                systemResultFlash === "success"
                  ? "practice-system-result-flash practice-system-result-flash-success"
                  : "practice-system-result-flash practice-system-result-flash-fail"
              }
              aria-hidden="true"
            />
          )}
        </>
      )}

      <div className={cinematic ? "practice-timer-top" : "shrink-0 px-6 lg:px-10 pt-5 pb-3"}>
        {soloLevelingMode && (
          <div className="practice-system-card-header practice-system-card-header-wide">
            <span className="practice-system-tag">SYSTEM</span>
            <span className="practice-system-id">DAILY QUEST READY</span>
          </div>
        )}
        <div className={cinematic ? "practice-controls-row" : "flex items-center justify-between mb-3"}>
          <EventDropdown value={event} onChange={handleEventChange} />
          <Toggle label="Sync" value={syncEnabled} onChange={onSyncEnabledChange} cinematic={cinematic} />
        </div>

        <p
          className={
            cinematic
              ? soloLevelingMode
                ? "practice-scramble-copy practice-scramble-copy-system"
                : "practice-scramble-copy"
              : "text-white/55 text-base lg:text-lg font-mono tracking-wide text-center"
          }
        >
          {scramble}
        </p>
        <div className={cinematic ? "practice-scramble-divider" : "w-full h-px bg-white/[0.06] mt-3"} />
      </div>

      <div
        className={
          cinematic
            ? fullStage
              ? "practice-performance-grid practice-performance-grid-full"
              : "practice-performance-grid"
            : ""
        }
      >
        <div
          className={
            cinematic
              ? fullStage
                ? touchMode
                  ? "practice-timer-stage practice-timer-stage-full practice-timer-stage-touch"
                  : "practice-timer-stage practice-timer-stage-full"
                : touchMode
                  ? "practice-timer-stage practice-timer-stage-touch"
                  : "practice-timer-stage"
              : "flex-1 flex flex-col items-center justify-center min-h-0 relative px-4 touch-none"
          }
          onPointerDown={handleTouchStagePress}
          onPointerUp={handleTouchStageRelease}
          onPointerCancel={() => setTouchHolding(false)}
        >
          <div className="relative mb-2">
            <span
              className={`text-[10px] font-bold tracking-[0.2em] uppercase ${getStateLabelColor(snapshot.state, effectiveHolding)} ${
                snapshot.state === "ready" || (snapshot.state === "inspection" && effectiveHolding) ? "animate-pulse" : ""
              }`}
            >
              {getStateLabel(snapshot.state, effectiveHolding)}
            </span>
          </div>

          <div
            className={`relative timer-display ${cinematic ? "practice-timer-value" : "text-[clamp(4rem,16vw,18rem)]"} ${
              soloLevelingMode ? "practice-timer-value-system" : ""
            } ${timerColorClass} ${glowClass} transition-colors duration-200`}
          >
            {displayValue}
          </div>

          <div className="relative flex items-center gap-3 min-h-[24px] mt-1">
            {snapshot.state === "stopped" && snapshot.penalty !== "OK" && (
              <span className="text-xs text-white/30 font-mono">raw {formatTime(snapshot.rawMs)}</span>
            )}
            {snapshot.state === "inspection" && snapshot.warning && (
              <span
                className={`text-sm font-semibold ${
                  snapshot.warning === "DNF" || snapshot.warning === "+2" ? "text-red-400" : "text-amber-400"
                }`}
              >
                {snapshot.warning}
              </span>
            )}
          </div>

          <div className="relative min-h-[20px] flex items-center mt-1">
            {snapshot.state === "idle" && (
              <p className="text-white/25 text-xs">{touchMode ? "Tap to start inspection" : "Hold Space to start"}</p>
            )}
            {snapshot.state === "ready" && (
              <p className="text-green-400/70 text-xs font-medium animate-pulse">Release Space to start</p>
            )}
            {snapshot.state === "inspection" && !effectiveHolding && (
              <p className="text-white/25 text-xs">{touchMode ? "Hold and release to start solve" : "Hold Space to start solve"}</p>
            )}
            {snapshot.state === "inspection" && effectiveHolding && (
              <p className="text-green-400/70 text-xs font-medium animate-pulse">
                {touchMode ? "Release to start" : "Release Space to start"}
              </p>
            )}
            {snapshot.state === "running" && (
              <p className="text-white/25 text-xs">{touchMode ? "Tap to stop" : "Press Space to stop"}</p>
            )}
            {snapshot.state === "stopped" && (
              <p className="text-white/25 text-xs">{touchMode ? "Tap for next scramble" : "Press Space for next scramble"}</p>
            )}
          </div>

          {cinematic && <div className="practice-timer-floor" />}
        </div>

        <div
          className={
            cinematic
              ? soloLevelingMode
                ? fullStage
                  ? "practice-cube-well practice-cube-well-system practice-cube-well-full"
                  : "practice-cube-well practice-cube-well-system"
                : fullStage
                  ? "practice-cube-well practice-cube-well-full"
                  : "practice-cube-well"
              : "shrink-0 px-6 lg:px-10 pb-4 h-[160px] sm:h-[200px]"
          }
        >
          <div className={cinematic ? (soloLevelingMode ? "practice-cube-well-inner practice-cube-well-inner-system" : "practice-cube-well-inner") : ""}>
            <ScrambleViewer scramble={scramble} event={event} />
          </div>
        </div>
      </div>

      {soloLevelingMode && (
        <div className="practice-system-footer">
          <span>OBJECTIVE // CLEAR THE GATE</span>
          <span>EVENT // {event.toUpperCase()}</span>
          <span>MODE // SOLO LEVELING</span>
        </div>
      )}

      {snapshot.state === "stopped" && (
        <div className={cinematic ? "practice-penalty-row" : "shrink-0 flex gap-2 justify-center px-6 pb-5"}>
          <PenaltyButton
            label="+2"
            active={snapshot.penalty === "+2"}
            className="btn-warning"
            activeClass="bg-amber-500/40 border-amber-400/50 text-amber-300"
            onClick={() => handlePenaltyChange("+2")}
          />
          <PenaltyButton
            label="DNF"
            active={snapshot.penalty === "DNF"}
            className="btn-danger"
            activeClass="bg-red-500/40 border-red-400/50 text-red-300"
            onClick={() => handlePenaltyChange("DNF")}
          />
          <PenaltyButton
            label="Clear"
            active={snapshot.penalty === "OK"}
            className="btn-success"
            activeClass="bg-green-500/40 border-green-400/50 text-green-300"
            onClick={() => handlePenaltyChange("OK")}
          />
        </div>
      )}
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
  cinematic = false,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  cinematic?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <span className={cinematic ? "practice-sync-label" : "text-white/30 text-[11px]"}>{label}</span>
      <div
        onClick={() => onChange(!value)}
        className={`relative rounded-full transition-colors cursor-pointer ${value ? "bg-blue-600" : "bg-white/15"}`}
        style={{ width: "34px", height: "18px" }}
      >
        <div
          className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-[17px]" : "translate-x-0.5"
          }`}
        />
      </div>
    </label>
  );
}

function PenaltyButton({
  label,
  active,
  className,
  activeClass,
  onClick,
}: {
  label: string;
  active: boolean;
  className: string;
  activeClass: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={`btn touch-manipulation text-xs px-4 py-1.5 rounded-lg ${active ? activeClass : className}`}>
      {label}
    </button>
  );
}

function playSystemResultChime(type: "success" | "fail") {
  try {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const now = context.currentTime;
    const master = context.createGain();
    master.gain.value = type === "success" ? 0.05 : 0.06;
    master.connect(context.destination);

    const tones = type === "success" ? [523.25, 659.25, 783.99] : [311.13, 246.94, 196];
    tones.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type === "success" ? "triangle" : "sawtooth";
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.05);
      gain.gain.setValueAtTime(0.0001, now + index * 0.05);
      gain.gain.exponentialRampToValueAtTime(type === "success" ? 0.12 : 0.16, now + index * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.05 + 0.28);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(now + index * 0.05);
      oscillator.stop(now + index * 0.05 + 0.3);
    });

    window.setTimeout(() => {
      void context.close().catch(() => undefined);
    }, 700);
  } catch {
    // Ignore audio initialization failures.
  }
}
