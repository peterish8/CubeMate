import { useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import type { CubeEvent } from "../../domain/types";
import { WCA_EVENTS } from "../../domain/types";
import { formatTime } from "../../domain/timer/timerEngine";
import { isConvexConfigured } from "../../persistence";

interface EventSummaryRow {
  event: CubeEvent;
  solveCount: number;
  bestMs: number | null;
}

interface GlobalTotals {
  totalSolves: number;
  activeEvents: number;
}

export function DashboardPage() {
  if (!isConvexConfigured()) {
    return <ConvexNotConfigured />;
  }
  return <DashboardAuthed />;
}

function ConvexNotConfigured() {
  return (
    <div className="page-shell flex items-center justify-center px-4 py-12">
      <div className="section-wrap max-w-2xl">
        <div className="hero-band p-8 text-center">
          <p className="section-label">Cloud dashboard unavailable</p>
          <h1 className="display-title mt-4 text-4xl text-white">Connect Convex to unlock synced stats.</h1>
          <p className="mt-4 text-white/65 leading-7 max-w-xl mx-auto">
            Add <code className="text-white/80">VITE_CONVEX_URL</code> in{" "}
            <code className="text-white/80">.env.local</code>, then run{" "}
            <code className="text-white/80">npx convex dev</code>.
          </p>
          <div className="mt-6">
            <Link to="/" className="btn-secondary px-6">
              Back home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardAuthed() {
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
      <div className="page-shell flex items-center justify-center px-4 py-12">
        <div className="card px-6 py-5 text-sm text-white/55">Loading dashboard...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const eventMeta = new Map(WCA_EVENTS.map((event) => [event.id, event.label]));
  const rows = overview ?? [];
  const totalSolves = totals?.totalSolves ?? 0;
  const activeEvents = totals?.activeEvents ?? 0;
  const rankedByPractice = rows
    .filter((row) => row.solveCount > 0)
    .sort((a, b) => b.solveCount - a.solveCount || (a.bestMs ?? Number.MAX_SAFE_INTEGER) - (b.bestMs ?? Number.MAX_SAFE_INTEGER));
  const rankedBySpeed = rows
    .filter((row) => row.bestMs != null)
    .sort((a, b) => (a.bestMs ?? Number.MAX_SAFE_INTEGER) - (b.bestMs ?? Number.MAX_SAFE_INTEGER));

  const mostPracticed = rankedByPractice[0];
  const fastestEvent = rankedBySpeed[0];
  const coverage = Math.round((activeEvents / WCA_EVENTS.length) * 100);
  const trackedEvents = rows.filter((row) => row.solveCount > 0).length;
  const untrackedEvents = WCA_EVENTS.length - trackedEvents;
  const hasData = totalSolves > 0;

  return (
    <div className="page-shell">
      <section className="section-wrap pt-8 pb-6 sm:pt-10 sm:pb-8">
        <div className="hero-band p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4 max-w-2xl">
              <p className="section-label">Training dashboard</p>
              <h1 className="display-title text-4xl sm:text-5xl text-white">
                Read the shape of your practice, not just the raw solve count.
              </h1>
              <p className="text-white/65 leading-7 text-base sm:text-lg">
                Track event coverage, spot your strongest category, and see where the next useful
                session should go.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/practice" className="btn-secondary px-6">
                Practice
              </Link>
              <Link to="/" className="btn-secondary px-6">
                Home
              </Link>
            </div>
          </div>

          <div className="dashboard-grid mt-8">
            <SummaryTile
              index={0}
              label="Total solves"
              value={String(totalSolves)}
              note={hasData ? "All synced attempts across your tracked sessions." : "No synced solves yet."}
            />
            <SummaryTile
              index={1}
              label="Active events"
              value={String(activeEvents)}
              note={hasData ? `${coverage}% of WCA events covered.` : "Start with one event and build outward."}
            />
            <SummaryTile
              index={2}
              label="Fastest event"
              value={fastestEvent ? eventMeta.get(fastestEvent.event) ?? fastestEvent.event : "None yet"}
              note={fastestEvent?.bestMs != null ? `Best single ${formatTime(fastestEvent.bestMs)}.` : "A best single will appear after your first tracked solve."}
            />
            <SummaryTile
              index={3}
              label="Most practiced"
              value={mostPracticed ? eventMeta.get(mostPracticed.event) ?? mostPracticed.event : "None yet"}
              note={mostPracticed ? `${mostPracticed.solveCount} solve${mostPracticed.solveCount === 1 ? "" : "s"} logged.` : "Your highest-volume event will show here."}
            />
          </div>
        </div>
      </section>

      <section className="section-wrap py-4 sm:py-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <InsightCard
            title={hasData ? "Current read" : "Get your first solves in"}
            body={
              hasData
                ? buildInsightSentence({
                    fastestEventLabel: fastestEvent ? eventMeta.get(fastestEvent.event) ?? fastestEvent.event : null,
                    mostPracticedLabel: mostPracticed ? eventMeta.get(mostPracticed.event) ?? mostPracticed.event : null,
                    untrackedEvents,
                  })
                : "The dashboard is ready. Log a few solves in practice or during races and CubeMate will start surfacing your strongest event and your training spread."
            }
            footer={hasData ? `${trackedEvents} tracked event${trackedEvents === 1 ? "" : "s"} so far.` : "Practice mode is the fastest way to seed useful stats."}
          />
          <InsightCard
            title="Coverage"
            body={
              hasData
                ? untrackedEvents === 0
                  ? "You have solve data across every WCA event currently listed in CubeMate."
                  : `${untrackedEvents} event${untrackedEvents === 1 ? "" : "s"} still have no synced solves. Fill those gaps if you want a broader training profile.`
                : "Coverage starts at zero until cloud-synced solves exist for this account."
            }
            footer={hasData ? `${coverage}% event coverage across the board.` : "Connect practice to sync and revisit."}
          />
        </div>
      </section>

      <section className="section-wrap pt-4 pb-16 sm:pb-20">
        {hasData ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {WCA_EVENTS.map(({ id, label }, index) => {
              const row = rows.find((item) => item.event === id);
              const count = row?.solveCount ?? 0;
              const best = row?.bestMs;
              const emphasis =
                mostPracticed?.event === id
                  ? "Most practiced"
                  : fastestEvent?.event === id
                    ? "Fastest best"
                    : count === 0
                      ? "Awaiting data"
                      : "Tracked";

              return (
                <div
                  key={id}
                  className="stat-tile motion-dashboard-card motion-hover-card"
                  style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="section-label">{id}</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{label}</h2>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/58">
                      {emphasis}
                    </span>
                  </div>

                  <div className="mt-8 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/36">Best single</p>
                      <p className="metric-number mt-3 text-3xl text-white">
                        {best != null ? formatTime(best) : "--"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/36">Solve count</p>
                      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{count}</p>
                    </div>
                  </div>

                  <div className="mt-6 h-2 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="motion-progress h-full rounded-full bg-gradient-to-r from-[#1a84ff] to-[#71f0b6]"
                      style={{
                        width: `${Math.max(10, mostPracticed ? Math.round((count / Math.max(mostPracticed.solveCount, 1)) * 100) : 10)}%`,
                        opacity: count === 0 ? 0.22 : 1,
                        animationDelay: `${160 + Math.min(index * 45, 360)}ms`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card-elevated p-8 sm:p-10 text-center">
            <p className="section-label">No synced solves yet</p>
            <h2 className="display-title mt-4 text-3xl sm:text-4xl text-white">
              Start a few sessions and this becomes your training map.
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-white/65 leading-7">
              Once solves hit the cloud, CubeMate will highlight your most practiced event, your
              fastest category, and where your event coverage is still thin.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/practice" className="btn-primary px-6">
                Open practice
              </Link>
              <Link to="/" className="btn-secondary px-6">
                Back to landing
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryTile({
  index,
  label,
  value,
  note,
}: {
  index: number;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div
      className="stat-tile motion-dashboard-card motion-hover-card"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <p className="section-label">{label}</p>
      <p className="metric-number mt-5 text-3xl sm:text-4xl text-white">{value}</p>
      <p className="mt-4 text-sm text-white/58 leading-6">{note}</p>
    </div>
  );
}

function InsightCard({
  title,
  body,
  footer,
}: {
  title: string;
  body: string;
  footer: string;
}) {
  return (
    <div className="card motion-enter motion-hover-card p-6 sm:p-7">
      <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
      <p className="mt-4 text-white/65 leading-7">{body}</p>
      <p className="mt-5 text-sm text-white/46">{footer}</p>
    </div>
  );
}

function buildInsightSentence({
  fastestEventLabel,
  mostPracticedLabel,
  untrackedEvents,
}: {
  fastestEventLabel: string | null;
  mostPracticedLabel: string | null;
  untrackedEvents: number;
}) {
  const fastestPart = fastestEventLabel
    ? `${fastestEventLabel} is currently your quickest tracked event`
    : "You do not have a fastest tracked event yet";
  const volumePart = mostPracticedLabel
    ? `${mostPracticedLabel} carries the most volume`
    : "no event has built enough volume yet";
  const spreadPart =
    untrackedEvents > 0
      ? `and ${untrackedEvents} event${untrackedEvents === 1 ? "" : "s"} still have no synced solves.`
      : "and you already have full event coverage.";

  return `${fastestPart}, ${volumePart}, ${spreadPart}`;
}
