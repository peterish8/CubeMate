import { Redis } from "@upstash/redis";
import type { MatchmakingBackend, MatchResult, QueueEntry } from "./types";
import { formatQueueEntry, generateRoomCode, parseQueueEntry } from "./types";

// One list per event so LPOP only touches the relevant queue — O(1) per match op.
// A socket-index hash  mm:socket:<socketId> → queueKey  makes removal O(1)
// without scanning the whole queue list.

function waitKey(event: string): string {
  return `mm:wait:${event}`;
}

function socketKey(socketId: string): string {
  return `mm:socket:${socketId}`;
}

// Lua scripts run atomically inside Redis — this is redis.Redis.prototype.eval
// (Upstash server-side Lua), NOT JavaScript eval(). No arbitrary JS code runs.

// Atomic pair-or-enqueue. Returns matched partner string or "waiting".
// Uses LPOP O(1) — no LRANGE scan because each socket is tracked by the index hash.
const PAIR_LUA = `
local key    = KEYS[1]
local entry  = ARGV[1]
local sockId = ARGV[2]

local existing = redis.call("GET", "mm:socket:" .. sockId)
if existing then
  return "waiting"
end

local partner = redis.call("LPOP", key)
if not partner then
  redis.call("RPUSH", key, entry)
  redis.call("SET", "mm:socket:" .. sockId, key, "EX", 120)
  return "waiting"
end

local pSock = string.match(partner, "^([^|]+)|")
if pSock == sockId then
  redis.call("RPUSH", key, entry)
  redis.call("SET", "mm:socket:" .. sockId, key, "EX", 120)
  return "waiting"
end

redis.call("DEL", "mm:socket:" .. pSock)
return partner
`;

// Atomic skip: remove old entry via index then clear the index key.
// Caller passes the exact raw string to remove so LREM is O(1) effective.
const REMOVE_LUA = `
local sockId     = ARGV[1]
local rawEntry   = ARGV[2]
local queueKey   = redis.call("GET", "mm:socket:" .. sockId)
if queueKey and rawEntry ~= "" then
  redis.call("LREM", queueKey, 1, rawEntry)
end
redis.call("DEL", "mm:socket:" .. sockId)
return "ok"
`;

export function createRedisMatchmaking(
  url: string,
  token: string,
): MatchmakingBackend & {
  requeueAfterSkip(entry: QueueEntry): Promise<MatchResult>;
} {
  const redis = new Redis({ url, token });

  // Look up the exact raw string for a socket from its event queue.
  // The per-event queue is small (bounded by concurrent cubers for that event,
  // typically <50) so this LRANGE is cheap in practice.
  async function findRawEntry(socketId: string): Promise<{ raw: string; qKey: string } | null> {
    const qKey = await redis.get<string>(socketKey(socketId));
    if (!qKey) return null;
    const items = await redis.lrange(qKey, 0, -1);
    for (const raw of items) {
      const e = parseQueueEntry(String(raw));
      if (e?.socketId === socketId) return { raw: String(raw), qKey };
    }
    return null;
  }

  async function enqueue(entry: QueueEntry): Promise<MatchResult> {
    const key = waitKey(entry.event);
    const formatted = formatQueueEntry(entry);
    // redis.eval runs Lua atomically on the Redis server — not JS eval
    const result = await redis.eval(PAIR_LUA, [key], [formatted, entry.socketId]);

    if (result === "waiting") return { status: "waiting" };

    const partner = parseQueueEntry(String(result));
    if (!partner) {
      // Corrupted entry — discard and re-queue self
      await redis.eval(PAIR_LUA, [key], [formatted, entry.socketId]);
      return { status: "waiting" };
    }

    return {
      status: "matched",
      roomCode: generateRoomCode(),
      peerSocketId: partner.socketId,
    };
  }

  async function removeSocket(socketId: string): Promise<void> {
    const found = await findRawEntry(socketId);
    // redis.eval runs Lua atomically on the Redis server — not JS eval
    await redis.eval(REMOVE_LUA, [], [socketId, found?.raw ?? ""]);
  }

  async function requeueAfterSkip(entry: QueueEntry): Promise<MatchResult> {
    const found = await findRawEntry(entry.socketId);
    // redis.eval runs Lua atomically on the Redis server — not JS eval
    await redis.eval(REMOVE_LUA, [], [entry.socketId, found?.raw ?? ""]);
    return enqueue(entry);
  }

  return {
    enqueue,
    dequeue: removeSocket,
    removeFromQueue: removeSocket,
    requeueAfterSkip,
  };
}
