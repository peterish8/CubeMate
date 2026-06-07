import { query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

/** All per-event summary rows for the dashboard grid (max 16). */
export const eventOverview = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("eventSummaries")
      .withIndex("by_user_event", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const globalTotals = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const summaries = await ctx.db
      .query("eventSummaries")
      .withIndex("by_user_event", (q) => q.eq("userId", userId))
      .collect();

    const totalSolves = summaries.reduce((n, s) => n + s.solveCount, 0);
    const activeEvents = summaries.filter((s) => s.solveCount > 0).length;

    return { totalSolves, activeEvents };
  },
});