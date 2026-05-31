import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ROOM_CODE_REGEX = /^[A-Z0-9]{4,8}$/;

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function LandingPage() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const handleCreate = () => navigate(`/room/${generateRoomCode()}`);

  const handleJoin = () => {
    const code = joinCode.toUpperCase().trim();
    if (!ROOM_CODE_REGEX.test(code)) {
      setError("Enter a valid room code (4–8 letters/numbers)");
      return;
    }
    navigate(`/room/${code}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden bg-[#090b0f]">
      {/* Grid dot pattern */}
      <div className="absolute inset-0 bg-grid pointer-events-none" />

      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/[0.07] rounded-full blur-[160px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[400px] bg-cyan-500/[0.05] rounded-full blur-[140px]" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-violet-600/[0.04] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[360px] flex flex-col items-center gap-10">

        {/* Logo */}
        <div className="text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-[18px] bg-blue-600/20 border border-blue-500/25 flex items-center justify-center shadow-2xl shadow-blue-500/10">
            <CubeIcon className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-white leading-none">
              Cube<span className="text-gradient-blue">Mate</span>
            </h1>
            <p className="text-white/35 text-sm mt-2.5 tracking-wide">Live 1v1 speedcubing · No account needed</p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full card-elevated p-6 space-y-4">
          {/* Create */}
          <button
            onClick={handleCreate}
            className="w-full btn-primary py-3.5 text-[15px] rounded-xl font-semibold tracking-wide"
          >
            <PlusIcon className="w-4 h-4" />
            Create New Room
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-white/25 text-[10px] font-semibold tracking-[0.2em] uppercase">or join</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          {/* Join */}
          <div className="space-y-2.5">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => { setError(""); setJoinCode(e.target.value.toUpperCase()); }}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="ROOM CODE"
              maxLength={8}
              className="input w-full font-mono tracking-[0.3em] text-center text-base uppercase"
            />
            {error && (
              <p className="text-red-400/80 text-xs text-center">{error}</p>
            )}
            <button
              onClick={handleJoin}
              className="w-full btn-secondary py-3 text-sm font-medium"
            >
              Join Room
            </button>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {["P2P · No server", "WCA scrambles", "Session history", "CSV & JSON export"].map((f) => (
            <span
              key={f}
              className="text-white/20 text-[11px] bg-white/[0.03] border border-white/[0.06] rounded-full px-3 py-1"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
