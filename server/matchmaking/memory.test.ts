import { describe, expect, it } from "vitest";
import { createMemoryMatchmaking } from "./memory";

describe("memory matchmaking", () => {
  it("pairs two waiters", async () => {
    const mm = createMemoryMatchmaking();
    const a = await mm.enqueue({ socketId: "a", event: "333", enqueuedAt: 1 });
    expect(a.status).toBe("waiting");

    const b = await mm.enqueue({ socketId: "b", event: "333", enqueuedAt: 2 });
    expect(b.status).toBe("matched");
    if (b.status === "matched") {
      expect(b.peerSocketId).toBe("a");
      expect(b.roomCode).toHaveLength(6);
    }
  });

  it("does not duplicate queue entries", async () => {
    const mm = createMemoryMatchmaking();
    await mm.enqueue({ socketId: "a", event: "333", enqueuedAt: 1 });
    const again = await mm.enqueue({ socketId: "a", event: "333", enqueuedAt: 2 });
    expect(again.status).toBe("waiting");
  });

  it("dequeues on cancel", async () => {
    const mm = createMemoryMatchmaking();
    await mm.enqueue({ socketId: "a", event: "333", enqueuedAt: 1 });
    await mm.dequeue("a");
    const b = await mm.enqueue({ socketId: "b", event: "333", enqueuedAt: 2 });
    expect(b.status).toBe("waiting");
  });
});