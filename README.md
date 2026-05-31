# CubeMate

A real-time speedcubing timer with P2P video rooms. Share a room code with a friend, race best-of-N matches, and watch each other's live video feeds — no account required, no solve data ever leaves your device.

Built with **React + TypeScript + Tailwind CSS** and **WebRTC** (via [Trystero](https://github.com/dmotz/trystero)) for peer-to-peer connections.

---

## Features

- **P2P video rooms** — WebRTC video + audio between both cubers, peer-to-peer via WebTorrent DHT
- **Best-of-N matches** — Bo1 / Bo3 / Bo5 / Bo7 with live win pips, score tracking, and a celebration overlay
- **All 17 WCA events** — 3x3, 2x2, 4x4, 5x5, 6x6, 7x7, 3BLD, 4BLD, 5BLD, 3x3 OH, FMC, Megaminx, Pyraminx, Skewb, Square-1, Clock, 3x3 MBLD
- **3D scramble viewer** — interactive cubing.js `TwistyPlayer` for every event
- **WCA inspection** — optional 15-second countdown with +2 / DNF auto-penalty, audio cues, and vibration
- **Spacebar timer** — hold → release → solve pattern (just like a stackmat)
- **Session history** — solves grouped by session, with Best / Ao5 / Ao12 / Mean stats
- **Penalty buttons** — +2, DNF, Clear after each solve
- **Export** — download any selection of sessions as CSV or JSON
- **Mobile-first layout** — video feeds + timer on the same screen; match score strip always visible above the tab bar
- **Fully offline-capable** — solo practice works without any internet connection

---

## Spacebar Flow

| State | Display | Action |
| --- | --- | --- |
| **Idle** | `0.00` | Hold Space |
| **Ready** | green glow | Release Space → starts inspection (or solve if disabled) |
| **Inspection** | countdown `15 → 0` | Hold Space → Release → starts solve |
| **Running** | live green timer | Press Space → stops |
| **Stopped** | final time | Press Space → new scramble |

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | React 18, Vite, TypeScript |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 |
| Scrambles | cubing.js (WCA official) |
| 3D Viewer | cubing.js TwistyPlayer |
| P2P | Trystero (WebTorrent DHT) |
| Signaling fallback | Socket.IO (self-hosted) |
| Storage | localStorage / sessionStorage |

---

## Local Development

```bash
# Install dependencies
npm install

# Frontend dev server (http://localhost:5173)
npm run dev

# Optional: Socket.IO signaling server (fallback for strict NAT)
npm run server

# Type check
npm run typecheck

# Production build
npm run build
```

The app is **100% client-side**. The signaling server is optional — WebTorrent DHT handles most connections without it.

---

## Deploy

Static Vite build, no environment variables needed.

### Vercel (recommended)

1. Push to GitHub
2. Import into [Vercel](https://vercel.com), set framework preset to **Vite**
3. Deploy — done

### Netlify / Cloudflare Pages / GitHub Pages

Run `npm run build` and deploy the `dist/` folder.

> The optional Socket.IO signaling server (`server/index.ts`) needs a Node host (e.g. Railway, Render, Fly.io). Without it, the app falls back to WebTorrent DHT signaling, which works for the vast majority of users.

---

## Project Structure

```
src/
├── components/
│   ├── LandingPage.tsx       Home — create or join a room
│   ├── RoomPage.tsx          Main layout orchestrator + mobile tab nav
│   ├── TimerPanel.tsx        Scramble + timer + event selector
│   ├── ScrambleViewer.tsx    3D TwistyPlayer cube (dynamically imported)
│   ├── VideoPanel.tsx        Single WebRTC video tile
│   ├── OpponentStatus.tsx    Opponent state dot, last solve, win/loss banner
│   ├── CelebrationOverlay.tsx  Full-screen match-end overlay
│   ├── SessionStats.tsx      Best / Ao5 / Ao12 / Mean cards
│   └── SessionsPanel.tsx     Solve history, export, delete
├── hooks/
│   ├── useMedia.ts           Camera + mic stream management
│   ├── useSession.ts         Session lifecycle, solve CRUD, localStorage
│   ├── useTimerMachine.ts    Pure useReducer timer state machine
│   └── useRoomConnection.ts  Trystero P2P join/leave, sync messages
├── lib/
│   ├── types.ts              Branded types, discriminated unions, SyncMessage
│   ├── storage.ts            localStorage with schema v1 + migration
│   ├── timerEngine.ts        formatTime, applyPenalty, beep utils
│   ├── scramble.ts           WCA scramble generation
│   ├── stats.ts              Best, mean, Ao5, Ao12
│   ├── match.ts              computeMatch — best-of-N results + wins
│   └── exportSolves.ts       CSV + JSON export
├── styles.css                Tailwind + custom utilities
└── App.tsx                   Router setup
server/
└── index.ts                  Socket.IO signaling server (optional fallback)
```

---

## Sync Protocol

Timer events are broadcast as `SyncMessage` objects over Trystero's data channel — no server relay involved:

```ts
type SyncMessage =
  | { type: "EVENT_CHANGED";      event: CubeEvent }
  | { type: "SCRAMBLE_CHANGED";   event: CubeEvent; scramble: string }
  | { type: "INSPECTION_STARTED"; at: number }
  | { type: "TIMER_STARTED";      at: number }
  | { type: "TIMER_STOPPED";      at: number; rawTimeMs: number; penalty: Penalty; finalTimeMs: number | null; solveId: SolveId }
  | { type: "PENALTY_CHANGED";    penalty: Penalty; solveId: SolveId }
  | { type: "MATCH_CONFIG";       n: MatchN }
  | { type: "MATCH_RESET" }
```

---

## Privacy

Solve data is stored only in your browser's localStorage. Video and sync messages are sent peer-to-peer. The optional signaling server only exchanges WebRTC connection metadata (SDP / ICE candidates) and never sees solve times.

---

## License

MIT
