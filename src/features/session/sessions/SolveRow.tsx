import { useState } from "react";
import type { Penalty, Solve } from "../../../domain/types";
import { formatTime } from "../../../domain/timer/timerEngine";
import { ScrambleIcon, StarIcon, TrashIcon } from "./sessionIcons";

export interface SolveRowProps {
  solve: Solve;
  num: number;
  isBest: boolean;
  isNewest?: boolean;
  eventLabel: string;
  onDelete: () => void;
  onPenalty: (p: Penalty) => void;
}

export function SolveRow({ solve, num, isBest, isNewest = false, eventLabel, onDelete, onPenalty }: SolveRowProps) {
  const [showScramble, setShowScramble] = useState(false);

  return (
    <div className={`group transition-colors ${isNewest ? "motion-list-item" : ""} ${
      isBest ? "bg-cyan-500/[0.04]" : "hover:bg-white/[0.02]"
    }`}>
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="text-white/20 font-mono text-[11px] w-5 text-right flex-shrink-0 tabular-nums">
          {num}
        </span>

        <div className="w-3 flex-shrink-0">{isBest && <StarIcon className="w-3 h-3 text-cyan-400/70" />}</div>

        <span className="text-[10px] font-semibold text-white/30 bg-white/[0.05] border border-white/[0.07] rounded-md px-1.5 py-0.5 flex-shrink-0 font-mono">
          {eventLabel}
        </span>

        <span
          className={`font-mono font-bold tabular-nums text-sm flex-1 ${
            solve.penalty === "DNF"
              ? "text-red-400"
              : solve.penalty === "+2"
                ? "text-amber-400"
                : isBest
                  ? "text-cyan-400"
                  : "text-white/85"
          }`}
        >
          {solve.finalTimeMs === null ? "DNF" : formatTime(solve.finalTimeMs)}
          {solve.penalty === "+2" && <span className="text-amber-400/50 text-[10px] ml-1">+2</span>}
        </span>

        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            type="button"
            onClick={() => onPenalty(solve.penalty === "+2" ? "OK" : "+2")}
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border transition-all ${
              solve.penalty === "+2"
                ? "bg-amber-500/25 border-amber-400/40 text-amber-300"
                : "bg-white/[0.04] border-white/[0.08] text-white/30 hover:bg-amber-500/15 hover:border-amber-400/30 hover:text-amber-400"
            }`}
          >
            +2
          </button>
          <button
            type="button"
            onClick={() => onPenalty(solve.penalty === "DNF" ? "OK" : "DNF")}
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border transition-all ${
              solve.penalty === "DNF"
                ? "bg-red-500/25 border-red-400/40 text-red-300"
                : "bg-white/[0.04] border-white/[0.08] text-white/30 hover:bg-red-500/15 hover:border-red-400/30 hover:text-red-400"
            }`}
          >
            DNF
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowScramble((v) => !v)}
          className="text-white/15 hover:text-white/50 transition-colors flex-shrink-0"
          title="Show scramble"
        >
          <ScrambleIcon className="w-3 h-3" />
        </button>

        <span className="text-white/20 text-[10px] font-mono flex-shrink-0 hidden sm:block">
          {new Date(solve.dateISO).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>

        <button
          type="button"
          onClick={onDelete}
          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-white/15 hover:text-red-400 transition-all flex-shrink-0"
          title="Delete"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {showScramble && (
        <div className="px-12 pb-2.5">
          <p className="text-white/30 font-mono text-[10px] leading-relaxed bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
            {solve.scramble}
          </p>
        </div>
      )}
    </div>
  );
}
