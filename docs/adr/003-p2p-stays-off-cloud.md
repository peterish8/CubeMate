# ADR 003: P2P stays off the cloud

## Status

Accepted

## Context

CubeMate differentiates on peer-to-peer video and no server-side solve storage for guests.

## Decision

- WebRTC / Trystero signaling only for rooms.
- `SyncMessage` stays on the P2P data channel.
- `features/connection` must not import `persistence/` or Convex client code.

Match state in a room is ephemeral unless explicitly synced to Convex in a future ADR.

## Consequences

- Convex schema stores solves/sessions only, not live match scores or video.