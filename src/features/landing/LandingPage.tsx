import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthPanel } from "../auth/AuthPanel";
import { usePairing } from "../pairing/usePairing";
import { isConvexConfigured } from "../../persistence";

const ROOM_CODE_REGEX = /^[A-Z0-9]{4,8}$/;

const JOURNEY_STEPS = [
  {
    marker: "Step 01",
    title: "Enter the room",
    body: "Queue for random or paste a private code. No account, no setup — just start.",
  },
  {
    marker: "Step 02",
    title: "Race in real time",
    body: "Shared scramble. Opponent timer live on screen. Score updates the moment a solve lands.",
  },
  {
    marker: "Step 03",
    title: "Requeue in one tap",
    body: "Your session saves automatically. Hit next to race again or review your splits.",
  },
];

const PATHS = [
  {
    label: "Random Match",
    title: "One click, one opponent",
    body: "Hit the queue and get matched in seconds. Shared scramble, live timer, round score always visible.",
    accent: "Instant",
    action: "Find a cuber",
    kind: "queue" as const,
  },
  {
    label: "Private Room",
    title: "Race your crew",
    body: "Generate a room code, share it, start. Best-of-N format with synced scrambles and P2P video.",
    accent: "Private",
    action: "Create room",
    kind: "create" as const,
  },
  {
    label: "Solo Practice",
    title: "Train between matches",
    body: "Full timer with inspection, WCA scrambles, session history, and averages you can export.",
    accent: "Focused",
    action: "Open practice",
    kind: "practice" as const,
  },
];

const SYSTEM_ARTIFACTS = [
  {
    title: "Shared race rooms",
    body: "Every room gets a short code. Share it in one tap. Both players see the same scramble, score, and round state — no sync lag.",
    type: "rooms" as const,
  },
  {
    title: "Live opponent feed",
    body: "Inspection start, solve finish, penalty applied — you see it the moment it happens. No polling, no delay.",
    type: "feed" as const,
  },
  {
    title: "Sessions and averages",
    body: "Every solve is logged automatically. Ao5, Ao12, mean, best, σ — tracked across sessions and exportable as CSV or JSON.",
    type: "stats" as const,
  },
];

const HERO_STATS = ["Best-of-N races", "P2P video feeds", "Private room codes", "Solo practice"];
const HERO_SIGNALS = ["No signup first", "Shared scramble", "Session export"];

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
      setMatchError("Too many skips - wait a minute and try again.");
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
                    <p className="display-subtitle max-w-xl">
                      Race live. Solve fast. Requeue instantly.
                    </p>
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
                  {HERO_SIGNALS.map((signal) => (
                    <span key={signal} className="signal-chip">
                      {signal}
                    </span>
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
                      onChange={(e) => {
                        setError("");
                        setJoinCode(e.target.value.toUpperCase());
                      }}
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
                      onClick={() => {
                        pairing.cancelMatch();
                        setMatchError("");
                      }}
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
                {HERO_STATS.map((stat) => (
                  <span
                    key={stat}
                    className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/46 sm:text-xs"
                  >
                    {stat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-band landing-band-soft cinema-section">
        <div className="section-wrap grid gap-10 md:grid-cols-2 md:gap-12 lg:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.28fr)] lg:gap-14">
          <div className="sticky-rail space-y-4 self-start">
            <p className="section-label">Get started</p>
            <h2 className="display-title max-w-[11ch] text-3xl text-white sm:text-4xl">
              Three ways to race.
            </h2>
            <p className="max-w-md leading-7 text-white/52">Random queue, private room, or solo session — start whichever fits the moment.</p>
          </div>

          <div className="space-y-4">
            {PATHS.map((path, index) => (
              <EntryPathLane
                key={path.title}
                index={index + 1}
                label={path.label}
                title={path.title}
                body={path.body}
                accent={path.accent}
                actionLabel={path.action}
                onAction={() => {
                  if (path.kind === "queue") {
                    handleFindCuber();
                    return;
                  }
                  if (path.kind === "create") {
                    handleCreate();
                    return;
                  }
                  handlePractice();
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="landing-band landing-band-quiet cinema-section">
        <div className="section-wrap grid gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
          <div className="sticky-rail">
            <div className="artifact-panel stage-panel p-4 sm:p-5 lg:p-6">
              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="max-w-xl">
                    <p className="section-label">Live race</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                      Best-of-5 · Round 3
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-white/52 sm:text-base">Score, state, and time — nothing hidden from either side.</p>
                  </div>
                  <span className="w-fit rounded-full border border-[rgba(77,182,255,0.24)] bg-[rgba(77,182,255,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cdeaff]">
                    Round 3
                  </span>
                </div>

                <div className="grid gap-3">
                  <MatchLane name="You" badge="Ready" time="07.91" status="PB pace" accent="green" />
                  <MatchLane
                    name="Opponent"
                    badge="Solving"
                    time="08.34"
                    status="Split second behind"
                    accent="blue"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <ScoreBlock label="Score" value="2-1" />
                  <ScoreBlock label="Event" value="3x3" />
                  <ScoreBlock label="Mode" value="P2P" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="max-w-2xl space-y-3">
              <p className="section-label">How a match flows</p>
              <h2 className="display-title text-3xl text-white sm:text-4xl">
                Queue. Solve. Requeue.
              </h2>
              <p className="text-white/52 leading-7">The whole loop in under a minute. No waiting rooms, no reload.</p>
            </div>

            <div className="grid gap-4 border-t border-white/10 pt-8">
              {JOURNEY_STEPS.map((item, index) => (
                <JourneySequenceCard
                  key={item.title}
                  index={index + 1}
                  marker={item.marker}
                  title={item.title}
                  body={item.body}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-band landing-band-soft cinema-section">
        <div className="section-wrap grid gap-6 md:grid-cols-2 md:gap-10 lg:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
          <div className="sticky-rail space-y-4 p-1 sm:p-2 self-start">
            <p className="section-label">Under the hood</p>
            <h2 className="display-title max-w-[10ch] text-3xl text-white sm:text-4xl">
              Built for the race loop.
            </h2>
            <p className="max-w-md leading-7 text-white/52">Every feature exists to make races start faster, run smoother, and feel more competitive.</p>
          </div>

          <div className="space-y-5">
            {SYSTEM_ARTIFACTS.map((card, index) => (
              <ProtocolArtifact
                key={card.title}
                index={index + 1}
                title={card.title}
                body={card.body}
                type={card.type}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="landing-band landing-band-quiet cinema-section">
        <div className="section-wrap">
          <div className="grid gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="space-y-4">
              <p className="section-label">What you actually get</p>
              <h2 className="display-title max-w-[12ch] text-3xl text-white sm:text-4xl">
                No account. No friction.
              </h2>
              <p className="max-w-md leading-7 text-white/52">Everything runs in the browser. Open a room, share the code, race — start to finish in under 30 seconds.</p>
            </div>

            <div className="space-y-4">
              <FeatureArtifactCard
                title="Instant room entry"
                body="6-character code. Share it anywhere. Your opponent joins in one tap — no download, no account."
                accent="< 30s"
              />
              <FeatureArtifactCard
                title="Real-time opponent view"
                body="See your opponent's timer, inspection state, and round score live — same as if they were sitting across from you."
                accent="P2P"
              />
              <FeatureArtifactCard
                title="Practice that compounds"
                body="Every solo session is logged. Your Ao5, Ao12, and best carry over so race warm-ups actually mean something."
                accent="Ao5"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="landing-finale-shell">
        <div className="landing-finale">
          <div className="landing-finale-glow" />
          <div className="section-wrap relative z-[2]">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] lg:items-end">
              <div className="space-y-6 py-10 sm:py-14">
                <div className="accent-chip w-fit">
                  <span className="h-2 w-2 rounded-full bg-[var(--cm-success)] animate-pulse" />
                  Final call
                </div>
                <div className="space-y-4">
                  <h2 className="display-title max-w-[10ch] text-4xl text-white sm:text-5xl lg:text-6xl">
                    Your next race is one tap away.
                  </h2>
                  <p className="max-w-xl text-base leading-7 text-white/58 sm:text-lg">
                    Random match, private room, or solo session — no signup, no download, just open the link and race.
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

                <div className="grid gap-4 border-t border-white/10 pt-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <div className="space-y-3">
                    <p className="section-label">Backup and sync</p>
                    {isConvexConfigured() ? (
                      <div className="finale-auth-card">
                        <AuthPanel />
                      </div>
                    ) : (
                      <p className="text-sm leading-7 text-white/52">
                        Cloud sync is optional. Add Convex later when you want backup across devices and the dashboard.
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="section-label">Navigate</p>
                    <div className="grid gap-2 text-sm text-white/56 sm:grid-cols-2">
                      <Link to="/practice" className="transition-colors hover:text-white">Practice</Link>
                      <button onClick={handleCreate} className="text-left transition-colors hover:text-white">Create room</button>
                      <button onClick={handleFindCuber} className="text-left transition-colors hover:text-white">Random match</button>
                      {isConvexConfigured() ? (
                        <Link to="/dashboard" className="transition-colors hover:text-white">Dashboard</Link>
                      ) : (
                        <span className="text-white/28">Dashboard optional</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="finale-cube-stage">
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
    return () => {
      if (requestRef.current != null) {
        window.cancelAnimationFrame(requestRef.current);
      }
    };
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
                  style={{
                    transform: `translate3d(${x * offset}px, ${y * offset}px, ${z * offset}px)`,
                  }}
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

function ProtocolArtifact({
  index,
  title,
  body,
  type,
}: {
  index: number;
  title: string;
  body: string;
  type: "rooms" | "feed" | "stats";
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[rgba(10,16,24,0.72)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-md sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(220px,0.7fr)] lg:items-center">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="font-[Sora] text-5xl font-bold tracking-[-0.06em] text-white/10">
              0{index}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-[rgba(77,182,255,0.45)] to-transparent" />
          </div>
          <h3 className="text-2xl font-semibold tracking-tight text-white">{title}</h3>
          <p className="text-sm leading-7 text-white/62 sm:text-base">{body}</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-[rgba(4,8,14,0.76)] p-4">
          {type === "rooms" ? <RoomStackArtifact /> : type === "feed" ? <LiveFeedArtifact /> : <StatsArtifact />}
        </div>
      </div>
    </div>
  );
}

function EntryPathLane({
  index,
  label,
  title,
  body,
  accent,
  actionLabel,
  onAction,
}: {
  index: number;
  label: string;
  title: string;
  body: string;
  accent: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="entry-lane">
      <div className="entry-lane-grid">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="font-[Sora] text-5xl font-bold tracking-[-0.08em] text-white/12">
              0{index}
            </span>
            <div className="space-y-1">
              <p className="section-label">{label}</p>
              <h3 className="text-2xl font-semibold tracking-tight text-white">{title}</h3>
            </div>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-white/64 sm:text-base">{body}</p>
        </div>

        <div className="entry-lane-aside">
          <p className="font-[Sora] text-4xl font-bold tracking-[-0.08em] text-white/16">{accent}</p>
          <button onClick={onAction} className="btn-secondary px-5 text-sm">
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function JourneySequenceCard({
  index,
  marker,
  title,
  body,
}: {
  index: number;
  marker: string;
  title: string;
  body: string;
}) {
  return (
    <div className="journey-sequence-card">
      <div className="journey-sequence-line" />
      <div className="journey-sequence-dot" />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="label-kicker">{marker}</p>
          <h3 className="text-2xl font-semibold tracking-tight text-white">{title}</h3>
          <p className="max-w-xl text-sm leading-7 text-white/65 sm:text-base">{body}</p>
        </div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/28">0{index}</p>
      </div>
    </div>
  );
}

function RoomStackArtifact() {
  const rooms = [
    { label: "Race room", sub: "Best-of-5 · 3×3", state: "Live", accent: "bg-[rgba(113,240,182,0.18)] text-[#d9fff0]" },
    { label: "Private room", sub: "Waiting for player 2", state: "Waiting", accent: "bg-[rgba(77,182,255,0.18)] text-[#d8efff]" },
    { label: "Practice session", sub: "Solo · 12 solves", state: "Active", accent: "bg-white/10 text-white/70" },
  ];

  return (
    <div className="relative h-[170px]">
      {rooms.map((room, index) => (
        <div
          key={room.label}
          className="absolute left-0 right-0 rounded-[18px] border border-white/10 bg-[rgba(10,16,24,0.96)] px-4 py-3 transition-transform"
          style={{
            top: `${index * 34}px`,
            transform: `scale(${1 - index * 0.04})`,
            opacity: 1 - index * 0.16,
            zIndex: 10 - index,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">{room.label}</p>
              <p className="mt-1 text-xs text-white/42">{room.sub}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${room.accent}`}>
              {room.state}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function LiveFeedArtifact() {
  const events = [
    { label: "Round 3 complete", detail: "Your solve · 7.91s saved" },
    { label: "Opponent inspecting", detail: "15s inspection started" },
    { label: "Score updated", detail: "2–1 · Your lead" },
  ];

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center gap-2 font-mono">
        <span className="h-2 w-2 rounded-full bg-[var(--cm-success)] animate-pulse" />
        <span className="uppercase tracking-[0.24em] text-[var(--cm-success)]">Live</span>
      </div>
      {events.map((event, index) => (
        <div
          key={event.label}
          className="flex items-center justify-between gap-3 rounded-[16px] border border-white/[0.08] bg-white/[0.03] px-3 py-2.5"
          style={{ opacity: 1 - index * 0.18 }}
        >
          <span className="font-medium text-white/80">{event.label}</span>
          <span className="text-white/40">{event.detail}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 text-white/36">
        <span className="inline-block h-3 w-1 rounded-full bg-[rgba(77,182,255,0.75)] animate-pulse" />
        <span className="font-mono">syncing...</span>
      </div>
    </div>
  );
}

function StatsArtifact() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/38">
        <span>Session spread</span>
        <span>3x3 focus</span>
      </div>
      <div className="flex h-24 items-end gap-2">
        {[36, 54, 42, 72, 64, 88].map((height, index) => (
          <div key={height} className="flex-1 rounded-t-[12px] bg-white/[0.05]">
            <div
              className="w-full rounded-t-[12px] bg-gradient-to-t from-[rgba(77,182,255,0.72)] to-[rgba(113,240,182,0.88)]"
              style={{ height: `${height}%`, opacity: 0.8 + index * 0.03 }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-white/48">
        <span>Last 6 sessions</span>
        <span>PB pressure rising</span>
      </div>
    </div>
  );
}

function FeatureArtifactCard({
  title,
  body,
  accent,
}: {
  title: string;
  body: string;
  accent: string;
}) {
  return (
    <div className="feature-artifact-card">
      <p className="font-[Sora] text-4xl font-bold tracking-[-0.06em] text-white">{accent}</p>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold tracking-tight text-white">{title}</h3>
        <p className="text-sm leading-7 text-white/62">{body}</p>
      </div>
    </div>
  );
}

function MatchLane({
  name,
  badge,
  time,
  status,
  accent,
}: {
  name: string;
  badge: string;
  time: string;
  status: string;
  accent: "blue" | "green";
}) {
  const accentClass =
    accent === "blue"
      ? "bg-[rgba(77,182,255,0.15)] border-[rgba(77,182,255,0.28)] text-[#d8efff]"
      : "bg-[rgba(113,240,182,0.15)] border-[rgba(113,240,182,0.28)] text-[#ddfff2]";

  return (
    <div className="card flex items-center justify-between gap-4 p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-white">{name}</p>
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${accentClass}`}>
            {badge}
          </span>
        </div>
        <p className="text-sm text-white/55">{status}</p>
      </div>
      <div className="text-right">
        <p className="timer-display text-3xl text-white">{time}</p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/35">latest</p>
      </div>
    </div>
  );
}

function ScoreBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/38">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function SearchingLabel() {
  return (
    <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
      Finding a cuber
      <span className="inline-flex items-end gap-0.5" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="motion-search-dot h-1 w-1 rounded-full bg-current"
            style={{ "--motion-delay": `${index * 120}ms` } as React.CSSProperties}
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}
