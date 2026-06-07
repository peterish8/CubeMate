import type { MatchN } from "../../../domain/types";
import { ResetIcon } from "../../../shared/ui/icons";

export function MatchScoreStrip({
  matchN,
  myWins,
  oppWins,
  matchWinner,
  hasProgress,
  onReset,
}: {
  matchN: MatchN;
  myWins: number;
  oppWins: number;
  matchWinner: "me" | "opponent" | null;
  hasProgress: boolean;
  onReset: () => void;
}) {
  return (
    <div className="md:hidden flex-shrink-0 border-t border-white/[0.06] bg-[#0d1018] px-4 py-2 flex items-center gap-3">
      <span className="text-white/30 text-[10px] font-semibold uppercase tracking-wider flex-shrink-0">
        Bo{matchN}
      </span>

      <div className="flex gap-1 flex-1">
        {Array.from({ length: Math.ceil(matchN / 2) }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < myWins ? "bg-blue-500" : "bg-white/[0.08]"}`}
          />
        ))}
      </div>

      <div className="font-mono text-sm font-bold tabular-nums flex-shrink-0 min-w-[36px] text-center">
        {matchWinner ? (
          <span className={matchWinner === "me" ? "text-green-400" : "text-red-400"}>
            {matchWinner === "me" ? "Win!" : "Loss"}
          </span>
        ) : (
          <span className="text-white/50">
            {myWins}–{oppWins}
          </span>
        )}
      </div>

      <div className="flex gap-1 flex-1 justify-end">
        {Array.from({ length: Math.ceil(matchN / 2) }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < oppWins ? "bg-red-500" : "bg-white/[0.08]"}`}
          />
        ))}
      </div>

      {hasProgress && (
        <button
          type="button"
          onClick={onReset}
          className="flex-shrink-0 text-white/20 hover:text-white/50 transition-colors ml-1"
        >
          <ResetIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}