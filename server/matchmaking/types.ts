export type CubeEventCode = string;

export interface QueueEntry {
  socketId: string;
  event: CubeEventCode;
  enqueuedAt: number;
}

export type MatchResult =
  | { status: "waiting" }
  | { status: "matched"; roomCode: string; peerSocketId: string };

export interface MatchmakingBackend {
  enqueue(entry: QueueEntry): Promise<MatchResult>;
  dequeue(socketId: string): Promise<void>;
  removeFromQueue(socketId: string): Promise<void>;
}

export function formatQueueEntry(entry: QueueEntry): string {
  return `${entry.socketId}|${entry.event}|${entry.enqueuedAt}`;
}

export function parseQueueEntry(raw: string): QueueEntry | null {
  const parts = raw.split("|");
  if (parts.length < 3) return null;
  const enqueuedAt = Number(parts[parts.length - 1]);
  const event = parts[parts.length - 2];
  const socketId = parts.slice(0, -2).join("|");
  if (!socketId || !event || !Number.isFinite(enqueuedAt)) return null;
  return { socketId, event, enqueuedAt };
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}