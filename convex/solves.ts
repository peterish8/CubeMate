import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { requireUserId } from "./lib/auth";
import { getOwnedSession, getOwnedSolve, getSolveByClientId } from "./lib/ownership";
import { cubeEventValidator, penaltyValidator } from "./lib/validators";
import { recomputeSummaryBest, touchEventSummary } from "./lib/summaries";
import { internal } from "./_generated/api";

function applyPenalty(rawTimeMs: number, penalty: "OK" | "+2" | "DNF"): number | null {
  if (penalty === "DNF") return null;
  if (penalty === "+2") return rawTimeMs + 2000;
  return rawTimeMs;
}

export const insert = mutation({
  args: {
    sessionId: v.id("sessions"),
    clientId: v.string(),
    event: cubeEventValidator,
    scramble: v.string(),
    rawTimeMs: v.number(),
    penalty: penaltyValidator,
    finalTimeMs: v.union(v.number(), v.null()),
    inspectionMs: v.number(),
    startedAt: v.number(),
    endedAt: v.number(),
    dateISO: v.string(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await getOwnedSession(ctx, args.sessionId, userId);

    const existing = await getSolveByClientId(ctx, userId, args.clientId);
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        userId,
        updatedAt: now,
        deletedAt: undefined,
      });
      await touchEventSummary(ctx, userId, args.event, args.finalTimeMs, args.endedAt, false);
      return existing._id;
    }

    const id = await ctx.db.insert("solves", {
      userId,
      sessionId: args.sessionId,
      clientId: args.clientId,
      event: args.event,
      scramble: args.scramble,
      rawTimeMs: args.rawTimeMs,
      penalty: args.penalty,
      finalTimeMs: args.finalTimeMs,
      inspectionMs: args.inspectionMs,
      startedAt: args.startedAt,
      endedAt: args.endedAt,
      dateISO: args.dateISO,
      comment: args.comment,
      updatedAt: now,
    });

    await touchEventSummary(ctx, userId, args.event, args.finalTimeMs, args.endedAt, true);
    return id;
  },
});

export const updatePenalty = mutation({
  args: {
    solveId: v.id("solves"),
    penalty: penaltyValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const solve = await getOwnedSolve(ctx, args.solveId, userId);
    const finalTimeMs = applyPenalty(solve.rawTimeMs, args.penalty);
    const now = Date.now();

    await ctx.db.patch(solve._id, {
      penalty: args.penalty,
      finalTimeMs,
      updatedAt: now,
    });

    await recomputeSummaryBest(ctx, userId, solve.event);
  },
});

export const softDelete = mutation({
  args: { solveId: v.id("solves") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const solve = await getOwnedSolve(ctx, args.solveId, userId);
    const now = Date.now();
    await ctx.db.patch(solve._id, { deletedAt: now, updatedAt: now });

    const summary = await ctx.db
      .query("eventSummaries")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("event", solve.event)
      )
      .unique();
    if (summary && summary.solveCount > 0) {
      await ctx.db.patch(summary._id, {
        solveCount: Math.max(0, summary.solveCount - 1),
        updatedAt: now,
      });
      await recomputeSummaryBest(ctx, userId, solve.event);
    }
  },
});

// Paginated — safe for users with 100k+ solves. Pass paginationOpts from the client.
export const listByEvent = query({
  args: {
    event: cubeEventValidator,
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("solves")
      .withIndex("by_user_event", (q) => q.eq("userId", userId).eq("event", args.event))
      .order("desc")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .paginate(args.paginationOpts);
  },
});

// Paginated — each session page stays bounded even if a session has thousands of solves.
export const listBySession = query({
  args: {
    sessionId: v.id("sessions"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await getOwnedSession(ctx, args.sessionId, userId);
    return await ctx.db
      .query("solves")
      .withIndex("by_user_session", (q) =>
        q.eq("userId", userId).eq("sessionId", args.sessionId)
      )
      .order("desc")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .paginate(args.paginationOpts);
  },
});

// Delta sync: fetch only solves modified since a cursor timestamp.
// Clients call this on reconnect to reconcile local state without a full re-download.
export const listUpdatedSince = query({
  args: {
    sinceMs: v.number(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("solves")
      .withIndex("by_user_updated", (q) =>
        q.eq("userId", userId).gte("updatedAt", args.sinceMs)
      )
      .order("asc")
      .paginate(args.paginationOpts);
  },
});

// Internal: soft-delete all non-deleted solves in a session, processed in batches
// to stay within Convex mutation document limits. Scheduled by sessions.softDelete.
export const softDeleteBatch = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    userId: v.id("users"),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const BATCH = 64;
    const rows = await ctx.db
      .query("solves")
      .withIndex("by_user_session", (q) =>
        q.eq("userId", args.userId).eq("sessionId", args.sessionId)
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .take(BATCH);

    for (const row of rows) {
      await ctx.db.patch(row._id, { deletedAt: args.now, updatedAt: args.now });
    }

    // If there are more, schedule another batch
    if (rows.length === BATCH) {
      await ctx.scheduler.runAfter(0, internal.solves.softDeleteBatch, {
        sessionId: args.sessionId,
        userId: args.userId,
        now: args.now,
      });
    }
  },
});
