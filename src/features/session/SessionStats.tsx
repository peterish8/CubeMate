import { computeStats } from "../../domain/stats/computeStats";
import { formatTime } from "../../domain/timer/timerEngine";
import type { Solve } from "../../domain/types";

interface SessionStatsProps {
  solves: Solve[];
  cinematic?: boolean;
  soloLevelingMode?: boolean;
}

export function SessionStats({
  solves,
  cinematic = false,
  soloLevelingMode = false,
}: SessionStatsProps) {
  const stats = computeStats(solves);

  return (
    <div
      className={
        cinematic
          ? soloLevelingMode
            ? "practice-stats-card practice-stats-card-system"
            : "practice-stats-card"
          : "card p-4 space-y-3"
      }
    >
      {soloLevelingMode ? (
        <div className="practice-system-card-header !mb-0 w-full">
          <span className="practice-system-tag">STATUS</span>
          <span className="practice-system-id">PLAYER 001</span>
        </div>
      ) : (
        <h3 className="section-label">Session Stats</h3>
      )}

      <div className="practice-stats-grid">
        <StatItem label="Solves" value={String(stats.count)} cinematic={cinematic} soloLevelingMode={soloLevelingMode} />
        <StatItem
          label="Best"
          value={stats.best !== null ? formatTime(stats.best) : "—"}
          accent
          cinematic={cinematic}
          soloLevelingMode={soloLevelingMode}
        />
        <StatItem
          label="Mean"
          value={stats.mean !== null ? formatTime(stats.mean) : "—"}
          cinematic={cinematic}
          soloLevelingMode={soloLevelingMode}
        />
      </div>

      {(solves.length >= 5 || solves.length >= 12) && (
        <div className="grid grid-cols-2 gap-2">
          {solves.length >= 5 && (
            <StatItem
              label="ao5"
              value={stats.ao5 !== null ? formatTime(stats.ao5) : "DNF"}
              dnf={stats.ao5 === null}
              cinematic={cinematic}
              soloLevelingMode={soloLevelingMode}
            />
          )}
          {solves.length >= 12 && (
            <StatItem
              label="ao12"
              value={stats.ao12 !== null ? formatTime(stats.ao12) : "DNF"}
              dnf={stats.ao12 === null}
              cinematic={cinematic}
              soloLevelingMode={soloLevelingMode}
            />
          )}
        </div>
      )}
    </div>
  );
}

function StatItem({
  label,
  value,
  accent = false,
  dnf = false,
  cinematic = false,
  soloLevelingMode = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  dnf?: boolean;
  cinematic?: boolean;
  soloLevelingMode?: boolean;
}) {
  return (
    <div
      className={
        cinematic
          ? soloLevelingMode
            ? "practice-stat-item practice-stat-item-system"
            : "practice-stat-item"
          : "bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 space-y-1"
      }
    >
      <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider">{label}</p>
      <p
        className={`font-mono font-bold text-base tabular-nums leading-none ${
          dnf ? "text-red-400" : accent ? "text-cyan-400" : "text-white/90"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
