import type { MatchN, RoundResult } from "../../domain/types";
import { formatTime } from "../../domain/timer/timerEngine";

export interface MatchPanelProps {
  matchN: MatchN;
  myWins: number;
  oppWins: number;
  winsNeeded: number;
  roundResults: RoundResult[];
  matchWinner: "me" | "opponent" | null;
  opponentConnected: boolean;
  myPendingRound: boolean;
  oppPendingRound: boolean;
  onSetMatchN: (n: MatchN) => void;
  onReset: () => void;
}

export function MatchPanel({
  matchN,
  myWins,
  oppWins,
  winsNeeded,
  roundResults,
  matchWinner,
  opponentConnected,
  myPendingRound,
  oppPendingRound,
  onSetMatchN,
  onReset,
}: MatchPanelProps) {
  const hasProgress = roundResults.length > 0 || myPendingRound || oppPendingRound;

  return (
    <div className="card p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="section-label">Best of</span>
        <div className="flex items-center gap-1">
          {([1, 3, 5] as MatchN[]).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onSetMatchN(n)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                matchN === n
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                  : "text-white/35 hover:bg-white/[0.08] hover:text-white/70"
              }`}
            >
              {n}
            </button>
          ))}
          {hasProgress && (
            <button
              type="button"
              onClick={onReset}
              className="ml-1 text-[10px] text-white/25 hover:text-white/55 px-1.5 py-1 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-1 flex-1">
          {Array.from({ length: winsNeeded }, (_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                i < myWins ? "bg-blue-500 shadow-sm shadow-blue-500/50" : "bg-white/[0.08]"
              } ${i === myWins - 1 ? "motion-score-segment" : ""}`}
            />
          ))}
        </div>

        <div className="text-center flex-shrink-0 min-w-[52px]">
          {matchWinner ? (
            <span className={`text-xs font-bold ${matchWinner === "me" ? "text-green-400" : "text-red-400"}`}>
              {matchWinner === "me" ? "You win!" : "They win"}
            </span>
          ) : opponentConnected ? (
            <span
              key={`${myWins}-${oppWins}`}
              className="motion-score text-white/30 font-mono text-sm font-bold tabular-nums"
              aria-live="polite"
            >
              {myWins}–{oppWins}
            </span>
          ) : (
            <span className="text-white/20 text-[10px]">waiting</span>
          )}
        </div>

        <div className="flex gap-1 flex-1 justify-end">
          {Array.from({ length: winsNeeded }, (_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                i < oppWins ? "bg-red-500 shadow-sm shadow-red-500/50" : "bg-white/[0.08]"
              } ${i === oppWins - 1 ? "motion-score-segment" : ""}`}
            />
          ))}
        </div>
      </div>

      {opponentConnected && (myPendingRound || oppPendingRound) && !matchWinner && (
        <div className="flex items-center justify-between text-[10px]">
          <span className={myPendingRound ? "text-blue-400/70 animate-pulse" : "text-white/20"}>
            {myPendingRound ? "Waiting for opponent…" : ""}
          </span>
          <span className={oppPendingRound ? "text-amber-400/70 animate-pulse" : "text-white/20"}>
            {oppPendingRound ? "Opponent submitted" : ""}
          </span>
        </div>
      )}

      {roundResults.length > 0 && (
        <div className="space-y-0.5">
          {roundResults.map((r, index) => (
            <div
              key={r.round}
              className={`flex items-center gap-2 text-[10px] font-mono px-0.5 ${
                index === roundResults.length - 1 ? "motion-list-item" : ""
              }`}
            >
              <span className="text-white/20 w-6">R{r.round}</span>
              <span className={`flex-1 tabular-nums ${r.winner === "me" ? "text-blue-400" : "text-white/40"}`}>
                {r.myTime === null ? "DNF" : formatTime(r.myTime)}
              </span>
              <span
                className={`text-[9px] font-bold uppercase ${
                  r.winner === "tie"
                    ? "text-amber-400/60"
                    : r.winner === "me"
                      ? "text-green-400/60"
                      : "text-red-400/60"
                }`}
              >
                {r.winner === "tie" ? "tie" : r.winner === "me" ? "win" : "loss"}
              </span>
              <span
                className={`flex-1 text-right tabular-nums ${r.winner === "opponent" ? "text-red-400" : "text-white/40"}`}
              >
                {r.oppTime === null ? "DNF" : formatTime(r.oppTime)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
