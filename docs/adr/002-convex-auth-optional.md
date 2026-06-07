# ADR 002: Optional auth + Convex cloud

## Status

Accepted

## Context

Users expect to race without an account. Signed-in users want cross-device solve backup and a stats dashboard.

## Decision

- **Guest:** `LocalStorageRepository` only; rooms and timer unchanged.
- **Signed in:** `HybridRepository` + Convex Auth (`@convex-dev/auth`).
- **Dashboard:** `/dashboard`, auth-gated; real-time via `useQuery`.

Authorization in Convex functions (ownership checks + optional `convex-helpers` RLS). Never accept `userId` from client args.

## Consequences

- Two deployment targets: static Vite app + Convex backend.
- Privacy policy required for account + cloud storage.