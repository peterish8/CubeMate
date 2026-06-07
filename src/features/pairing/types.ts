import type { CubeEvent } from "../../domain/types";

export type PairingStatus =
  | "idle"
  | "connecting"
  | "waiting"
  | "matched"
  | "error";

export interface MatchedPayload {
  roomCode: string;
  peerId: string;
  initiator: boolean;
}

export interface PairingCallbacks {
  onMatched?: (payload: MatchedPayload) => void;
  onWaiting?: () => void;
  onPeerLeft?: (reason?: string) => void;
  onSkipRateLimited?: () => void;
}

export interface FindMatchOptions {
  event?: CubeEvent;
}