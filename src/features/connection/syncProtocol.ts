import type { MatchN, OpponentState, Penalty, SyncMessage } from "../../domain/types";
import { assertNever } from "../../domain/types";

export const INITIAL_OPPONENT: OpponentState = {
  event: "333",
  state: "idle",
  latestTime: null,
  latestPenalty: "OK",
  connected: false,
  solveCount: 0,
};

export type MatchSyncHandler = (
  msg: Extract<SyncMessage, { type: "MATCH_CONFIG" | "MATCH_RESET" }>
) => void;

/** Pure reducer for incoming P2P sync messages (testable without Trystero). */
export function applySyncMessage(
  opponent: OpponentState,
  msg: SyncMessage,
  onMatchSync?: MatchSyncHandler
): OpponentState {
  switch (msg.type) {
    case "EVENT_CHANGED":
      return { ...opponent, event: msg.event };
    case "SCRAMBLE_CHANGED":
      return opponent;
    case "STATE_CHANGED":
      return { ...opponent, state: msg.state };
    case "INSPECTION_STARTED":
      return { ...opponent, state: "inspection" };
    case "TIMER_STARTED":
      return { ...opponent, state: "running" };
    case "TIMER_STOPPED":
      return {
        ...opponent,
        state: "stopped",
        latestTime: msg.finalTimeMs,
        latestPenalty: msg.penalty as Penalty,
        solveCount: opponent.solveCount + 1,
      };
    case "PENALTY_CHANGED":
      return { ...opponent, latestPenalty: msg.penalty as Penalty };
    case "MATCH_CONFIG":
      onMatchSync?.(msg);
      return opponent;
    case "MATCH_RESET":
      onMatchSync?.(msg);
      return { ...opponent, state: "idle", latestTime: null, latestPenalty: "OK" };
    default:
      assertNever(msg);
  }
}

export function opponentOnPeerJoin(previous: OpponentState): OpponentState {
  return { ...INITIAL_OPPONENT, connected: true, event: previous.event };
}

export function opponentOnPeerLeave(opponent: OpponentState): OpponentState {
  return { ...opponent, connected: false, state: "idle" };
}