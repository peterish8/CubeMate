import type { CubeSession, Penalty, SessionId, Solve, SolveId } from "../../../domain/types";
import { WCA_EVENTS } from "../../../domain/types";
import { computeStats } from "../../../domain/stats/computeStats";
import { AoChip, DetailStat, fmtSessionDate } from "./sessionStatsUi";
import { ChevronIcon } from "./sessionIcons";
import { SolveRow } from "./SolveRow";

const EVENT_LABEL = Object.fromEntries(WCA_EVENTS.map(({ id, label }) => [id, label]));

export interface SessionRowProps {
  session: CubeSession;
  sessionSolves: Solve[];
  currentSessionId: SessionId;
  isExpanded: boolean;
  isSelected: boolean;
  isMoreOpen: boolean;
  onToggleExpand: () => void;
  onToggleSelect: (e: React.MouseEvent) => void;
  onToggleMoreStats: (e: React.MouseEvent) => void;
  onDeleteSolve: (id: SolveId) => void;
  onUpdatePenalty: (id: SolveId, penalty: Penalty) => void;
}

export function SessionRow({
  session,
  sessionSolves,
  currentSessionId,
  isExpanded,
  isSelected,
  isMoreOpen,
  onToggleExpand,
  onToggleSelect,
  onToggleMoreStats,
  onDeleteSolve,
  onUpdatePenalty,
}: SessionRowProps) {
  const stats = computeStats(sessionSolves);
  const isCurrent = session.id === currentSessionId;
  const bestSolveId =
    stats.best !== null ? sessionSolves.find((s) => s.finalTimeMs === stats.best)?.id : null;
  const hasAoStats =
    stats.ao5 !== null || stats.ao12 !== null || stats.ao50 !== null || stats.ao100 !== null;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        isCurrent
          ? "border-blue-500/20 bg-blue-500/[0.03]"
          : isSelected
            ? "border-white/[0.12] bg-white/[0.03]"
            : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.09]"
      }`}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={onToggleExpand}
      >
        <div
          role="checkbox"
          aria-checked={isSelected}
          onClick={onToggleSelect}
          className={`w-4 h-4 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${
            isSelected ? "bg-blue-600 border-blue-500" : "border-white/[0.15] hover:border-white/30"
          }`}
        >
          {isSelected && (
            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
              <path
                d="M1.5 5l2.5 2.5 5-5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        <ChevronIcon
          className={`w-3 h-3 text-white/20 flex-shrink-0 transition-transform duration-200 ${
            isExpanded ? "rotate-90" : ""
          }`}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-semibold truncate ${isCurrent ? "text-white/90" : "text-white/65"}`}
            >
              {session.label}
            </span>
            {isCurrent && (
              <span className="text-[9px] font-bold tracking-wider uppercase text-blue-400 bg-blue-500/15 border border-blue-500/25 rounded-md px-1.5 py-0.5">
                Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
            <span className="text-white/25 text-[10px] font-mono">{fmtSessionDate(session.startedAt)}</span>
            <span className="text-white/20 text-[10px]">
              {sessionSolves.length} solve{sessionSolves.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {sessionSolves.length > 0 && (
        <div className="flex items-center gap-1.5 px-4 pb-3 flex-wrap">
          {stats.ao5 !== null && <AoChip label="ao5" value={stats.ao5} n={5} />}
          {stats.ao12 !== null && <AoChip label="ao12" value={stats.ao12} n={12} />}
          {stats.ao50 !== null && <AoChip label="ao50" value={stats.ao50} n={50} />}
          {stats.ao100 !== null && <AoChip label="ao100" value={stats.ao100} n={100} />}

          {!hasAoStats && stats.count > 0 && (
            <span className="text-white/20 text-[10px] italic">
              {5 - stats.count} more solve{5 - stats.count !== 1 ? "s" : ""} for ao5
            </span>
          )}

          <button
            type="button"
            onClick={onToggleMoreStats}
            className={`ml-auto flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all ${
              isMoreOpen
                ? "text-white/50 bg-white/[0.06] border-white/[0.10]"
                : "text-white/25 bg-transparent border-white/[0.06] hover:bg-white/[0.04] hover:text-white/45"
            }`}
          >
            More
            <svg
              className={`w-2.5 h-2.5 transition-transform duration-150 ${isMoreOpen ? "rotate-180" : ""}`}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
            </svg>
          </button>
        </div>
      )}

      {isMoreOpen && sessionSolves.length > 0 && (
        <div className="px-4 pb-3 border-t border-white/[0.05] pt-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <DetailStat label="best" value={stats.best} fmt />
            <DetailStat label="worst" value={stats.worst} fmt />
            <DetailStat label="mean" value={stats.mean} fmt />
            <DetailStat label="σ dev" value={stats.stdDev} fmt />
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="border-t border-white/[0.06]">
          {sessionSolves.length === 0 ? (
            <p className="px-5 py-4 text-white/20 text-xs italic">No solves yet.</p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {[...sessionSolves].reverse().map((solve, i) => {
                const isBest = solve.id === bestSolveId;
                const num = sessionSolves.length - i;
                return (
                  <SolveRow
                    key={solve.id}
                    solve={solve}
                    num={num}
                    isBest={isBest}
                    isNewest={isCurrent && i === 0}
                    eventLabel={EVENT_LABEL[solve.event] ?? solve.event}
                    onDelete={() => onDeleteSolve(solve.id)}
                    onPenalty={(p) => onUpdatePenalty(solve.id, p)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
