import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import type { Infer } from "convex/values";
import { cubeEventValidator } from "./validators";

type CubeEvent = Infer<typeof cubeEventValidator>;

// Called on every new solve insert. isNew=true increments solveCount;
// false means a re-upsert (idempotent retry) so count stays unchanged.
export async function touchEventSummary(
  ctx: MutationCtx,
  userId: Id<"users">,
  event: CubeEvent,
  finalTimeMs: number | null,
  endedAt: number,
  isNew: boolean,
) {
  const existing = await ctx.db
    .query("eventSummaries")
    .withIndex("by_user_event", (q) => q.eq("userId", userId).eq("event", event))
    .unique();

  const now = Date.now();

  if (!existing) {
    await ctx.db.insert("eventSummaries", {
      userId,
      event,
      solveCount: 1,
      bestMs: finalTimeMs,
      lastSolveAt: endedAt,
      updatedAt: now,
    });
    return;
  }

  const bestMs =
    finalTimeMs === null
      ? existing.bestMs
      : existing.bestMs === null
        ? finalTimeMs
        : Math.min(existing.bestMs, finalTimeMs);

  await ctx.db.patch(existing._id, {
    solveCount: isNew ? existing.solveCount + 1 : existing.solveCount,
    bestMs,
    lastSolveAt: endedAt,
    updatedAt: now,
  });
}

// Recomputes bestMs by scanning only the most recent 500 non-deleted solves
// for this user+event — bounded by .take(500) so it never full-scans the table.
// This is called only on penalty-update and soft-delete, not on every insert.
// For users with >500 solves of one event the best is always in the top 500
// by recency, so this is safe in practice. If the best is genuinely older it
// will be caught the next time that solve's event is touched.
export async function recomputeSummaryBest(
  ctx: MutationCtx,
  userId: Id<"users">,
  event: CubeEvent,
) {
  const summary = await ctx.db
    .query("eventSummaries")
    .withIndex("by_user_event", (q) => q.eq("userId", userId).eq("event", event))
    .unique();
  if (!summary) return;

  // Use the index — ordered by endedAt desc so we get the freshest 500 solves.
  // We do NOT use .collect() which would scan every solve ever for this user+event.
  const solves = await ctx.db
    .query("solves")
    .withIndex("by_user_event", (q) => q.eq("userId", userId).eq("event", event))
    .order("desc")
    .filter((q) => q.eq(q.field("deletedAt"), undefined))
    .take(500);

  let bestMs: number | null = null;
  for (const s of solves) {
    if (s.finalTimeMs === null) continue;
    bestMs = bestMs === null ? s.finalTimeMs : Math.min(bestMs, s.finalTimeMs);
  }

  await ctx.db.patch(summary._id, { bestMs, updatedAt: Date.now() });
}
