import { useState } from "react";
import type { Solve } from "../../../domain/types";
import { computeStats } from "../../../domain/stats/computeStats";
import { AoChip, DetailStat } from "./sessionStatsUi";

export function GlobalStatsBar({ allSolves }: { allSolves: Solve[] }) {
  const [open, setOpen] = useState(false);
  const stats = computeStats(allSolves);

  if (allSolves.length === 0) return null;

  const hasAo =
    stats.ao5 !== null || stats.ao12 !== null || stats.ao50 !== null || stats.ao100 !== null;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 mb-3">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-white/55 text-[11px] font-semibold tracking-wide">All Sessions</span>
          <span className="text-white/20 text-[10px] font-mono">
            {allSolves.length} solve{allSolves.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all ${
            open
              ? "text-white/50 bg-white/[0.06] border-white/[0.10]"
              : "text-white/25 border-white/[0.06] hover:bg-white/[0.04] hover:text-white/45"
          }`}
        >
          {open ? "Less" : "More"}
          <svg
            className={`w-2.5 h-2.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {stats.ao5 !== null && <AoChip label="ao5" value={stats.ao5} n={5} />}
        {stats.ao12 !== null && <AoChip label="ao12" value={stats.ao12} n={12} />}
        {stats.ao50 !== null && <AoChip label="ao50" value={stats.ao50} n={50} />}
        {stats.ao100 !== null && <AoChip label="ao100" value={stats.ao100} n={100} />}
        {!hasAo && (
          <span className="text-white/20 text-[10px] italic">
            {Math.max(0, 5 - allSolves.length)} more solve
            {Math.max(0, 5 - allSolves.length) !== 1 ? "s" : ""} needed for averages
          </span>
        )}
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-2">
          <DetailStat label="best" value={stats.best} fmt />
          <DetailStat label="mean" value={stats.mean} fmt />
          <DetailStat label="σ dev" value={stats.stdDev} fmt />
          <DetailStat label="count" value={stats.count} />
        </div>
      )}
    </div>
  );
}