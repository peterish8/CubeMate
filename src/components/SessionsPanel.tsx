import { useState } from "react";
import type { CubeSession, Penalty, SessionId, Solve, SolveId } from "../lib/types";
import { WCA_EVENTS } from "../lib/types";
import { formatTime } from "../lib/timerEngine";
import { exportCSV, exportJSON } from "../lib/exportSolves";
import { computeStats } from "../lib/stats";

interface SessionsPanelProps {
  sessions: CubeSession[];
  allSolves: Solve[];
  currentSessionId: SessionId;
  onDeleteSolve: (id: SolveId) => void;
  onUpdatePenalty: (id: SolveId, penalty: Penalty) => void;
  onDeleteSessions: (ids: SessionId[]) => void;
  onClearAll: () => void;
}

const EVENT_LABEL = Object.fromEntries(WCA_EVENTS.map(({ id, label }) => [id, label]));

export function SessionsPanel({
  sessions,
  allSolves,
  currentSessionId,
  onDeleteSolve,
  onUpdatePenalty,
  onDeleteSessions,
  onClearAll,
}: SessionsPanelProps) {
  const [selected, setSelected] = useState<Set<SessionId>>(new Set());
  const [expanded, setExpanded] = useState<Set<SessionId>>(new Set([currentSessionId]));
  const [moreStats, setMoreStats] = useState<Set<SessionId>>(new Set());
  const [confirmClear, setConfirmClear] = useState(false);

  const reversed = [...sessions].reverse();

  const toggleSelect = (id: SessionId, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: SessionId) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleMoreStats = (id: SessionId, e: React.MouseEvent) => {
    e.stopPropagation();
    setMoreStats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedSolves = allSolves.filter((s) => s.sessionId && selected.has(s.sessionId as SessionId));
  const selectedCount = selected.size;

  const handleDeleteSelected = () => {
    onDeleteSessions([...selected]);
    setSelected(new Set());
  };

  const handleClearAll = () => {
    if (confirmClear) {
      onClearAll();
      setSelected(new Set());
      setExpanded(new Set());
      setMoreStats(new Set());
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <CubeOutlineIcon className="w-7 h-7 text-white/20" />
        </div>
        <div>
          <p className="text-white/40 text-sm font-medium">No solves yet</p>
          <p className="text-white/20 text-xs mt-1">Complete a solve to see your history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <span className="section-label">History</span>
          <span className="text-[10px] text-white/20 font-mono">
            {sessions.length}s · {allSolves.length}sv
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            disabled={allSolves.length === 0}
            onClick={() => exportCSV(allSolves)}
            className="text-white/25 hover:text-white/60 text-[10px] transition-colors disabled:opacity-20 px-1.5 py-1 rounded-lg hover:bg-white/[0.05]"
          >
            CSV
          </button>
          <button
            disabled={allSolves.length === 0}
            onClick={() => exportJSON(allSolves)}
            className="text-white/25 hover:text-white/60 text-[10px] transition-colors disabled:opacity-20 px-1.5 py-1 rounded-lg hover:bg-white/[0.05]"
          >
            JSON
          </button>
          <div className="w-px h-3 bg-white/[0.08]" />
          <button
            onClick={handleClearAll}
            className={`text-[10px] px-1.5 py-1 rounded-lg transition-all font-medium ${
              confirmClear
                ? "text-red-400 bg-red-500/10"
                : "text-white/20 hover:text-red-400/70 hover:bg-red-500/[0.06]"
            }`}
          >
            {confirmClear ? "Confirm?" : "Clear"}
          </button>
        </div>
      </div>

      {/* ── Global stats bar ── */}
      <GlobalStatsBar allSolves={allSolves} />

      {/* ── Sessions ── */}
      {reversed.map((session) => {
        const sessionSolves = allSolves.filter((s) => s.sessionId === session.id);
        const stats = computeStats(sessionSolves);
        const isExpanded = expanded.has(session.id);
        const isSelected = selected.has(session.id);
        const isMoreOpen = moreStats.has(session.id);
        const isCurrent = session.id === currentSessionId;
        const bestSolveId = stats.best !== null
          ? sessionSolves.find((s) => s.finalTimeMs === stats.best)?.id
          : null;

        const hasAoStats = stats.ao5 !== null || stats.ao12 !== null || stats.ao50 !== null || stats.ao100 !== null;

        return (
          <div
            key={session.id}
            className={`rounded-2xl border transition-all duration-200 ${
              isCurrent
                ? "border-blue-500/20 bg-blue-500/[0.03]"
                : isSelected
                ? "border-white/[0.12] bg-white/[0.03]"
                : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.09]"
            }`}
          >
            {/* Session header — div instead of button to allow nested interactives */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
              onClick={() => toggleExpand(session.id)}
            >
              {/* Checkbox */}
              <div
                role="checkbox"
                aria-checked={isSelected}
                onClick={(e) => toggleSelect(session.id, e)}
                className={`w-4 h-4 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${
                  isSelected
                    ? "bg-blue-600 border-blue-500"
                    : "border-white/[0.15] hover:border-white/30"
                }`}
              >
                {isSelected && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              {/* Chevron */}
              <ChevronIcon
                className={`w-3 h-3 text-white/20 flex-shrink-0 transition-transform duration-200 group-hover:text-white/40 ${
                  isExpanded ? "rotate-90" : ""
                }`}
              />

              {/* Name + badge + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-semibold truncate ${isCurrent ? "text-white/90" : "text-white/65"}`}>
                    {session.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[9px] font-bold tracking-wider uppercase text-blue-400 bg-blue-500/15 border border-blue-500/25 rounded-md px-1.5 py-0.5">
                      Live
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                  <span className="text-white/25 text-[10px] font-mono">{fmtDate(session.startedAt)}</span>
                  <span className="text-white/20 text-[10px]">{sessionSolves.length} solve{sessionSolves.length !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>

            {/* ── aoN stats row (always visible) ── */}
            {sessionSolves.length > 0 && (
              <div className="flex items-center gap-1.5 px-4 pb-3 flex-wrap">
                {stats.ao5   !== null && <AoChip label="ao5"   value={stats.ao5}   n={5}   />}
                {stats.ao12  !== null && <AoChip label="ao12"  value={stats.ao12}  n={12}  />}
                {stats.ao50  !== null && <AoChip label="ao50"  value={stats.ao50}  n={50}  />}
                {stats.ao100 !== null && <AoChip label="ao100" value={stats.ao100} n={100} />}

                {!hasAoStats && stats.count > 0 && (
                  <span className="text-white/20 text-[10px] italic">
                    {5 - stats.count} more solve{5 - stats.count !== 1 ? "s" : ""} for ao5
                  </span>
                )}

                {/* More / less toggle */}
                <button
                  onClick={(e) => toggleMoreStats(session.id, e)}
                  className={`ml-auto flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all ${
                    isMoreOpen
                      ? "text-white/50 bg-white/[0.06] border-white/[0.10]"
                      : "text-white/25 bg-transparent border-white/[0.06] hover:bg-white/[0.04] hover:text-white/45"
                  }`}
                >
                  More
                  <svg className={`w-2.5 h-2.5 transition-transform duration-150 ${isMoreOpen ? "rotate-180" : ""}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
                  </svg>
                </button>
              </div>
            )}

            {/* ── More stats (expandable) ── */}
            {isMoreOpen && sessionSolves.length > 0 && (
              <div className="px-4 pb-3 border-t border-white/[0.05] pt-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <DetailStat label="best"  value={stats.best}   fmt />
                  <DetailStat label="worst" value={stats.worst}  fmt />
                  <DetailStat label="mean"  value={stats.mean}   fmt />
                  <DetailStat label="σ dev" value={stats.stdDev} fmt />
                </div>
              </div>
            )}

            {/* ── Solve list ── */}
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
      })}

      {/* ── Floating selection bar ── */}
      {selectedCount > 0 && (
        <div
          className="sticky bottom-3 mx-1 rounded-2xl border border-white/[0.10] bg-[#0d1018]/90 backdrop-blur-xl px-4 py-3 flex items-center gap-3 shadow-2xl shadow-black/60"
          style={{ animation: "selectionBarIn 0.2s ease-out both" }}
        >
          <span className="text-white/50 text-xs font-medium flex-1">
            {selectedCount} session{selectedCount !== 1 ? "s" : ""}
            {selectedSolves.length > 0 && (
              <span className="text-white/25"> · {selectedSolves.length} solve{selectedSolves.length !== 1 ? "s" : ""}</span>
            )}
          </span>
          <button
            disabled={selectedSolves.length === 0}
            onClick={() => exportCSV(selectedSolves)}
            className="btn-secondary text-[11px] py-1 px-2.5 disabled:opacity-30"
          >
            CSV
          </button>
          <button
            disabled={selectedSolves.length === 0}
            onClick={() => exportJSON(selectedSolves)}
            className="btn-secondary text-[11px] py-1 px-2.5 disabled:opacity-30"
          >
            JSON
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-white/30 hover:text-white/70 text-[11px] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteSelected}
            className="text-[11px] font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1 rounded-lg transition-all"
          >
            Delete
          </button>
        </div>
      )}

      <style>{`
        @keyframes selectionBarIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Global stats bar ──────────────────────────────────────────────────────────

function GlobalStatsBar({ allSolves }: { allSolves: Solve[] }) {
  const [open, setOpen] = useState(false);
  const stats = computeStats(allSolves);

  if (allSolves.length === 0) return null;

  const hasAo = stats.ao5 !== null || stats.ao12 !== null || stats.ao50 !== null || stats.ao100 !== null;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 mb-3">
      {/* Title row */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-white/55 text-[11px] font-semibold tracking-wide">All Sessions</span>
          <span className="text-white/20 text-[10px] font-mono">{allSolves.length} solve{allSolves.length !== 1 ? "s" : ""}</span>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all ${
            open
              ? "text-white/50 bg-white/[0.06] border-white/[0.10]"
              : "text-white/25 border-white/[0.06] hover:bg-white/[0.04] hover:text-white/45"
          }`}
        >
          {open ? "Less" : "More"}
          <svg className={`w-2.5 h-2.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
          </svg>
        </button>
      </div>

      {/* aoN chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {stats.ao5   !== null && <AoChip label="ao5"   value={stats.ao5}   n={5}   />}
        {stats.ao12  !== null && <AoChip label="ao12"  value={stats.ao12}  n={12}  />}
        {stats.ao50  !== null && <AoChip label="ao50"  value={stats.ao50}  n={50}  />}
        {stats.ao100 !== null && <AoChip label="ao100" value={stats.ao100} n={100} />}
        {!hasAo && (
          <span className="text-white/20 text-[10px] italic">
            {Math.max(0, 5 - allSolves.length)} more solve{Math.max(0, 5 - allSolves.length) !== 1 ? "s" : ""} needed for averages
          </span>
        )}
      </div>

      {/* Expandable detail stats */}
      {open && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-2">
          <DetailStat label="best"  value={stats.best}   fmt />
          <DetailStat label="mean"  value={stats.mean}   fmt />
          <DetailStat label="σ dev" value={stats.stdDev} fmt />
          <DetailStat label="count" value={stats.count}  />
        </div>
      )}
    </div>
  );
}

// ── Solve Row ─────────────────────────────────────────────────────────────────

function SolveRow({
  solve,
  num,
  isBest,
  eventLabel,
  onDelete,
  onPenalty,
}: {
  solve: Solve;
  num: number;
  isBest: boolean;
  eventLabel: string;
  onDelete: () => void;
  onPenalty: (p: Penalty) => void;
}) {
  const [showScramble, setShowScramble] = useState(false);

  return (
    <div className={`group transition-colors ${isBest ? "bg-cyan-500/[0.04]" : "hover:bg-white/[0.02]"}`}>
      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Index */}
        <span className="text-white/20 font-mono text-[11px] w-5 text-right flex-shrink-0 tabular-nums">
          {num}
        </span>

        {/* Best star */}
        <div className="w-3 flex-shrink-0">
          {isBest && <StarIcon className="w-3 h-3 text-cyan-400/70" />}
        </div>

        {/* Event chip */}
        <span className="text-[10px] font-semibold text-white/30 bg-white/[0.05] border border-white/[0.07] rounded-md px-1.5 py-0.5 flex-shrink-0 font-mono">
          {eventLabel}
        </span>

        {/* Time */}
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
          {solve.penalty === "+2" && (
            <span className="text-amber-400/50 text-[10px] ml-1">+2</span>
          )}
        </span>

        {/* Penalty controls — visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
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

        {/* Scramble toggle */}
        <button
          onClick={() => setShowScramble((v) => !v)}
          className="text-white/15 hover:text-white/50 transition-colors flex-shrink-0 hidden sm:block"
          title="Show scramble"
        >
          <ScrambleIcon className="w-3 h-3" />
        </button>

        {/* Time of solve */}
        <span className="text-white/20 text-[10px] font-mono flex-shrink-0 hidden sm:block">
          {new Date(solve.dateISO).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-white/15 hover:text-red-400 transition-all flex-shrink-0"
          title="Delete"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scramble reveal */}
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

// ── Sub-components ────────────────────────────────────────────────────────────

const AO_COLORS: Record<number, string> = {
  5:   "text-blue-400/75   bg-blue-500/[0.09]   border-blue-500/20",
  12:  "text-purple-400/75 bg-purple-500/[0.09] border-purple-500/20",
  50:  "text-indigo-400/75 bg-indigo-500/[0.09] border-indigo-500/20",
  100: "text-violet-400/75 bg-violet-500/[0.09] border-violet-500/20",
};

function AoChip({ label, value, n }: { label: string; value: number; n: number }) {
  const cls = AO_COLORS[n] ?? "text-white/50 bg-white/[0.06] border-white/[0.10]";
  return (
    <div className={`border rounded-lg px-2 py-1 text-center ${cls}`}>
      <p className="text-[9px] uppercase tracking-wider opacity-60 font-bold">{label}</p>
      <p className="font-mono font-bold text-[11px] tabular-nums leading-tight">{formatTime(value)}</p>
    </div>
  );
}

function DetailStat({ label, value, fmt = false }: { label: string; value: number | null; fmt?: boolean }) {
  const display = value === null ? "—" : fmt ? formatTime(value) : value.toString();
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
      <p className="text-[9px] uppercase tracking-wider text-white/25 font-bold">{label}</p>
      <p className="font-mono font-bold text-[12px] text-white/70 tabular-nums mt-0.5">{display}</p>
    </div>
  );
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Today ${time}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + time;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function ScrambleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7" />
    </svg>
  );
}

function CubeOutlineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  );
}
