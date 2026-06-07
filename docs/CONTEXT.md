# CubeMate — Domain glossary

Use these terms in code, ADRs, and UI copy.

| Term | Definition |
|------|------------|
| **Solve** | One timed attempt: event, scramble, raw/final time, penalty, timestamps. |
| **Session** | A group of solves tied to one browser tab visit (`sessionStorage` tab id). |
| **Event** | WCA puzzle type (`333`, `222`, `pyram`, …). A session may contain solves for multiple events. |
| **Room** | Ephemeral P2P arena identified by a room code. Not persisted to cloud. |
| **Queue** | Waiting list for random pairing; stored in Redis (or in-memory locally). |
| **Pairing** | Binding to one opponent for video + BoN; ends on skip or disconnect. |
| **Skip** | End current pairing, re-enter queue; Session and solve history continue. |
| **Match** | Best-of-N race within a pairing. Resets on new pairing; solves still append to Session. |
| **Repository** | Persistence seam (`SolveRepository`). Local-only or hybrid with Convex. |
| **Summary** | Denormalized per-user, per-event stats row in Convex (`eventSummaries`). |
| **Sync message** | P2P timer/event payload (`SyncMessage`). Never stored in Convex. |

## Module boundaries

- `features/connection` — Trystero only; must not import `persistence/`.
- `features/pairing` — Socket.IO queue/skip; must not import `persistence/`.
- `features/session` — solve history UI + `useSession`.
- `features/room` — composes timer, match, media, session, connection.
- `domain/` — pure TypeScript; no React, no `localStorage`, no Convex.