import { useState } from "react";
import type { CubeSession, Penalty, SessionId, Solve, SolveId } from "../../../domain/types";
import { exportCSV, exportJSON } from "../../../domain/export/exportSolves";
import { CubeOutlineIcon } from "./sessionIcons";
import { GlobalStatsBar } from "./GlobalStatsBar";
import { SessionRow } from "./SessionRow";
import { SelectionBar } from "./SelectionBar";
import { useSessionSelection } from "./useSessionSelection";

export interface SessionsPanelProps {
  sessions: CubeSession[];
  allSolves: Solve[];
  currentSessionId: SessionId;
  onDeleteSolve: (id: SolveId) => void;
  onUpdatePenalty: (id: SolveId, penalty: Penalty) => void;
  onDeleteSessions: (ids: SessionId[]) => void;
  onClearAll: () => void;
}

export function SessionsPanel({
  sessions,
  allSolves,
  currentSessionId,
  onDeleteSolve,
  onUpdatePenalty,
  onDeleteSessions,
  onClearAll,
}: SessionsPanelProps) {
  const selection = useSessionSelection(allSolves, currentSessionId);
  const reversed = [...sessions].reverse();
  const [exportFlash, setExportFlash] = useState<"csv" | "json" | null>(null);

  const handleExport = (type: "csv" | "json") => {
    if (type === "csv") exportCSV(allSolves);
    else exportJSON(allSolves);
    setExportFlash(type);
    window.setTimeout(() => setExportFlash(null), 1800);
  };

  const handleDeleteSelected = () => {
    onDeleteSessions([...selection.selected]);
    selection.clearSelection();
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
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <span className="section-label">History</span>
          <span className="text-[10px] text-white/20 font-mono">
            {sessions.length}s · {allSolves.length}sv
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={allSolves.length === 0}
            onClick={() => handleExport("csv")}
            className={`text-[10px] transition-all px-1.5 py-1 rounded-lg disabled:opacity-20 ${
              exportFlash === "csv"
                ? "text-green-400 bg-green-500/10"
                : "text-white/25 hover:text-white/60 hover:bg-white/[0.05]"
            }`}
          >
            {exportFlash === "csv" ? "CSV ✓" : "CSV"}
          </button>
          <button
            type="button"
            disabled={allSolves.length === 0}
            onClick={() => handleExport("json")}
            className={`text-[10px] transition-all px-1.5 py-1 rounded-lg disabled:opacity-20 ${
              exportFlash === "json"
                ? "text-green-400 bg-green-500/10"
                : "text-white/25 hover:text-white/60 hover:bg-white/[0.05]"
            }`}
          >
            {exportFlash === "json" ? "JSON ✓" : "JSON"}
          </button>
          <div className="w-px h-3 bg-white/[0.08]" />
          <button
            type="button"
            onClick={() => selection.requestClearAll(onClearAll)}
            className={`text-[10px] px-1.5 py-1 rounded-lg transition-all font-medium ${
              selection.confirmClear
                ? "text-red-400 bg-red-500/10"
                : "text-white/20 hover:text-red-400/70 hover:bg-red-500/[0.06]"
            }`}
          >
            {selection.confirmClear ? "Confirm?" : "Clear"}
          </button>
        </div>
      </div>

      <GlobalStatsBar allSolves={allSolves} />

      {reversed.map((session, index) => {
        const sessionSolves = allSolves.filter((s) => s.sessionId === session.id);
        return (
          <div key={session.id} className={index === 0 ? "motion-list-item" : ""}>
            <SessionRow
              session={session}
              sessionSolves={sessionSolves}
              currentSessionId={currentSessionId}
              isExpanded={selection.expanded.has(session.id)}
              isSelected={selection.selected.has(session.id)}
              isMoreOpen={selection.moreStats.has(session.id)}
              onToggleExpand={() => selection.toggleExpand(session.id)}
              onToggleSelect={(e) => selection.toggleSelect(session.id, e)}
              onToggleMoreStats={(e) => selection.toggleMoreStats(session.id, e)}
              onDeleteSolve={onDeleteSolve}
              onUpdatePenalty={onUpdatePenalty}
            />
          </div>
        );
      })}

      <SelectionBar
        selectedCount={selection.selectedCount}
        selectedSolves={selection.selectedSolves}
        onClearSelection={selection.clearSelection}
        onDeleteSelected={handleDeleteSelected}
      />

      <style>{`
        @keyframes selectionBarIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}