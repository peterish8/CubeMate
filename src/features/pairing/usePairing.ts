import { useCallback, useEffect, useRef, useState } from "react";
import type { CubeEvent } from "../../domain/types";
import { getSignalingClient } from "./signalingClient";
import type { FindMatchOptions, PairingStatus } from "./types";

export interface UsePairingOptions {
  /** Join signaling room for peer-left notifications */
  roomCode?: string;
  onMatched?: (roomCode: string) => void;
  onPeerLeft?: (reason?: string) => void;
  onSkipRateLimited?: () => void;
}

export function usePairing(options: UsePairingOptions = {}) {
  const { roomCode, onMatched, onPeerLeft, onSkipRateLimited } = options;
  const [status, setStatus] = useState<PairingStatus>("idle");
  const [findingNext, setFindingNext] = useState(false);
  const [queueEvent, setQueueEvent] = useState<CubeEvent>("333");

  const onMatchedRef = useRef(onMatched);
  const onPeerLeftRef = useRef(onPeerLeft);
  const onSkipRateLimitedRef = useRef(onSkipRateLimited);

  useEffect(() => {
    onMatchedRef.current = onMatched;
    onPeerLeftRef.current = onPeerLeft;
    onSkipRateLimitedRef.current = onSkipRateLimited;
  });

  useEffect(() => {
    const client = getSignalingClient();
    client.setCallbacks({
      onMatched: (payload) => {
        setStatus("matched");
        setFindingNext(false);
        onMatchedRef.current?.(payload.roomCode);
      },
      onWaiting: () => {
        setStatus("waiting");
      },
      onPeerLeft: (reason) => {
        onPeerLeftRef.current?.(reason);
      },
      onSkipRateLimited: () => {
        setFindingNext(false);
        setStatus("idle");
        onSkipRateLimitedRef.current?.();
      },
    });

    return () => {
      client.setCallbacks({});
    };
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    const client = getSignalingClient();
    client.connect();
    client.joinRoom(roomCode);
  }, [roomCode]);

  const findMatch = useCallback((opts?: FindMatchOptions) => {
    const event = opts?.event ?? "333";
    setQueueEvent(event);
    setStatus("connecting");
    const client = getSignalingClient();
    client.connect();
    client.findMatch(event);
    setStatus("waiting");
  }, []);

  const cancelMatch = useCallback(() => {
    getSignalingClient().cancelMatch();
    setStatus("idle");
    setFindingNext(false);
  }, []);

  const skipMatch = useCallback(
    (opts?: FindMatchOptions) => {
      const event = opts?.event ?? queueEvent;
      setFindingNext(true);
      setStatus("waiting");
      const client = getSignalingClient();
      client.connect();
      if (roomCode) client.leaveRoom(roomCode);
      client.skipMatch(event);
    },
    [roomCode, queueEvent]
  );

  const disconnect = useCallback(() => {
    getSignalingClient().cancelMatch();
    if (roomCode) getSignalingClient().leaveRoom(roomCode);
    setStatus("idle");
    setFindingNext(false);
  }, [roomCode]);

  return {
    status,
    findingNext,
    queueEvent,
    findMatch,
    cancelMatch,
    skipMatch,
    disconnect,
    isQueueActive: status === "waiting" || status === "connecting" || findingNext,
  };
}