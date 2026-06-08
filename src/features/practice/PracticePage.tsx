import { useState } from "react";
import { Link } from "react-router-dom";
import { TimerPanel } from "../timer/TimerPanel";
import { SessionStats } from "../session/SessionStats";
import type { CubeEvent, Penalty, Solve, SolveId } from "../../domain/types";
import { useSession } from "../session/useSession";
import { PracticeHistoryRail } from "./PracticeHistoryRail";

/** Solo timer — no room, solves still go to the tab session. */
export function PracticePage() {
  const session = useSession();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<CubeEvent>("333");
  const [soloLevelingMode, setSoloLevelingMode] = useState(false);
  const [systemFlashActive, setSystemFlashActive] = useState(false);
  const [statsCollapsed, setStatsCollapsed] = useState(true);

  const handleSolveComplete = (solve: Solve) => {
    session.addSolve(solve);
  };

  const handlePenaltyChange = (id: SolveId, penalty: Penalty) => {
    session.updatePenalty(id, penalty);
  };

  const toggleSoloLevelingMode = () => {
    setSoloLevelingMode((current) => {
      const next = !current;
      playSystemChime(next);
      if (next) {
        setSystemFlashActive(true);
        window.setTimeout(() => setSystemFlashActive(false), 900);
      }
      return next;
    });
  };

  return (
    <div className={soloLevelingMode ? "motion-enter-fast practice-page-shell practice-page-shell-system" : "motion-enter-fast practice-page-shell"}>
      <div className="practice-page-grid" />
      {soloLevelingMode && <div className="practice-system-scanlines" aria-hidden="true" />}
      {systemFlashActive && <div className="practice-system-flash" aria-hidden="true" />}

      <header className="practice-header">
        <Link to="/dashboard" className="practice-home-link">
          ← Dashboard
        </Link>
        <div className="practice-header-center">
          <span className="section-label">CubeMate</span>
          <span className="text-white/74 text-sm font-medium">Solo practice</span>
          {soloLevelingMode && <span className="practice-system-caption">SYSTEM INTERFACE ACTIVE</span>}
        </div>
        <div className="practice-header-actions">
          <button
            type="button"
            onClick={() => setStatsCollapsed((value) => !value)}
            className={statsCollapsed ? "practice-header-icon-toggle" : "practice-header-icon-toggle practice-header-icon-toggle-active"}
            title={statsCollapsed ? "Show session stats" : "Hide session stats"}
            aria-label={statsCollapsed ? "Show session stats" : "Hide session stats"}
          >
            <StatsIcon />
          </button>
          <button
            type="button"
            onClick={toggleSoloLevelingMode}
            className={soloLevelingMode ? "practice-mode-toggle practice-mode-toggle-active" : "practice-mode-toggle"}
          >
            <span className="hidden sm:inline">{soloLevelingMode ? "System mode on" : "Solo Leveling mode"}</span>
            <span className="sm:hidden">{soloLevelingMode ? "System" : "Mode"}</span>
          </button>
          <button type="button" onClick={() => setHistoryOpen((v) => !v)} className="practice-history-toggle">
            <span className="hidden sm:inline">{historyOpen ? "Close rail" : "Open rail"}</span>
            <span className="sm:hidden">{historyOpen ? "✕" : "Rail"}</span>
          </button>
        </div>
      </header>

      {session.corrupted && (
        <div className="bg-amber-900/30 border-b border-amber-500/20 px-4 py-1.5 text-amber-300/80 text-xs">
          Solve data could not be loaded — starting fresh.
        </div>
      )}

      <main className="practice-layout">
        <section className="practice-main-column">
          <div className="practice-panel-stack">
            <div
              className={
                statsCollapsed
                  ? "practice-stats-reveal practice-stats-reveal-collapsed"
                  : "practice-stats-reveal practice-stats-reveal-open"
              }
              aria-hidden={statsCollapsed}
            >
              <SessionStats solves={session.solves} cinematic soloLevelingMode={soloLevelingMode} />
            </div>
            <TimerPanel
              onSolveComplete={handleSolveComplete}
              onPenaltyChange={handlePenaltyChange}
              onSync={() => {}}
              onSyncEnabledChange={() => {}}
              inspectionEnabled
              soundEnabled
              vibrationEnabled
              syncEnabled={false}
              cinematic
              soloLevelingMode={soloLevelingMode}
              onEventChange={setActiveEvent}
              fullStage={statsCollapsed}
            />
          </div>
        </section>

        <aside
          className={
            historyOpen
              ? "practice-history-column"
              : "practice-history-column practice-history-column-collapsed"
          }
        >
          <PracticeHistoryRail
            currentSessionId={session.currentSessionId}
            currentSolves={session.solves}
            allSolves={session.allSolves}
            sessions={session.sessions}
            activeEvent={activeEvent}
            soloLevelingMode={soloLevelingMode}
            onDeleteSolve={session.deleteSolve}
            onUpdatePenalty={session.updatePenalty}
            onDeleteSessions={session.deleteSessions}
            onClearAll={session.clearAll}
          />
        </aside>

        {historyOpen && (
          <div className="practice-history-drawer">
            <div className="practice-history-drawer-backdrop motion-enter-fast" onClick={() => setHistoryOpen(false)} />
            <div className="practice-history-drawer-panel motion-enter-fast">
              <PracticeHistoryRail
                currentSessionId={session.currentSessionId}
                currentSolves={session.solves}
                allSolves={session.allSolves}
                sessions={session.sessions}
                activeEvent={activeEvent}
                soloLevelingMode={soloLevelingMode}
                onDeleteSolve={session.deleteSolve}
                onUpdatePenalty={session.updatePenalty}
                onDeleteSessions={session.deleteSessions}
                onClearAll={session.clearAll}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 19V9m7 10V5m7 14v-7" />
    </svg>
  );
}

function playSystemChime(enabled: boolean) {
  try {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const now = context.currentTime;

    const master = context.createGain();
    master.gain.value = enabled ? 0.045 : 0.03;
    master.connect(context.destination);

    const tones = enabled ? [392, 587, 880] : [880, 587, 392];
    tones.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + index * 0.07);
      gain.gain.exponentialRampToValueAtTime(enabled ? 0.18 : 0.12, now + index * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.07 + 0.22);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(now + index * 0.07);
      oscillator.stop(now + index * 0.07 + 0.24);
    });

    window.setTimeout(() => {
      void context.close().catch(() => undefined);
    }, 500);
  } catch {
    // Ignore audio initialization failures.
  }
}
