import type { OpponentState } from "../lib/types";
import { WCA_EVENTS } from "../lib/types";
import { formatTime } from "../lib/timerEngine";

const EVENT_LABEL = Object.fromEntries(WCA_EVENTS.map(({ id, label }) => [id, label]));

interface OpponentStatusProps {
  opponent: OpponentState;
  myFinished: boolean;
  myTime: number | null;
}

const STATE_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  idle:       { label: "Idle",         dot: "bg-white/20",                    text: "text-white/40" },
  inspection: { label: "Inspecting…",  dot: "bg-cyan-400 animate-pulse",      text: "text-cyan-400" },
  running:    { label: "Solving…",     dot: "bg-green-400 animate-pulse",     text: "text-green-400" },
  stopped:    { label: "Finished",     dot: "bg-white/60",                    text: "text-white/80" },
  ready:      { label: "Ready",        dot: "bg-blue-400",                    text: "text-blue-400" },
};

function getWinner(myTime: number | null, opponentTime: number | null): { text: string; sub: string | null; color: string } {
  if (myTime === null && opponentTime === null) return { text: "Both DNF", sub: null, color: "text-white/60" };
  if (myTime === null) return { text: "Opponent wins", sub: null, color: "text-red-400" };
  if (opponentTime === null) return { text: "You win!", sub: null, color: "text-green-400" };
  if (myTime < opponentTime) return {
    text: "You win! 🏆",
    sub: `${formatTime(myTime)} vs ${formatTime(opponentTime)} · +${formatTime(opponentTime - myTime)}`,
    color: "text-green-400",
  };
  if (opponentTime < myTime) return {
    text: "Opponent wins",
    sub: `${formatTime(myTime)} vs ${formatTime(opponentTime)}`,
    color: "text-red-400",
  };
  return { text: "Tie!", sub: `Both ${formatTime(myTime)}`, color: "text-amber-400" };
}

export function OpponentStatus({ opponent, myFinished, myTime }: OpponentStatusProps) {
  const bothFinished = myFinished && opponent.state === "stopped";
  const stateCfg = STATE_CONFIG[opponent.state] ?? STATE_CONFIG.idle;
  const winner = bothFinished ? getWinner(myTime, opponent.latestTime) : null;

  return (
    <div className="card p-4 space-y-3">
      <h3 className="section-label">Opponent</h3>

      {!opponent.connected ? (
        <div className="flex items-center gap-2.5 text-white/30 text-sm py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
          <span className="text-xs text-white/30">Waiting for opponent to join…</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Connected row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${stateCfg.dot}`} />
              <span className={`text-sm font-medium ${stateCfg.text}`}>{stateCfg.label}</span>
            </div>
            <span className="text-[11px] text-white/30 bg-white/[0.05] border border-white/[0.07] px-2 py-0.5 rounded-md font-mono">
              {EVENT_LABEL[opponent.event] ?? opponent.event}
            </span>
          </div>

          {/* Latest time */}
          {opponent.latestTime !== null && (
            <div className="flex items-baseline gap-2">
              <span className="text-white/30 text-xs">Last solve</span>
              <span className={`font-mono font-bold text-base tabular-nums ${
                opponent.latestPenalty === "DNF"
                  ? "text-red-400"
                  : opponent.latestPenalty === "+2"
                  ? "text-amber-400"
                  : "text-white"
              }`}>
                {opponent.latestPenalty === "DNF"
                  ? "DNF"
                  : formatTime(opponent.latestTime)}
                {opponent.latestPenalty === "+2" && <span className="text-xs ml-0.5 opacity-70">(+2)</span>}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Winner banner */}
      {winner && (
        <div className={`mt-1 rounded-xl px-4 py-3 text-center border ${
          winner.color === "text-green-400"
            ? "bg-green-500/10 border-green-500/20"
            : winner.color === "text-red-400"
            ? "bg-red-500/10 border-red-500/20"
            : "bg-amber-500/10 border-amber-500/20"
        }`}>
          <p className={`text-sm font-bold ${winner.color}`}>{winner.text}</p>
          {winner.sub && (
            <p className="text-xs text-white/30 mt-1 font-mono">{winner.sub}</p>
          )}
        </div>
      )}
    </div>
  );
}
