import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { ConvexError } from "convex/values";

type Ctx = QueryCtx | MutationCtx;

export async function getOwnedSession(
  ctx: Ctx,
  sessionId: Id<"sessions">,
  userId: Id<"users">
) {
  const doc = await ctx.db.get(sessionId);
  if (!doc || doc.userId !== userId || doc.deletedAt !== undefined) {
    throw new ConvexError({ kind: "not_found", error: "Session not found" });
  }
  return doc;
}

export async function getOwnedSolve(
  ctx: Ctx,
  solveId: Id<"solves">,
  userId: Id<"users">
) {
  const doc = await ctx.db.get(solveId);
  if (!doc || doc.userId !== userId || doc.deletedAt !== undefined) {
    throw new ConvexError({ kind: "not_found", error: "Solve not found" });
  }
  return doc;
}

export async function getSolveByClientId(
  ctx: Ctx,
  userId: Id<"users">,
  clientId: string
) {
  return await ctx.db
    .query("solves")
    .withIndex("by_user_client", (q) => q.eq("userId", userId).eq("clientId", clientId))
    .unique();
}