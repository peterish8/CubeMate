import type { SessionStats, Solve } from "./types";

function validTimes(solves: Solve[]): number[] {
  return solves.map((s) => s.finalTimeMs).filter((t): t is number => t !== null);
}

export function computeBest(solves: Solve[]): number | null {
  const times = validTimes(solves);
  if (times.length === 0) return null;
  return Math.min(...times);
}

export function computeWorst(solves: Solve[]): number | null {
  const times = validTimes(solves);
  if (times.length === 0) return null;
  return Math.max(...times);
}

export function computeMean(solves: Solve[]): number | null {
  const times = validTimes(solves);
  if (times.length === 0) return null;
  return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
}

export function computeStdDev(solves: Solve[]): number | null {
  const times = validTimes(solves);
  if (times.length < 2) return null;
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const variance = times.reduce((sum, t) => sum + (t - mean) ** 2, 0) / times.length;
  return Math.round(Math.sqrt(variance));
}

// Trim 5% from each end (WCA-style). ao5 → trim 1, ao12 → trim 1, ao50 → trim 3, ao100 → trim 5.
export function computeAoN(solves: Solve[], n: number): number | null {
  if (solves.length < n) return null;
  const window = solves.slice(-n);

  const trim = Math.ceil(n * 0.05);
  const dnfCount = window.filter((s) => s.finalTimeMs === null).length;
  if (dnfCount > trim) return null;

  const times = window.map((s) => (s.finalTimeMs === null ? Infinity : s.finalTimeMs));
  const sorted = [...times].sort((a, b) => a - b);
  const trimmed = sorted.slice(trim, n - trim);
  if (trimmed.some((t) => t === Infinity)) return null;

  return Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);
}

export function computeStats(solves: Solve[]): SessionStats {
  return {
    count: solves.length,
    best: computeBest(solves),
    worst: computeWorst(solves),
    mean: computeMean(solves),
    stdDev: computeStdDev(solves),
    ao5: computeAoN(solves, 5),
    ao12: computeAoN(solves, 12),
    ao50: computeAoN(solves, 50),
    ao100: computeAoN(solves, 100),
  };
}
