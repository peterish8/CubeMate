import type { Solve } from "../lib/types";
import { computeStats } from "../lib/stats";
import { formatTime } from "../lib/timerEngine";

interface SessionStatsProps {
  solves: Solve[];
}

export function SessionStats({ solves }: SessionStatsProps) {
  const stats = computeStats(solves);

  return (
    <div className="card p-4 space-y-3">
      <h3 className="section-label">Session Stats</h3>

      <div className="grid grid-cols-3 gap-2">
        <StatItem label="Solves"  value={String(stats.count)} />
        <StatItem label="Best"    value={stats.best !== null ? formatTime(stats.best) : "—"} accent />
        <StatItem label="Mean"    value={stats.mean !== null ? formatTime(stats.mean) : "—"} />
      </div>

      {(solves.length >= 5 || solves.length >= 12) && (
        <div className="grid grid-cols-2 gap-2">
          {solves.length >= 5 && (
            <StatItem
              label="ao5"
              value={stats.ao5 !== null ? formatTime(stats.ao5) : "DNF"}
              dnf={stats.ao5 === null}
            />
          )}
          {solves.length >= 12 && (
            <StatItem
              label="ao12"
              value={stats.ao12 !== null ? formatTime(stats.ao12) : "DNF"}
              dnf={stats.ao12 === null}
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
}: {
  label: string;
  value: string;
  accent?: boolean;
  dnf?: boolean;
}) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 space-y-1">
      <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider">{label}</p>
      <p className={`font-mono font-bold text-base tabular-nums leading-none ${
        dnf ? "text-red-400" : accent ? "text-cyan-400" : "text-white/90"
      }`}>
        {value}
      </p>
    </div>
  );
}
