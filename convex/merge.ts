import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { getSolveByClientId } from "./lib/ownership";
import { cubeEventValidator, penaltyValidator } from "./lib/validators";
import { touchEventSummary } from "./lib/summaries";
import { internal } from "./_generated/api";

const sessionInput = v.object({
  clientSessionId: v.string(),
  label: v.string(),
  startedAt: v.number(),
});

const solveInput = v.object({
  clientId: v.string(),
  clientSessionId: v.string(),
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
  updatedAt: v.number(),
});

// Batch size kept well under the ~8192 doc-read limit so each transaction
// is light. Sessions are small so we do all of them in the first mutation;
// solves are chunked and continued via ctx.scheduler.
const SOLVE_BATCH = 50;

/**
 * Entry point called from the client after sign-in.
 * Creates sessions immediately (usually <20), then schedules solve batches.
 */
export const bulkImport = mutation({
  args: {
    sessions: v.array(sessionInput),
    solves: v.array(solveInput),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const sessionIdByClient = new Map<string, Id<"sessions">>();

    // Sessions are tiny and bounded (<100 in practice) — process inline.
    for (const s of args.sessions) {
      const existing = await ctx.db
        .query("sessions")
        .withIndex("by_user_client", (q) =>
          q.eq("userId", userId).eq("clientSessionId", s.clientSessionId)
        )
        .unique();

      if (existing && existing.deletedAt === undefined) {
        sessionIdByClient.set(s.clientSessionId, existing._id);
        continue;
      }

      const id = await ctx.db.insert("sessions", {
        userId,
        clientSessionId: s.clientSessionId,
        label: s.label,
        startedAt: s.startedAt,
        updatedAt: Date.now(),
        solveCount: 0,
      });
      sessionIdByClient.set(s.clientSessionId, id);
    }

    // Build a plain object map (serialisable for scheduler args)
    const sessionMap: Record<string, Id<"sessions">> = {};
    for (const [k, v] of sessionIdByClient) sessionMap[k] = v;

    if (args.solves.length === 0) return { sessionsCreated: sessionIdByClient.size, solvesUpserted: 0 };

    // Schedule first batch — remaining batches self-schedule via continuation
    await ctx.scheduler.runAfter(0, internal.merge.importSolveBatch, {
      userId,
      sessionMap,
      solves: args.solves,
      offset: 0,
    });

    return { sessionsCreated: sessionIdByClient.size, solvesUpserted: args.solves.length };
  },
});

/**
 * Internal continuation — processes one batch of solves, schedules the next.
 * Each invocation reads/writes at most SOLVE_BATCH * 2 documents — well within limits.
 */
export const importSolveBatch = internalMutation({
  args: {
    userId: v.id("users"),
    sessionMap: v.record(v.string(), v.id("sessions")),
    solves: v.array(solveInput),
    offset: v.number(),
  },
  handler: async (ctx, args) => {
    const batch = args.solves.slice(args.offset, args.offset + SOLVE_BATCH);

    for (const solve of batch) {
      const sessionId = args.sessionMap[solve.clientSessionId];
      if (!sessionId) continue;

      const existing = await getSolveByClientId(ctx, args.userId, solve.clientId);
      const now = Date.now();

      if (existing) {
        if (solve.updatedAt >= existing.updatedAt) {
          await ctx.db.patch(existing._id, {
            sessionId,
            event: solve.event,
            scramble: solve.scramble,
            rawTimeMs: solve.rawTimeMs,
            penalty: solve.penalty,
            finalTimeMs: solve.finalTimeMs,
            inspectionMs: solve.inspectionMs,
            startedAt: solve.startedAt,
            endedAt: solve.endedAt,
            dateISO: solve.dateISO,
            comment: solve.comment,
            updatedAt: now,
            deletedAt: undefined,
          });
        }
        continue;
      }

      await ctx.db.insert("solves", {
        userId: args.userId,
        sessionId,
        clientId: solve.clientId,
        event: solve.event,
        scramble: solve.scramble,
        rawTimeMs: solve.rawTimeMs,
        penalty: solve.penalty,
        finalTimeMs: solve.finalTimeMs,
        inspectionMs: solve.inspectionMs,
        startedAt: solve.startedAt,
        endedAt: solve.endedAt,
        dateISO: solve.dateISO,
        comment: solve.comment,
        updatedAt: now,
      });

      await touchEventSummary(ctx, args.userId, solve.event, solve.finalTimeMs, solve.endedAt, true);
    }

    // Schedule next batch if there are more solves remaining
    const nextOffset = args.offset + SOLVE_BATCH;
    if (nextOffset < args.solves.length) {
      await ctx.scheduler.runAfter(0, internal.merge.importSolveBatch, {
        userId: args.userId,
        sessionMap: args.sessionMap,
        solves: args.solves,
        offset: nextOffset,
      });
    }
  },
});
