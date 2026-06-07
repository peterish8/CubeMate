import { describe, expect, it } from "vitest";
import { applySyncMessage, INITIAL_OPPONENT } from "./syncProtocol";

describe("applySyncMessage", () => {
  it("updates event on EVENT_CHANGED", () => {
    const next = applySyncMessage(INITIAL_OPPONENT, { type: "EVENT_CHANGED", event: "222" });
    expect(next.event).toBe("222");
  });

  it("increments solve count on TIMER_STOPPED", () => {
    const next = applySyncMessage(INITIAL_OPPONENT, {
      type: "TIMER_STOPPED",
      at: Date.now(),
      rawTimeMs: 5000,
      penalty: "OK",
      finalTimeMs: 5000,
      solveId: "s1" as never,
    });
    expect(next.solveCount).toBe(1);
    expect(next.latestTime).toBe(5000);
    expect(next.state).toBe("stopped");
  });

  it("invokes match handler on MATCH_CONFIG", () => {
    let called = false;
    applySyncMessage(INITIAL_OPPONENT, { type: "MATCH_CONFIG", n: 5 }, () => {
      called = true;
    });
    expect(called).toBe(true);
  });
});