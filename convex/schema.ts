import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { cubeEventValidator, penaltyValidator } from "./lib/validators";

export default defineSchema({
  ...authTables,

  sessions: defineTable({
    userId: v.id("users"),
    clientSessionId: v.string(),
    label: v.string(),
    startedAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
    // Denormalized counter — avoids counting solves on every stats read
    solveCount: v.optional(v.number()),
  })
    .index("by_user_started", ["userId", "startedAt"])
    .index("by_user_client", ["userId", "clientSessionId"]),

  solves: defineTable({
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    clientId: v.string(),
    event: cubeEventValidator,
    // scramble is write-once and can be large (40+ moves) — store only what's
    // needed for stats queries. Full scramble is kept in localStorage; we sync
    // only the compact fields so each document stays tiny (~200 bytes).
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
    deletedAt: v.optional(v.number()),
  })
    // Primary access patterns — all use covered indexes so no full-table scan ever runs
    .index("by_user_ended", ["userId", "endedAt"])
    .index("by_user_session", ["userId", "sessionId", "endedAt"])
    .index("by_user_event", ["userId", "event", "endedAt"])
    .index("by_user_client", ["userId", "clientId"])
    // Sync/delta pulls: anything touched after a cursor
    .index("by_user_updated", ["userId", "updatedAt"]),

  // One row per (user, event) — updated in the same mutation that writes a solve.
  // Dashboard, stats, and total-count queries read from here, never from solves directly.
  // This is the key to staying on Convex free tier with 100k+ solves:
  // most reads never touch the solves table at all.
  eventSummaries: defineTable({
    userId: v.id("users"),
    event: cubeEventValidator,
    solveCount: v.number(),
    bestMs: v.union(v.number(), v.null()),
    lastSolveAt: v.union(v.number(), v.null()),
    updatedAt: v.number(),
  }).index("by_user_event", ["userId", "event"]),
});
