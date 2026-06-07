import { createMemoryMatchmaking } from "./memory";
import { createRedisMatchmaking } from "./redis";
import type { MatchmakingBackend } from "./types";

export type { MatchmakingBackend, MatchResult, QueueEntry } from "./types";
export { generateRoomCode } from "./types";

export function createMatchmaking(): MatchmakingBackend & {
  requeueAfterSkip?: (entry: import("./types").QueueEntry) => Promise<import("./types").MatchResult>;
} {
  const backend = process.env.MATCHMAKING_BACKEND ?? "memory";
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (backend === "redis" && url && token) {
    console.log("[matchmaking] Redis backend");
    return createRedisMatchmaking(url, token);
  }

  if (backend === "redis") {
    console.warn("[matchmaking] Redis requested but UPSTASH_* missing — using memory");
  }

  console.log("[matchmaking] Memory backend");
  return createMemoryMatchmaking();
}