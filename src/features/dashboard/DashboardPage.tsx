import { useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import type { CubeEvent, Solve } from "../../domain/types";
import { WCA_EVENTS } from "../../domain/types";
import { formatTime } from "../../domain/timer/timerEngine";
import { isConvexConfigured } from "../../persistence";
import { AppNav } from "../nav/AppNav";
import { useSession } from "../session/useSession";

interface EventSummaryRow {
  event: CubeEvent;
  solveCount: number;
  bestMs: number | null;
}

interface GlobalTotals {
  totalSolves: number;
  activeEvents: number;
}

function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  if (!isConvexConfigured()) return <DashboardShell />;
  return <DashboardWithAuth />;
}

function DashboardWithAuth() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const overview = useQuery(
    api.stats.eventOverview,
    isAuthenticated ? {} : "skip"
  ) as EventSummaryRow[] | undefined;
  const totals = useQuery(
    api.stats.globalTotals,
    isAuthenticated ? {} : "skip"
  ) as GlobalTotals | undefined;

  if (isLoading) {
    return (
      <div className="page-shell">
        <AppNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <span className="text-white/30 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/signin" replace />;

  return <DashboardShell cloudRows={overview} cloudTotals={totals} />;
}

function DashboardShell({
  cloudRows,
  cloudTotals,
}: {
  cloudRows?: EventSummaryRow[];
  cloudTotals?: GlobalTotals;
} = {}) {
  const session = useSession();
  const navigate = useNavigate();

  const allSolves = session.allSolves;
  const totalLocal = allSolves.length;
  const totalSessions = session.sessions.length;

  const valid333 = allSolves.filter(s => s.event === "333" && s.finalTimeMs !== null);
  const best333 =
    valid333.length > 0
      ? Math.min(...valid333.map(s => s.finalTimeMs as number))
      : null;

  const last5valid = allSolves.filter(s => s.finalTimeMs !== null).slice(-5);
  const ao5 =
    last5valid.length === 5
      ? Math.round(last5valid.reduce((sum, s) => sum + (s.finalTimeMs as number), 0) / 5)
      : null;

  const recentSolves = [...allSolves].reverse().slice(0, 10);

  return (
    <div className="page-shell">
      <AppNav />
      <div className="section-wrap py-7 pb-20 space-y-5 relative z-10">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
          <div>
            <p className="section-label">{greeting()}</p>
            <h1 className="display-title mt-2 text-3xl sm:text-4xl text-white">Your training hub</h1>
            {totalLocal > 0 && (
              <p className="mt-1.5 text-sm text-white/38">
                {totalLocal} solve{totalLocal !== 1 ? "s" : ""} · {totalSessions} session{totalSessions !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => navigate(`/room/${makeRoomCode()}`)}
              className="btn-primary text-sm min-h-[40px] px-5"
            >
              Play
            </button>
            <Link to="/practice" className="btn-secondary text-sm min-h-[40px] px-5">
              Practice
            </Link>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <DashStatCard
            label="Total Solves"
            value={totalLocal > 0 ? totalLocal.toLocaleString() : "—"}
            sub={cloudTotals ? `${cloudTotals.totalSolves} cloud synced` : "local session"}
            accent="blue"
          />
          <DashStatCard
            label="Best 3×3"
            value={best333 != null ? formatTime(best333) : "—"}
            sub="single"
            accent="green"
          />
          <DashStatCard
            label="Ao5"
            value={ao5 != null ? formatTime(ao5) : "—"}
            sub="last 5 valid solves"
            accent="amber"
          />
          <DashStatCard
            label="Sessions"
            value={totalSessions > 0 ? String(totalSessions) : "—"}
            sub={cloudTotals ? `${cloudTotals.activeEvents} events tracked` : "all time"}
            accent="purple"
          />
        </div>

        {/* ── Main Content: recent solves + quick actions ── */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <RecentSolvesCard solves={recentSolves} />
          <QuickActionsCard navigate={navigate} />
        </div>

        {/* ── Cloud Event Coverage ── */}
        {cloudRows && cloudRows.some(r => r.solveCount > 0) && (
          <EventCoverageSection rows={cloudRows} />
        )}
      </div>
    </div>
  );
}

function DashStatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: "blue" | "green" | "amber" | "purple";
}) {
  const valueColor: Record<typeof accent, string> = {
    blue: "text-[#4db6ff]",
    green: "text-[#71f0b6]",
    amber: "text-[#ffb14a]",
    purple: "text-[#c084fc]",
  };

  return (
    <div className="card p-5 sm:p-6 motion-enter">
      <p className="section-label">{label}</p>
      <p className={`metric-number mt-4 text-3xl sm:text-4xl ${valueColor[accent]}`}>{value}</p>
      <p className="mt-2 text-xs text-white/30">{sub}</p>
    </div>
  );
}

function RecentSolvesCard({ solves }: { solves: Solve[] }) {
  if (solves.length === 0) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center gap-2 text-center min-h-[200px]">
        <p className="text-white/30 text-sm font-medium">No solves yet</p>
        <p className="text-white/18 text-xs">Complete a solve to see your history</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-white">Recent solves</h2>
        <Link to="/solves" className="text-xs text-[#4db6ff] hover:text-[#8cd8ff] transition-colors">
          See all →
        </Link>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {solves.map((solve, i) => {
          const isDNF = solve.penalty === "DNF";
          const is2 = solve.penalty === "+2";
          const displayTime = isDNF
            ? "DNF"
            : formatTime(solve.finalTimeMs ?? solve.rawTimeMs);
          const date = new Date(solve.endedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });

          return (
            <div
              key={String(solve.id ?? i)}
              className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/28 w-12 flex-shrink-0">
                  {solve.event}
                </span>
                <span
                  className={`font-mono font-semibold text-sm ${
                    isDNF
                      ? "text-[#ff7d6c]"
                      : is2
                        ? "text-[#ffb14a]"
                        : "text-white"
                  }`}
                >
                  {displayTime}{is2 ? "+" : ""}
                </span>
              </div>
              <span className="text-[11px] text-white/28 flex-shrink-0">{date}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickActionsCard({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const accentHover: Record<string, string> = {
    blue: "hover:border-[rgba(77,182,255,0.22)] hover:bg-[rgba(77,182,255,0.04)]",
    green: "hover:border-[rgba(113,240,182,0.22)] hover:bg-[rgba(113,240,182,0.04)]",
    amber: "hover:border-[rgba(255,177,74,0.22)] hover:bg-[rgba(255,177,74,0.04)]",
    purple: "hover:border-[rgba(192,132,252,0.22)] hover:bg-[rgba(192,132,252,0.04)]",
  };

  const actions = [
    { label: "Solo Practice", desc: "Timer, scramble, session stats", onClick: () => navigate("/practice"), accent: "blue" },
    { label: "Create Private Room", desc: "Share code with a friend", onClick: () => navigate(`/room/${makeRoomCode()}`), accent: "green" },
    { label: "View All Solves", desc: "Full history with export", onClick: () => navigate("/solves"), accent: "amber" },
    { label: "Find Random Cuber", desc: "Random matchmaking queue", onClick: () => navigate("/"), accent: "purple" },
  ];

  return (
    <div className="card p-4 flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-white px-1 pt-1 mb-1">Quick start</h2>
      {actions.map(({ label, desc, onClick, accent }) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] transition-all group ${accentHover[accent]}`}
        >
          <div className="text-left">
            <p className="text-sm font-medium text-white">{label}</p>
            <p className="text-xs text-white/38 mt-0.5">{desc}</p>
          </div>
          <span className="text-white/22 group-hover:text-white/60 transition-colors text-lg leading-none ml-3">→</span>
        </button>
      ))}
    </div>
  );
}

function EventCoverageSection({ rows }: { rows: EventSummaryRow[] }) {
  const eventMeta = new Map(WCA_EVENTS.map(e => [e.id, e.label]));
  const withData = rows.filter(r => r.solveCount > 0);
  const maxSolves = Math.max(...withData.map(r => r.solveCount), 1);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-white">Event coverage</h2>
        <span className="text-xs text-white/35">
          {withData.length} / {WCA_EVENTS.length} events
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {withData.map((row, i) => (
          <div
            key={row.event}
            className={`px-5 py-4 ${
              i < withData.length - 1 ? "border-b border-white/[0.04] lg:border-b-0 lg:border-r" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/28 font-semibold">
                  {row.event}
                </p>
                <p className="text-sm font-medium text-white mt-0.5">
                  {eventMeta.get(row.event) ?? row.event}
                </p>
              </div>
              <span className="text-xs text-white/35 font-mono flex-shrink-0">{row.solveCount}×</span>
            </div>
            <p className="text-xl font-semibold text-white mt-2">
              {row.bestMs != null ? formatTime(row.bestMs) : "—"}
            </p>
            <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1a84ff] to-[#71f0b6]"
                style={{
                  width: `${Math.max(8, Math.round((row.solveCount / maxSolves) * 100))}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
