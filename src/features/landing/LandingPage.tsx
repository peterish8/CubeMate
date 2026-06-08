import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { AuthPanel } from "../auth/AuthPanel";
import { usePairing } from "../pairing/usePairing";
import { isConvexConfigured } from "../../persistence";

const ROOM_CODE_REGEX = /^[A-Z0-9]{4,8}$/;

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Queue or create",
    body: "Hit random queue and match in seconds, or generate a private room code and share it instantly. No account needed.",
  },
  {
    step: "02",
    title: "Race in real time",
    body: "Both players get the same WCA scramble. Opponent timer runs live. Score updates the moment a solve lands.",
  },
  {
    step: "03",
    title: "Requeue and repeat",
    body: "Your session saves automatically. Hit next to race again, or review splits, averages, and history.",
  },
];

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function LandingPage() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [matchError, setMatchError] = useState("");

  const pairing = usePairing({
    onMatched: (roomCode) => {
      navigate(`/room/${roomCode}`, { state: { fromQueue: true } });
    },
    onSkipRateLimited: () => {
      setMatchError("Too many skips — wait a minute and try again.");
    },
  });

  useEffect(() => () => pairing.disconnect(), []);

  const handleFindCuber = () => {
    setMatchError("");
    pairing.findMatch({ event: "333" });
  };

  const handleCreate = () => navigate(`/room/${generateRoomCode()}`);
  const handlePractice = () => navigate("/practice");

  const handleJoin = () => {
    const code = joinCode.toUpperCase().trim();
    if (!ROOM_CODE_REGEX.test(code)) {
      setError("Enter a valid room code (4-8 letters or numbers)");
      return;
    }
    navigate(`/room/${code}`);
  };

  return (
    <div className="page-shell">
      <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />

      {/* ── HERO (unchanged) ──────────────────────────────────── */}
      <section className="w-full pt-0 pb-8 sm:pb-12">
        <div className="editorial-hero editorial-hero-full">
          <div className="cinema-bar cinema-bar-top cinema-bar-reveal-top" />
          <div className="cinema-bar cinema-bar-bottom cinema-bar-reveal-bottom" />
          <div className="hero-stage-light" />
          <div className="hero-stage-beams" />

          <div className="section-wrap">
            <header className="relative z-[2] flex items-center justify-between gap-4 py-6 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                  <CubeGlyph className="h-5 w-5 text-[#8cd8ff]" />
                </div>
                <div>
                  <p className="font-[Sora] text-lg font-semibold tracking-tight text-white">CubeMate</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/36">Head-to-head cubing</p>
                </div>
              </div>

              <div className="hidden items-center gap-3 md:flex">
                <Link to="/practice" className="text-white/58 transition-colors hover:text-white">
                  Practice
                </Link>
                {isConvexConfigured() && (
                  <Link to="/dashboard" className="text-white/58 transition-colors hover:text-white">
                    Dashboard
                  </Link>
                )}
                {isConvexConfigured() && <HeaderAuthButton />}
                <button onClick={handleCreate} className="btn-secondary min-h-[42px] px-5 text-sm">
                  Create room
                </button>
              </div>
            </header>

            <div className="relative z-[1] grid gap-8 py-10 sm:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:py-20">
              <div className="relative z-[2] flex flex-col justify-center gap-7">
                <div className="space-y-5">
                  <div className="motion-hero-item accent-chip w-fit">
                    <span className="h-2 w-2 rounded-full bg-[var(--cm-success)] animate-pulse" />
                    Live speedcubing arena
                  </div>

                  <div className="motion-hero-item space-y-5" style={{ animationDelay: "90ms" }}>
                    <h1 className="display-title max-w-[10ch] text-5xl text-white sm:text-6xl lg:text-[5.35rem]">
                      Turn every solve into a <span className="text-gradient-blue">cinematic race.</span>
                    </h1>
                    <p className="display-subtitle max-w-xl">Race live. Solve fast. Requeue instantly.</p>
                  </div>
                </div>

                <div className="motion-hero-item flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "180ms" }}>
                  <button
                    onClick={handleFindCuber}
                    disabled={pairing.isQueueActive}
                    className="btn-primary px-6 text-sm sm:text-base"
                  >
                    <UsersIcon className="h-4 w-4" />
                    {pairing.isQueueActive ? <SearchingLabel /> : "Find Random Cuber"}
                  </button>
                  <button onClick={handleCreate} className="btn-secondary px-6 text-sm sm:text-base">
                    <PlusIcon className="h-4 w-4" />
                    Create Private Room
                  </button>
                </div>

                <div
                  className="motion-hero-item flex flex-wrap gap-3 border-t border-white/10 pt-4 sm:pt-5"
                  style={{ animationDelay: "260ms" }}
                >
                  {["No signup first", "Shared scramble", "Session export"].map((signal) => (
                    <span key={signal} className="signal-chip">{signal}</span>
                  ))}
                </div>

                <div className="motion-hero-item join-strip max-w-2xl" style={{ animationDelay: "320ms" }}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="section-label">Join by room code</p>
                    <p className="text-xs text-white/36">4-8 chars</p>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => { setError(""); setJoinCode(e.target.value.toUpperCase()); }}
                      onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                      placeholder="ROOM CODE"
                      maxLength={8}
                      className="input font-mono text-center text-base uppercase tracking-[0.28em]"
                    />
                    <button onClick={handleJoin} className="btn-secondary sm:min-w-[180px]">
                      Join Room
                    </button>
                  </div>
                  {error && <p className="mt-3 text-sm text-[#ffbba9]">{error}</p>}
                  {matchError && <p className="mt-3 text-sm text-[#ffe0ac]">{matchError}</p>}
                  {pairing.isQueueActive && (
                    <button
                      type="button"
                      onClick={() => { pairing.cancelMatch(); setMatchError(""); }}
                      className="mt-3 text-sm text-white/55 transition-colors hover:text-white/80"
                    >
                      Cancel current matchmaking search
                    </button>
                  )}
                </div>
              </div>

              <div className="motion-hero-item hero-cube-stage" style={{ animationDelay: "140ms" }}>
                <div className="hero-cube-atmosphere" />
                <div className="hero-cube-shadow" />
                <div className="hero-cube-reflection" />
                <CinematicCube />
              </div>
            </div>
          </div>

          <div className="relative z-[2] border-t border-white/10 bg-[rgba(6,10,16,0.62)] px-5 py-4 backdrop-blur-sm">
            <div className="section-wrap">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-between">
                {["Best-of-N races", "P2P video feeds", "Private room codes", "Solo practice"].map((s) => (
                  <span key={s} className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/46 sm:text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ───────────────────────────────────────── */}
      <div className="border-y border-white/[0.06] bg-[rgba(6,10,16,0.55)]">
        <div className="section-wrap py-8 sm:py-10">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:divide-x sm:divide-white/[0.06]">
            {[
              { value: "17", label: "WCA events" },
              { value: "P2P", label: "Direct connection" },
              { value: "0", label: "Required accounts" },
              { value: "Ao100", label: "Longest average tracked" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1.5 text-center sm:px-6">
                <p className="font-[Sora] text-2xl font-bold tracking-[-0.04em] text-white sm:text-3xl">
                  {stat.value}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BENTO GRID ────────────────────────────────────────── */}
      <section className="landing-band">
        <div className="section-wrap space-y-10 lg:space-y-14">
          <div className="max-w-2xl space-y-4">
            <p className="section-label">Features</p>
            <h2 className="display-title text-3xl text-white sm:text-4xl lg:text-5xl">
              Everything in the<br className="hidden sm:block" /> race loop.
            </h2>
            <p className="display-subtitle text-base sm:text-lg">
              Built for live races, private rematches, and practice that compounds.
            </p>
          </div>

          <div className="grid auto-rows-auto grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            <div className="bento-card lg:col-span-2">
              <BentoRaceCard />
            </div>
            <div className="bento-card bento-card-accent">
              <BentoInstantCard />
            </div>
            <div className="bento-card">
              <BentoP2PCard />
            </div>
            <div className="bento-card lg:col-span-2">
              <BentoPracticeCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="landing-band landing-band-quiet">
        <div className="section-wrap">
          <div className="mb-10 space-y-3 lg:mb-14">
            <p className="section-label">How it works</p>
            <h2 className="display-title text-3xl text-white sm:text-4xl">
              Queue. Race. Requeue.
            </h2>
            <p className="display-subtitle text-base">The whole loop in under a minute. No reload, no waiting room.</p>
          </div>

          <div className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
            <div className="absolute left-[calc(33.33%+14px)] right-[calc(33.33%+14px)] top-5 hidden h-px bg-gradient-to-r from-transparent via-white/[0.14] to-transparent md:block" />
            {HOW_IT_WORKS.map((item) => (
              <HowItWorksStep key={item.step} step={item.step} title={item.title} body={item.body} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINALE CTA ────────────────────────────────────────── */}
      <section className="landing-finale-shell">
        <div className="landing-finale">
          <div className="landing-finale-glow" />
          <div className="section-wrap relative z-[2]">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] lg:items-end">
              <div className="space-y-6 py-10 sm:py-14">
                <div className="accent-chip w-fit">
                  <span className="h-2 w-2 rounded-full bg-[var(--cm-success)] animate-pulse" />
                  Ready to race
                </div>
                <div className="space-y-4">
                  <h2 className="display-title max-w-[10ch] text-4xl text-white sm:text-5xl lg:text-6xl">
                    Your next race is one tap away.
                  </h2>
                  <p className="max-w-xl text-base leading-7 text-white/58 sm:text-lg">
                    No account. No download. Open a room, share the code, and race — start to finish in under 30 seconds.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button onClick={handleFindCuber} disabled={pairing.isQueueActive} className="btn-primary px-7">
                    {pairing.isQueueActive ? <SearchingLabel /> : "Find Random Cuber"}
                  </button>
                  <button onClick={handleCreate} className="btn-secondary px-7">
                    Create Private Room
                  </button>
                  <Link to="/practice" className="btn-secondary px-7">
                    Solo Practice
                  </Link>
                </div>

                {isConvexConfigured() && (
                  <div className="border-t border-white/[0.08] pt-6" id="backup-sync">
                    <div className="finale-auth-card">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="text-sm font-semibold text-white">Back up your solves</p>
                          <p className="text-xs text-white/40 mt-0.5">Sync across all devices. Free forever.</p>
                        </div>
                        <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--cm-success)] bg-[rgba(113,240,182,0.08)] border border-[rgba(113,240,182,0.2)] rounded-full px-2.5 py-1">
                          Free
                        </span>
                      </div>
                      <AuthPanel />
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-[13px] text-white/35">
                      <Link to="/practice" className="transition-colors hover:text-white/70">Practice</Link>
                      <button onClick={handleCreate} className="transition-colors hover:text-white/70">Create room</button>
                      <button onClick={handleFindCuber} className="transition-colors hover:text-white/70">Random match</button>
                      <Link to="/dashboard" className="transition-colors hover:text-white/70">Dashboard</Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="finale-cube-stage hidden lg:flex">
                <div className="finale-cube-light" />
                <div className="finale-cube-shadow" />
                <CinematicCube grand />
              </div>
            </div>

            <div className="landing-finale-footer">
              <span>CubeMate</span>
              <span>Head-to-head cubing</span>
              <span>Built for pressure</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── BENTO CARDS ───────────────────────────────────────────────────────────────

function BentoRaceCard() {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="space-y-2">
        <p className="section-label">Live race room</p>
        <h3 className="text-2xl font-semibold tracking-tight text-white">Head-to-head in real time.</h3>
        <p className="text-sm leading-relaxed text-white/55">
          Shared scramble. Opponent timer live on screen. Score and round state visible to both players throughout.
        </p>
      </div>
      <div className="flex-1 rounded-2xl border border-white/[0.08] bg-[rgba(4,8,14,0.72)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--cm-success)] animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--cm-success)]">Live</span>
          </div>
          <span className="font-mono text-[11px] text-white/30">Round 3 · Best of 5</span>
        </div>
        <BentoMatchRow name="You" time="8.24" badge="Ready" accent="green" />
        <BentoMatchRow name="Opponent" time="9.11" badge="Solving" accent="blue" />
        <div className="grid grid-cols-3 gap-2 pt-1">
          <BentoScoreBlock label="Score" value="2–1" highlight />
          <BentoScoreBlock label="Event" value="3×3" />
          <BentoScoreBlock label="Mode" value="P2P" />
        </div>
      </div>
    </div>
  );
}

function BentoMatchRow({
  name, time, badge, accent,
}: {
  name: string; time: string; badge: string; accent: "blue" | "green";
}) {
  const cls =
    accent === "green"
      ? "bg-[rgba(113,240,182,0.14)] border border-[rgba(113,240,182,0.28)] text-[#d9fff0]"
      : "bg-[rgba(77,182,255,0.14)] border border-[rgba(77,182,255,0.28)] text-[#d8efff]";
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white">{name}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{badge}</span>
      </div>
      <span className="font-mono text-lg font-bold tracking-tight text-white">{time}</span>
    </div>
  );
}

function BentoScoreBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 ${highlight ? "border-[rgba(77,182,255,0.2)] bg-[rgba(77,182,255,0.07)]" : "border-white/[0.07] bg-white/[0.03]"}`}
    >
      <p className="text-[9px] uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${highlight ? "text-[#d8efff]" : "text-white"}`}>{value}</p>
    </div>
  );
}

function BentoInstantCard() {
  return (
    <div className="flex h-full flex-col justify-between gap-6">
      <p className="section-label">Zero barrier</p>
      <div className="space-y-2">
        <p className="font-[Sora] text-[3.25rem] font-bold leading-none tracking-[-0.05em] text-white">
          &lt;&nbsp;30s
        </p>
        <p className="text-sm leading-relaxed text-white/55">
          From page load to active race. No account, no app, no download required.
        </p>
      </div>
      <div className="space-y-2.5">
        {["No signup required", "Works in any browser", "Share a link to invite"].map((item) => (
          <div key={item} className="flex items-center gap-2.5 text-sm text-white/52">
            <svg className="h-3.5 w-3.5 flex-shrink-0 text-[var(--cm-success)]" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function BentoP2PCard() {
  return (
    <div className="flex h-full flex-col gap-5">
      <p className="section-label">Direct connection</p>
      <div className="flex flex-1 items-center justify-center py-2">
        <div className="flex w-full max-w-[200px] items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.06]">
            <PersonIcon />
          </div>
          <div className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-center gap-1">
              <div className="h-px flex-1 bg-gradient-to-r from-[rgba(77,182,255,0.7)] to-[rgba(113,240,182,0.7)]" />
              <span className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-white/40">
                WebRTC
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-[rgba(77,182,255,0.7)] to-[rgba(113,240,182,0.7)]" />
            </div>
            <span className="text-[9px] text-white/25">No relay server</span>
          </div>
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.06]">
            <PersonIcon />
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold tracking-tight text-white">No relay. No lag.</p>
        <p className="text-sm leading-relaxed text-white/50">
          Video and timer data go directly browser-to-browser via WebRTC. No middleman in the race.
        </p>
      </div>
    </div>
  );
}

function PersonIcon() {
  return (
    <svg className="h-5 w-5 text-white/45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function BentoPracticeCard() {
  const bars = [52, 68, 44, 82, 71, 94, 78, 88];
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(230px,0.9fr)]">
      <div className="space-y-4">
        <p className="section-label">Practice mode</p>
        <h3 className="text-2xl font-semibold tracking-tight text-white">Every solve, tracked.</h3>
        <p className="text-sm leading-relaxed text-white/55">
          Full inspection timer, WCA scrambles, and session history. Ao5, Ao12, Ao50, and Ao100 computed across sessions — exportable as CSV or JSON whenever you need it.
        </p>
        <div className="flex flex-wrap gap-2">
          {["Ao5", "Ao12", "Ao50", "Ao100", "Mean", "σ dev"].map((label) => (
            <span
              key={label}
              className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-white/60"
            >
              {label}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportBadge label="CSV" />
          <ExportBadge label="JSON" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[rgba(4,8,14,0.72)] p-4 space-y-4">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-white/32">
          <span>Last 8 solves</span>
          <span>3×3</span>
        </div>
        <div className="flex h-20 items-end gap-1">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t-md bg-white/[0.04]">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-[rgba(77,182,255,0.65)] to-[rgba(113,240,182,0.88)]"
                style={{ height: `${h}%` }}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <PracticeStatTile label="Ao5" value="8.24" />
          <PracticeStatTile label="Ao12" value="8.71" />
          <PracticeStatTile label="Best" value="7.13" />
        </div>
      </div>
    </div>
  );
}

function ExportBadge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/50">
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v9m0 0l-3-3m3 3l3-3M3 13h10" />
      </svg>
      {label}
    </div>
  );
}

function PracticeStatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-2.5 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/32">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function HowItWorksStep({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.05]">
        <span className="font-mono text-xs font-bold text-white/40">{step}</span>
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold tracking-tight text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-white/55">{body}</p>
      </div>
    </div>
  );
}

// ── CINEMATIC CUBE (unchanged) ─────────────────────────────────────────────────

function CinematicCube({ grand = false }: { grand?: boolean }) {
  const cubeRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const autoRotation = useRef({ x: -32, y: 42, z: 0 });
  const dragState = useRef({ active: false, startX: 0, startY: 0, baseX: -32, baseY: 42 });
  const [isDragging, setIsDragging] = useState(false);
  const positions = [-1, 0, 1];
  const offset = grand ? 82 : 66;

  useEffect(() => {
    const animate = () => {
      if (!dragState.current.active) {
        autoRotation.current.x += 0.18;
        autoRotation.current.y += 0.28;
        autoRotation.current.z += 0.08;
      }
      if (cubeRef.current) {
        cubeRef.current.style.transform = `rotateX(${autoRotation.current.x}deg) rotateY(${autoRotation.current.y}deg) rotateZ(${autoRotation.current.z}deg)`;
      }
      requestRef.current = window.requestAnimationFrame(animate);
    };
    requestRef.current = window.requestAnimationFrame(animate);
    return () => { if (requestRef.current != null) window.cancelAnimationFrame(requestRef.current); };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragState.current.active = true;
    setIsDragging(true);
    dragState.current.startX = e.clientX;
    dragState.current.startY = e.clientY;
    dragState.current.baseX = autoRotation.current.x;
    dragState.current.baseY = autoRotation.current.y;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    autoRotation.current.x = dragState.current.baseX - dy * 0.34;
    autoRotation.current.y = dragState.current.baseY + dx * 0.42;
    if (cubeRef.current) {
      cubeRef.current.style.transform = `rotateX(${autoRotation.current.x}deg) rotateY(${autoRotation.current.y}deg) rotateZ(${autoRotation.current.z}deg)`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragState.current.active = false;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      className={grand ? "cube-scene cube-scene-grand" : "cube-scene"}
      aria-hidden="true"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      <div className="cube-stars" />
      <div className={grand ? "cube-wrapper cube-wrapper-grand" : "cube-wrapper"} ref={cubeRef}>
        {positions.flatMap((x) =>
          positions.flatMap((y) =>
            positions.flatMap((z) => {
              if (x === 0 && y === 0 && z === 0) return [];
              return (
                <div
                  key={`${x}-${y}-${z}`}
                  className={grand ? "cubelet cubelet-grand" : "cubelet"}
                  style={{ transform: `translate3d(${x * offset}px, ${y * offset}px, ${z * offset}px)` }}
                >
                  <div className="cube-face face-front" />
                  <div className="cube-face face-back" />
                  <div className="cube-face face-right" />
                  <div className="cube-face face-left" />
                  <div className="cube-face face-top" />
                  <div className="cube-face face-bottom" />
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}

// ── HEADER AUTH BUTTON ────────────────────────────────────────────────────────

function HeaderAuthButton() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  if (isLoading) return null;
  if (isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => void signOut()}
        className="text-sm text-[#8cd8ff] transition-colors hover:text-white"
      >
        Sign out
      </button>
    );
  }
  return (
    <a href="#backup-sync" className="text-white/58 transition-colors hover:text-white text-sm">
      Sign in
    </a>
  );
}

// ── SHARED SMALL COMPONENTS ────────────────────────────────────────────────────

function SearchingLabel() {
  return (
    <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
      Finding a cuber
      <span className="inline-flex items-end gap-0.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="motion-search-dot h-1 w-1 rounded-full bg-current"
            style={{ "--motion-delay": `${i * 120}ms` } as React.CSSProperties}
          />
        ))}
      </span>
    </span>
  );
}

function CubeGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5 12 2.25 3 7.5m18 0-9 5.25m9-5.25v9L12 21.75M3 7.5l9 5.25M3 7.5v9L12 21.75m0-9v9" />
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

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
