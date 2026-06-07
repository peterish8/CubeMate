# ADR 005: Signaling is match-only; Trystero is media+timer

## Status

Accepted

## Context

`server/index.ts` historically included WebRTC relay handlers, but the React app uses Trystero for video and timer sync.

## Decision

- Socket.IO server handles: `random-match`, `skip-match`, `join-room`, `peer-left`, `matched`.
- Trystero uses the assigned `roomCode` as the P2P topic.
- WebRTC relay handlers are not enabled unless `ENABLE_WEBRTC_RELAY=true`.

## Consequences

- Frontend depends on `VITE_SIGNALING_URL` for queue only, not media.
- `features/connection` must not import persistence (unchanged).