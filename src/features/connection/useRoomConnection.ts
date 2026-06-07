import { useCallback, useEffect, useRef, useState } from "react";
import { joinRoom } from "@trystero-p2p/torrent";
import type { Room } from "@trystero-p2p/torrent";
import type { OpponentState, SyncMessage } from "../../domain/types";
import {
  applySyncMessage,
  INITIAL_OPPONENT,
  opponentOnPeerJoin,
  opponentOnPeerLeave,
  type MatchSyncHandler,
} from "./syncProtocol";

export type ConnectionState = "connecting" | "connected" | "disconnected" | "reconnecting";

export interface UseRoomConnectionResult {
  remoteStream: MediaStream | null;
  connectionState: ConnectionState;
  opponent: OpponentState;
  sendSync: (msg: SyncMessage) => void;
  reconnect: () => void;
  leave: () => void;
}

const MAX_AUTO_RECONNECT = 3;
const RECONNECT_DELAY_MS = 6000;

export function useRoomConnection(
  roomCode: string,
  localStream: MediaStream | null,
  onMatchSync?: MatchSyncHandler
): UseRoomConnectionResult {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [opponent, setOpponent] = useState<OpponentState>(INITIAL_OPPONENT);
  const [reconnectKey, setReconnectKey] = useState(0);

  const roomRef = useRef<Room | null>(null);
  const sendSyncRef = useRef<((msg: SyncMessage) => void) | null>(null);
  const localStreamRef = useRef<MediaStream | null>(localStream);
  const peerIdRef = useRef<string | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const onMatchSyncRef = useRef(onMatchSync);

  useEffect(() => {
    onMatchSyncRef.current = onMatchSync;
  });

  useEffect(() => {
    localStreamRef.current = localStream;
    if (localStream && roomRef.current && peerIdRef.current) {
      roomRef.current.addStream(localStream, { target: peerIdRef.current });
    }
  }, [localStream]);

  const handleSyncMessage = useCallback((msg: SyncMessage) => {
    setOpponent((o) => applySyncMessage(o, msg, (m) => onMatchSyncRef.current?.(m)));
  }, []);

  useEffect(() => {
    setConnectionState("connecting");

    const room = joinRoom({ appId: "cubemate-v1" }, roomCode);
    roomRef.current = room;

    const syncAction = room.makeAction<SyncMessage>("sync");
    sendSyncRef.current = (msg) => syncAction.send(msg);
    syncAction.onMessage = (data) => handleSyncMessage(data);

    room.onPeerJoin = (peerId) => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      reconnectAttemptRef.current = 0;
      peerIdRef.current = peerId;
      setConnectionState("connected");
      setOpponent((o) => opponentOnPeerJoin(o));
      if (localStreamRef.current) {
        room.addStream(localStreamRef.current, { target: peerId });
      }
    };

    room.onPeerLeave = () => {
      peerIdRef.current = null;
      setConnectionState("disconnected");
      setRemoteStream(null);
      setOpponent((o) => opponentOnPeerLeave(o));

      if (reconnectAttemptRef.current < MAX_AUTO_RECONNECT) {
        reconnectTimerRef.current = setTimeout(() => {
          reconnectAttemptRef.current += 1;
          setConnectionState("reconnecting");
          setReconnectKey((k) => k + 1);
        }, RECONNECT_DELAY_MS);
      }
    };

    room.onPeerStream = (stream) => {
      setRemoteStream(stream);
    };

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      room.leave();
      roomRef.current = null;
      sendSyncRef.current = null;
      peerIdRef.current = null;
    };
  }, [roomCode, reconnectKey, handleSyncMessage]);

  const sendSync = useCallback((msg: SyncMessage) => {
    sendSyncRef.current?.(msg);
  }, []);

  const reconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttemptRef.current = 0;
    setConnectionState("reconnecting");
    setReconnectKey((k) => k + 1);
  }, []);

  const leave = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    roomRef.current?.leave();
    roomRef.current = null;
    sendSyncRef.current = null;
  }, []);

  return { remoteStream, connectionState, opponent, sendSync, reconnect, leave };
}