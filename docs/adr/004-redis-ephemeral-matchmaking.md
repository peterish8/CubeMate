# ADR 004: Ephemeral matchmaking in Redis

## Status

Accepted

## Context

Global random pairing requires shared queue state across signaling server processes. Solves and sessions must remain durable in Convex / localStorage.

## Decision

- Upstash Redis holds only `mm:wait` queue entries (socket id + event + timestamp).
- Pairing uses Lua scripts for atomic pop/push (minimal commands).
- Convex stores solves; Redis never receives times or scrambles.
- Match BoN state stays on P2P `SyncMessage` per ADR 003.

## Consequences

- Signaling Node must be deployed with `UPSTASH_*` for production multi-instance queues.
- `MATCHMAKING_BACKEND=memory` remains valid for local dev without Redis.