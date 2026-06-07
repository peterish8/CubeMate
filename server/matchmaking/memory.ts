import type { MatchmakingBackend, MatchResult, QueueEntry } from "./types";
import { generateRoomCode } from "./types";

export function createMemoryMatchmaking(): MatchmakingBackend {
  const queue: QueueEntry[] = [];

  function indexOf(socketId: string): number {
    return queue.findIndex((e) => e.socketId === socketId);
  }

  return {
    async enqueue(entry: QueueEntry): Promise<MatchResult> {
      const idx = indexOf(entry.socketId);
      if (idx !== -1) return { status: "waiting" };

      if (queue.length > 0) {
        const partner = queue.shift()!;
        if (partner.socketId === entry.socketId) {
          queue.push(entry);
          return { status: "waiting" };
        }
        const roomCode = generateRoomCode();
        return {
          status: "matched",
          roomCode,
          peerSocketId: partner.socketId,
        };
      }

      queue.push(entry);
      return { status: "waiting" };
    },

    async dequeue(socketId: string): Promise<void> {
      const idx = indexOf(socketId);
      if (idx !== -1) queue.splice(idx, 1);
    },

    async removeFromQueue(socketId: string): Promise<void> {
      const idx = indexOf(socketId);
      if (idx !== -1) queue.splice(idx, 1);
    },
  };
}