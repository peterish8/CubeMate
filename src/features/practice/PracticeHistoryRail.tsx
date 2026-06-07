import { useMemo, useState } from "react";
import type { CubeEvent, CubeSession, Penalty, SessionId, Solve, SolveId } from "../../domain/types";
import { WCA_EVENTS } from "../../domain/types";
import { computeStats } from "../../domain/stats/computeStats";
import { formatTime } from "../../domain/timer/timerEngine";
import { SolveRow } from "../session/sessions/SolveRow";
import { SessionsPanel } from "../session/sessions/SessionsPanel";

const EVENT_LABEL = Object.fromEntries(WCA_EVENTS.map(({ id, label }) => [id, label]));

interface PracticeHistoryRailProps {
  currentSessionId: SessionId;
  currentSolves: Solve[];
  allSolves: Solve[];
  sessions: CubeSession[];
  activeEvent: CubeEvent;
  soloLevelingMode: boolean;
  onDeleteSolve: (id: SolveId) => void;
  onUpdatePenalty: (id: SolveId, penalty: Penalty) => void;
  onDeleteSessions: (ids: SessionId[]) => void;
  onClearAll: () => void;
}

export function PracticeHistoryRail({
  currentSessionId,
  currentSolves,
  allSolves,
  sessions,
  activeEvent,
  soloLevelingMode,
  onDeleteSolve,
  onUpdatePenalty,
  onDeleteSessions,
  onClearAll,
}: PracticeHistoryRailProps) {
  const [tab, setTab] = useState<"current" | "all">("current");
  const [pendingDelete, setPendingDelete] = useState<Solve | null>(null);

  const filteredCurrentSolves = useMemo(
    () => currentSolves.filter((solve) => solve.event === activeEvent),
    [activeEvent, currentSolves]
  );

  const bestSolveId = useMemo(() => {
    const stats = computeStats(filteredCurrentSolves);
    return stats.best !== null
      ? filteredCurrentSolves.find((solve) => solve.finalTimeMs === stats.best)?.id ?? null
      : null;
  }, [filteredCurrentSolves]);

  return (
    <div className={soloLevelingMode ? "practice-history-rail practice-history-rail-system" : "practice-history-rail"}>
      <div className="practice-history-header">
        <div>
          {soloLevelingMode ? (
            <>
              <div className="practice-system-card-header">
                <span className="practice-system-tag">ARCHIVE</span>
                <span className="practice-system-id">LOG STORAGE</span>
              </div>
              <h2 className="font-[Sora] text-xl font-semibold tracking-tight text-white">Record log</h2>
            </>
          ) : (
            <>
              <p className="section-label">Solve rail</p>
              <h2 className="font-[Sora] text-xl font-semibold tracking-tight text-white">Solo archive</h2>
            </>
          )}
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/28">
            Live session shows {EVENT_LABEL[activeEvent] ?? activeEvent} only
          </p>
        </div>
        <div className="practice-history-tabs">
          <button
            type="button"
            onClick={() => setTab("current")}
            className={tab === "current" ? "practice-history-tab practice-history-tab-active" : "practice-history-tab"}
          >
            {soloLevelingMode ? "Current gate" : "Live session"}
          </button>
          <button
            type="button"
            onClick={() => setTab("all")}
            className={tab === "all" ? "practice-history-tab practice-history-tab-active" : "practice-history-tab"}
          >
            {soloLevelingMode ? "All logs" : "All sessions"}
          </button>
        </div>
      </div>

      {tab === "current" ? (
        <div className="practice-history-body">
          {filteredCurrentSolves.length === 0 ? (
            <div className="practice-history-empty">
              <p className="text-sm font-medium text-white/60">No solves for this event yet</p>
              <p className="mt-1 text-xs text-white/32">Switch event or start the timer to fill this lane.</p>
            </div>
          ) : (
            <div className="practice-live-list">
              {[...filteredCurrentSolves].reverse().map((solve, index) => (
                <SolveRow
                  key={solve.id}
                  solve={solve}
                  num={filteredCurrentSolves.length - index}
                  isBest={solve.id === bestSolveId}
                  eventLabel={EVENT_LABEL[solve.event] ?? solve.event}
                  onDelete={() => setPendingDelete(solve)}
                  onPenalty={(penalty) => onUpdatePenalty(solve.id, penalty)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="practice-history-body practice-history-body-all">
          <SessionsPanel
            sessions={sessions}
            allSolves={allSolves}
            currentSessionId={currentSessionId}
            onDeleteSolve={onDeleteSolve}
            onUpdatePenalty={onUpdatePenalty}
            onDeleteSessions={onDeleteSessions}
            onClearAll={onClearAll}
          />
        </div>
      )}

      {pendingDelete && (
        <div className="practice-delete-modal-backdrop">
          <div className="practice-delete-modal">
            <p className="section-label">Delete solve</p>
            <p className="mt-2 text-sm text-white">
              Remove{" "}
              {pendingDelete.finalTimeMs === null ? "DNF" : formatTime(pendingDelete.finalTimeMs)}{" "}
              from this session?
            </p>
            <p className="mt-2 text-xs leading-6 text-white/42">
              This deletes the solve record and keeps the rest of the session intact.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingDelete(null)} className="btn-secondary px-4 text-xs">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSolve(pendingDelete.id);
                  setPendingDelete(null);
                }}
                className="btn-danger px-4 text-xs"
              >
                Delete solve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
