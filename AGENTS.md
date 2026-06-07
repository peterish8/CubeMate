# CubeMate — Codebase Guide

Speedcubing timer app with real-time P2P video rooms. Users share a room code, race best-of-N matches, and watch each other's video feeds live — all without a backend storing any solve data.

## Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS v3
- **Real-time**: Trystero (WebTorrent DHT P2P) + Socket.IO server as WebRTC signaling fallback
- **3D scramble viz**: cubing.js `TwistyPlayer` web component
- **Persistence**: localStorage (solves + sessions), sessionStorage (active session ID per tab)
- **State**: Pure React hooks — no Redux / Zustand / Context

## Key Files

| File | Role |
|------|------|
| `src/lib/types.ts` | All domain types: `Solve`, `CubeSession`, `SyncMessage`, `TimerSnapshot`, branded IDs, `MatchN` |
| `src/lib/storage.ts` | localStorage read/write for solves + sessions. Schema v1, includes migration |
| `src/lib/timerEngine.ts` | `formatTime` and timer math utilities |
| `src/lib/scramble.ts` | WCA scramble generation per event |
| `src/lib/stats.ts` | Ao5 / Ao12 / mean / best calculations |
| `src/lib/match.ts` | `computeMatch(n, myTimes, oppTimes)` — best-of-N result, wins, winner |
| `src/lib/exportSolves.ts` | CSV + JSON export helpers |
| `src/hooks/useSession.ts` | Session lifecycle. Creates one session per tab (via `sessionStorage`), persists across room navigation |
| `src/hooks/useTimerMachine.ts` | Pure `useReducer` timer state machine. States: `idle → inspection → solving → done` |
| `src/hooks/useRoomConnection.ts` | Trystero P2P join/leave, remote stream, sync message send/receive |
| `src/hooks/useMedia.ts` | Local camera/mic stream, toggles, cleanup on unmount |
| `src/components/RoomPage.tsx` | Main orchestrator — wires session + room + media + UI together. Owns mobile tab state + match state |
| `src/components/TimerPanel.tsx` | Timer UI, scramble display, event selector, sends `SyncMessage` to opponent |
| `src/components/ScrambleViewer.tsx` | Renders cubing.js `TwistyPlayer` for any WCA event. Dynamically imported |
| `src/components/VideoPanel.tsx` | Single video feed tile with mute/camera-off overlays |
| `src/components/OpponentStatus.tsx` | Opponent connection status, live state dot, last solve time, win/loss banner |
| `src/components/SessionsPanel.tsx` | Solve history grouped by session, delete, export CSV/JSON |
| `src/components/SessionStats.tsx` | Per-session stats (Ao5, Ao12, mean, best) |
| `src/components/CelebrationOverlay.tsx` | Full-screen win/loss overlay at match end |
| `src/components/LandingPage.tsx` | Create / join room UI |
| `server/index.ts` | Socket.IO server: in-memory room map, WebRTC signaling relay, random match queue |

## Data Flow

```
TimerPanel (solve done)
  → RoomPage.handleSolveComplete
      → useSession.addSolve        (saves to localStorage)
      → useRoomConnection.sendSync (sends TIMER_STOPPED to opponent)
      → setMyMatchTimes            (appends to local match state)
```

## Mobile Layout

RoomPage uses three tabs on mobile (`mobileTab: "timer" | "match" | "history"`):

- **Timer tab**: video feeds (compact 2-col grid, `md:hidden`) + TimerPanel + compact match score strip pinned above the tab bar
- **Match tab**: OpponentStatus + match scoreboard
- **History tab**: SessionsPanel + SessionStats

Desktop (`md:`) shows everything in a two-column layout without tabs.

## Session Persistence Logic

`useSession` checks `sessionStorage("cubemate_current_session_id")` on init:
- **Found + exists in localStorage** → reuse (survives room navigation within same tab)
- **Not found** → `createSession()`, write ID to sessionStorage

## Sync Protocol (`SyncMessage` union in `types.ts`)

`EVENT_CHANGED` | `SCRAMBLE_CHANGED` | `STATE_CHANGED` | `INSPECTION_STARTED` | `TIMER_STARTED` | `TIMER_STOPPED` | `PENALTY_CHANGED` | `MATCH_CONFIG` | `MATCH_RESET`

## Storage Keys

- `localStorage["cuberoom_solves"]` — `{ version: 1, solves: Solve[] }`
- `localStorage["cuberoom_sessions"]` — `CubeSession[]`
- `sessionStorage["cubemate_current_session_id"]` — active session ID for this tab

## Routes

- `/` → `LandingPage` (create/join room)
- `/room/:roomCode` → `RoomPage`

## Server

`server/index.ts` — run with `npm run server`. Rooms are in-memory `Map<roomCode, Set<socketId>>`, wiped on restart. Only used for WebRTC signaling; solve data never touches the server.

## Dev Commands

```bash
npm run dev        # Vite dev server (frontend only)
npm run server     # Socket.IO signaling server
npm run build      # tsc + vite build
npm run typecheck  # Type-check without emitting
```

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
