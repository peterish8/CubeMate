# ADR 001: Persistence seam (SolveRepository)

## Status

Accepted

## Context

Solve data was read/written via `storage.ts` with full-array `localStorage` rewrites. Cloud sync (Convex) requires swapping backends without touching `RoomPage` or timer code.

## Decision

Introduce `SolveRepository` in `src/persistence/`. Adapters:

- `localStorageRepository` — guest / offline
- `hybridRepository` — local write + IndexedDB outbox → Convex (Phase 2)

`useSession` delegates all IO to the repository.

## Consequences

- Timer path stays synchronous from the UI perspective (local write first).
- Tests can mock the repository interface.