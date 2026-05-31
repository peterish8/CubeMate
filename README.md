# CubeMate

A **serverless**, **peer-to-peer** speedcubing timer for 1v1 races. No backend. No database. No accounts. Just open the app, share a room code, and race.

Built with **React + TypeScript + Tailwind CSS** and **WebRTC** (via [Trystero](https://github.com/dmotz/trystero)) for zero-server peer-to-peer connections.

---

## Features

- **Zero-server P2P** — Uses BitTorrent DHT for signaling. No backend to maintain, no API keys, no cost.
- **WCA scrambles** — Official 3×3 and 2×2 scrambles via [cubing.js](https://js.cubing.net/)
- **3D scramble preview** — Interactive 3D cube visualization of the current scramble
- **WCA inspection timer** — 15-second inspection with +2/DNF auto-penalty
- **Spacebar-driven timer** — Hold → Release → Start pattern (just like real stackmat timers)
- **Video + voice chat** — WebRTC media streams between both cubers
- **Session-based solve history** — Every visit creates a new session. Sessions persist in localStorage
- **Per-solve delete** — Delete individual solves without affecting opponent data
- **Export** — Export any selection of sessions (or all) as CSV or JSON
- **Stats** — Best, average, ao5, ao12 per session
- **Penalty buttons** — +2, DNF, Clear (only shown after a solve stops)
- **Opponent sync** — See opponent's timer state, event, and latest time in real-time

---

## How it works

### Spacebar flow

| State | Screen | Action |
|-------|--------|--------|
| **Idle** | "READY" — timer at `0.00` | **Hold Space** |
| **Ready** | "HOLDING" — green glow | **Release Space** → starts inspection (or solve if inspection is off) |
| **Inspection** | Countdown `15` → `0` | **Hold Space** → "HOLDING" → **Release** → starts solve |
| **Running** | Big green timer | **Press Space** → stops |
| **Stopped** | Final time shown | **Press Space** → generates new scramble |

No buttons needed. The entire left half of the screen is the timer system.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS |
| Routing | React Router |
| Scrambles | cubing.js (WCA official) |
| 3D Viewer | cubing.js TwistyPlayer |
| P2P Signaling | Trystero (BitTorrent DHT) |
| P2P Media | WebRTC (via Trystero) |
| Storage | localStorage (session-grouped solves) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CubeMate                              │
│                                                              │
│   ┌──────────────────────┐    ┌──────────────────────────┐  │
│   │     LEFT (50%)       │    │       RIGHT (50%)        │  │
│   │                      │    │                          │  │
│   │  ┌──────────────┐   │    │  ┌───────┐ ┌─────────┐  │  │
│   │  │ Scramble     │   │    │  │ Video │ │ Opponent│  │  │
│   │  └──────────────┘   │    │  │ (you) │ │ Status  │  │  │
│   │                      │    │  └───────┘ └─────────┘  │  │
│   │     ┌──────────┐    │    │  ┌───────┐ ┌─────────┐  │  │
│   │     │  TIMER   │    │    │  │ Video │ │ Session │  │  │
│   │     │  0.00    │    │    │  │ (opp) │ │ Stats   │  │  │
│   │     └──────────┘    │    │  └───────┘ └─────────┘  │  │
│   │                      │    │                          │  │
│   │  ┌──────────────┐   │    │  ┌────────────────────┐  │  │
│   │  │ 3D Cube      │   │    │  │ Session History    │  │  │
│   │  └──────────────┘   │    │  │ (scrollable)       │  │  │
│   └──────────────────────┘    │  └────────────────────┘  │  │
│                               └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

        P2P via Trystero (BitTorrent DHT signaling)
```

### Key design decisions

- **No server** — Trystero uses the public BitTorrent DHT network for peer discovery. No Express/Socket.IO server to deploy or maintain.
- **No database** — All solves live in the browser's localStorage, grouped by session.
- **Pure reducer timer** — Timer state is a single `useReducer` with a pure reducer function. `performance.now()` is injected at the hook boundary so the reducer stays testable.
- **Transport abstraction** — `ITransport` interface lets you swap signaling mechanisms (WebRTC DataChannel, Socket.IO, hybrid). Currently uses Trystero's built-in channels.
- **Discriminated unions** — `TimerSnapshot` and `SyncMessage` are discriminated unions; TypeScript enforces exhaustive handling.
- **Branded types** — `RoomCode`, `SolveId`, `SessionId` are branded strings to prevent mixing them up.

---

## Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Type check
npm run typecheck

# Production build
npm run build

# Preview production build locally
npm run preview
```

The app is **100% client-side**. No backend to start.

---

## Deploy

Since this is a static Vite app with no server, you can deploy to any static host:

### Vercel (recommended)

1. Push to GitHub
2. Import repo into [Vercel](https://vercel.com)
3. Framework preset: **Vite**
4. Deploy

That's it. No environment variables needed.

### Netlify / Cloudflare Pages / GitHub Pages

Drop the `dist/` folder after running `npm run build`.

---

## Project Structure

```
src/
├── components/
│   ├── LandingPage.tsx      # Home — create or join a room
│   ├── RoomPage.tsx         # Main 50/50 layout
│   ├── TimerPanel.tsx       # Left half: scramble + timer + cube
│   ├── ScrambleViewer.tsx   # 3D TwistyPlayer cube
│   ├── VideoPanel.tsx       # WebRTC video element
│   ├── OpponentStatus.tsx   # Opponent state + winner banner
│   ├── SessionStats.tsx     # Best / avg / ao5 / ao12 cards
│   └── SessionsPanel.tsx    # Collapsible sessions, export, delete
├── hooks/
│   ├── useMedia.ts          # Camera + mic stream management
│   ├── useSession.ts        # Session creation, solve CRUD, localStorage
│   └── useRoomConnection.ts # Trystero P2P lifecycle
├── lib/
│   ├── types.ts             # Branded types, discriminated unions, Result<T>
│   ├── storage.ts           # localStorage with schema versioning + migration
│   ├── timerEngine.ts       # formatTime, applyPenalty, playBeep, etc.
│   ├── useTimerMachine.ts   # Pure reducer-based timer state machine
│   ├── scramble.ts          # WCA scramble generation via cubing.js
│   ├── stats.ts             # Best, avg, ao5, ao12 calculations
│   └── exportSolves.ts      # CSV + JSON export
├── styles.css               # Tailwind + custom utilities (glows, grid, etc.)
└── App.tsx                  # Router setup
```

---

## Session System

Every time you enter a room, a **new session** is created ("Session 1", "Session 2", …).

- Solves are tagged with a `sessionId`
- Sessions and solves both persist in localStorage
- Old solves from before the session system are auto-migrated into a "Legacy Session" on first load
- You can:
  - Expand/collapse sessions
  - Delete individual solves
  - Select multiple sessions and export only those
  - Delete entire sessions (with confirmation)
  - Clear all data (double-tap to confirm)

---

## Sync Protocol

Timer state changes are sent as `SyncMessage` objects over Trystero's data channel:

```ts
type SyncMessage =
  | { type: "EVENT_CHANGED"; event: CubeEvent }
  | { type: "SCRAMBLE_CHANGED"; event: CubeEvent; scramble: string }
  | { type: "INSPECTION_STARTED"; at: number }
  | { type: "TIMER_STARTED"; at: number }
  | { type: "TIMER_STOPPED"; at: number; rawTimeMs: number; penalty: Penalty; finalTimeMs: number | null; solveId: SolveId }
  | { type: "PENALTY_CHANGED"; penalty: Penalty; solveId: SolveId }
```

This keeps both cubers' UIs in sync without any server relay.

---

## Browser Compatibility

- **Chrome / Edge / Firefox / Safari** — all supported
- **WebRTC** is required for video/chat (all modern browsers)
- **localStorage** is required for solve persistence
- **cubing.js** may show warnings about `worker_threads` / `crypto` during build — these are Node polyfills externalized by Vite and do not affect the browser bundle

---

## License

MIT
