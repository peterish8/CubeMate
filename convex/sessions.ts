import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { requireUserId } from "./lib/auth";
import { getOwnedSession } from "./lib/ownership";
import { internal } from "./_generated/api";

export const create = mutation({
  args: {
    clientSessionId: v.string(),
    label: v.string(),
    startedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_user_client", (q) =>
        q.eq("userId", userId).eq("clientSessionId", args.clientSessionId)
      )
      .unique();

    if (existing && existing.deletedAt === undefined) {
      return existing._id;
    }

    const now = Date.now();
    return await ctx.db.insert("sessions", {
      userId,
      clientSessionId: args.clientSessionId,
      label: args.label,
      startedAt: args.startedAt,
      updatedAt: now,
      solveCount: 0,
    });
  },
});

// Paginated — users can have thousands of sessions over time.
export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("sessions")
      .withIndex("by_user_started", (q) => q.eq("userId", userId))
      .order("desc")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .paginate(args.paginationOpts);
  },
});

// Soft-deletes the sessions themselves immediately, then schedules batched
// solve deletion so the mutation never exceeds Convex transaction limits.
export const softDelete = mutation({
  args: { sessionIds: v.array(v.id("sessions")) },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();

    for (const sessionId of args.sessionIds) {
      await getOwnedSession(ctx, sessionId, userId);
      await ctx.db.patch(sessionId, { deletedAt: now, updatedAt: now });

      // Solve deletion is O(solveCount) — run in scheduled batches, not inline,
      // to avoid hitting the ~8192 document-read limit per mutation.
      await ctx.scheduler.runAfter(0, internal.solves.softDeleteBatch, {
        sessionId,
        userId,
        now,
      });
    }
  },
});
