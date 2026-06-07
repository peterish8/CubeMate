import { io, type Socket } from "socket.io-client";
import type { CubeEvent } from "../../domain/types";
import type { MatchedPayload, PairingCallbacks } from "./types";

const DEFAULT_URL = "http://localhost:3001";

function signalingUrl(): string {
  const url = import.meta.env.VITE_SIGNALING_URL;
  return typeof url === "string" && url.length > 0 ? url : DEFAULT_URL;
}

export class SignalingClient {
  private socket: Socket | null = null;
  private callbacks: PairingCallbacks = {};

  connect(): Socket {
    if (this.socket?.connected) return this.socket;

    this.socket = io(signalingUrl(), {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    this.socket.on("matched", (payload: MatchedPayload) => {
      this.callbacks.onMatched?.({
        roomCode: String(payload.roomCode).toUpperCase(),
        peerId: payload.peerId,
        initiator: Boolean(payload.initiator),
      });
    });

    this.socket.on("waiting-for-match", () => {
      this.callbacks.onWaiting?.();
    });

    this.socket.on("peer-left", (payload?: { reason?: string }) => {
      this.callbacks.onPeerLeft?.(payload?.reason);
    });

    this.socket.on("skip-rate-limited", () => {
      this.callbacks.onSkipRateLimited?.();
    });

    return this.socket;
  }

  setCallbacks(callbacks: PairingCallbacks): void {
    this.callbacks = callbacks;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinRoom(roomCode: string): void {
    const s = this.connect();
    s.emit("join-room", roomCode.toUpperCase());
  }

  findMatch(event: CubeEvent = "333"): void {
    const s = this.connect();
    s.emit("random-match", { event });
  }

  cancelMatch(): void {
    this.socket?.emit("cancel-match");
  }

  skipMatch(event: CubeEvent = "333"): void {
    const s = this.connect();
    s.emit("skip-match", { event });
  }

  leaveRoom(roomCode: string): void {
    this.socket?.emit("leave-room", roomCode.toUpperCase());
  }

  isConnected(): boolean {
    return Boolean(this.socket?.connected);
  }
}

let sharedClient: SignalingClient | null = null;

export function getSignalingClient(): SignalingClient {
  if (!sharedClient) sharedClient = new SignalingClient();
  return sharedClient;
}