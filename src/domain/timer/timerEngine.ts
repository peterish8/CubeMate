import type { Penalty, TimerState } from "../types";

// Inspection thresholds in milliseconds
const INSPECTION_WARN_8S = 8000;
const INSPECTION_WARN_12S = 12000;
const INSPECTION_PLUS2_CUTOFF = 15000;
const INSPECTION_DNF_CUTOFF = 17000;

export interface TimerSnapshot {
  state: TimerState;
  displayMs: number;
  inspectionMs: number;
  inspectionWarning: string | null;
  penalty: Penalty;
}

export function computeInspectionPenalty(inspectionMs: number): Penalty {
  if (inspectionMs > INSPECTION_DNF_CUTOFF) return "DNF";
  if (inspectionMs > INSPECTION_PLUS2_CUTOFF) return "+2";
  return "OK";
}

export function getInspectionWarning(inspectionMs: number): string | null {
  if (inspectionMs >= INSPECTION_DNF_CUTOFF) return "DNF";
  if (inspectionMs >= INSPECTION_PLUS2_CUTOFF) return "+2";
  if (inspectionMs >= INSPECTION_WARN_12S) return "12 seconds";
  if (inspectionMs >= INSPECTION_WARN_8S) return "8 seconds";
  return null;
}

export function formatTime(ms: number): string {
  if (ms < 0) ms = 0;
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60);

  const pad2 = (n: number) => String(n).padStart(2, "0");

  if (min > 0) {
    return `${min}:${pad2(sec)}.${pad2(cs)}`;
  }
  return `${sec}.${pad2(cs)}`;
}

// Returns final time in ms given rawTimeMs and penalty
export function applyPenalty(rawTimeMs: number, penalty: Penalty): number | null {
  if (penalty === "DNF") return null;
  if (penalty === "+2") return rawTimeMs + 2000;
  return rawTimeMs;
}

// Simple beep using Web Audio API
let audioCtx: AudioContext | null = null;

export function playBeep(frequency = 880, durationMs = 80): void {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationMs / 1000);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + durationMs / 1000);
  } catch {
    // Audio not available
  }
}

export function vibrate(ms = 100): void {
  navigator.vibrate?.(ms);
}
