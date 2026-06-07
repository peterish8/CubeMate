import { useMemo } from "react";
import type { MatchN, RoundResult } from "../../domain/types";
import { formatTime } from "../../domain/timer/timerEngine";

interface CelebrationOverlayProps {
  winner: "me" | "opponent";
  myWins: number;
  oppWins: number;
  matchN: MatchN;
  roundResults: RoundResult[];
  onPlayAgain: () => void;
  onLeave: () => void;
}

export function CelebrationOverlay({
  winner,
  myWins,
  oppWins,
  matchN,
  roundResults,
  onPlayAgain,
  onLeave,
}: CelebrationOverlayProps) {
  const isWinner = winner === "me";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <Confetti active={isWinner} />

      <div
        className="relative w-full max-w-sm mx-4 rounded-3xl border overflow-hidden shadow-2xl shadow-black/80"
        style={{
          background: isWinner
            ? "linear-gradient(135deg, #0d1f12 0%, #0a1628 100%)"
            : "linear-gradient(135deg, #1a0d0d 0%, #0a0d1a 100%)",
          borderColor: isWinner ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)",
          animation: "celebIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        <div
          className={`absolute top-0 inset-x-0 h-px ${isWinner ? "bg-green-500/40" : "bg-red-500/40"}`}
        />
        <div
          className={`absolute top-0 inset-x-[20%] h-32 blur-[60px] rounded-full ${
            isWinner ? "bg-green-500/15" : "bg-red-500/10"
          }`}
        />

        <div className="relative px-6 pt-8 pb-6 text-center space-y-5">
          <div className="space-y-2">
            <div className="text-5xl mb-1">{isWinner ? "🏆" : "💪"}</div>
            <h2
              className={`text-2xl font-black tracking-tight ${
                isWinner ? "text-green-400" : "text-red-400"
              }`}
            >
              {isWinner ? "You win!" : "Opponent wins"}
            </h2>
            <p className="text-white/40 text-sm">
              Best of {matchN} · Final score
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <ScoreBlock label="You" wins={myWins} highlight={isWinner} />
            <span className="text-white/20 text-xl font-light">–</span>
            <ScoreBlock label="Opponent" wins={oppWins} highlight={!isWinner} />
          </div>

          {roundResults.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-white/25 text-[10px] uppercase tracking-widest font-bold">Round by round</p>
              <div className="space-y-1">
                {roundResults.map((r) => (
                  <RoundRow key={r.round} result={r} />
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onLeave}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/40 border border-white/[0.08] hover:bg-white/[0.05] transition-colors"
            >
              Leave
            </button>
            <button
              onClick={onPlayAgain}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${
                isWinner
                  ? "bg-green-600 hover:bg-green-500 text-white shadow-green-500/30"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30"
              }`}
            >
              Play again
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes celebIn {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(105vh) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function RoundRow({ result }: { result: RoundResult }) {
  const { round, myTime, oppTime, winner } = result;
  const iWon = winner === "me";
  const oppWon = winner === "opponent";

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.05]">
      <span className="text-white/25 text-[10px] font-mono w-12 text-left">R{round}</span>
      <span className={`font-mono text-sm font-bold flex-1 text-left tabular-nums ${iWon ? "text-green-400" : "text-white/50"}`}>
        {myTime === null ? "DNF" : formatTime(myTime)}
      </span>
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
        winner === "tie"
          ? "text-amber-400/70 bg-amber-500/10"
          : iWon
          ? "text-green-400/70 bg-green-500/10"
          : "text-red-400/70 bg-red-500/10"
      }`}>
        {winner === "tie" ? "TIE" : iWon ? "WIN" : "LOSS"}
      </span>
      <span className={`font-mono text-sm font-bold flex-1 text-right tabular-nums ${oppWon ? "text-green-400" : "text-white/50"}`}>
        {oppTime === null ? "DNF" : formatTime(oppTime)}
      </span>
    </div>
  );
}

function ScoreBlock({ label, wins, highlight }: { label: string; wins: number; highlight: boolean }) {
  return (
    <div className="text-center">
      <p className="text-white/35 text-[11px] mb-1">{label}</p>
      <p className={`text-4xl font-black tabular-nums ${highlight ? "text-white" : "text-white/30"}`}>
        {wins}
      </p>
    </div>
  );
}

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];

function Confetti({ active }: { active: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: active ? 70 : 0 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2.5,
        duration: 2.5 + Math.random() * 2.5,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 8,
        isRect: i % 3 !== 0,
      })),
    [active]
  );

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {pieces.map((p) => (
        <div
          key={p.id}
          className={p.isRect ? "absolute top-0" : "absolute top-0 rounded-full"}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.isRect ? p.size * 2 : p.size,
            backgroundColor: p.color,
            opacity: 0,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}
