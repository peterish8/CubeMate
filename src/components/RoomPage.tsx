import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMedia } from "../hooks/useMedia";
import { useSession } from "../hooks/useSession";
import { useRoomConnection } from "../hooks/useRoomConnection";
import type { MatchN, Penalty, RoundResult, Solve, SolveId, SyncMessage } from "../lib/types";
import { computeMatch } from "../lib/match";
import { formatTime } from "../lib/timerEngine";
import { VideoPanel } from "./VideoPanel";
import { TimerPanel } from "./TimerPanel";
import { OpponentStatus } from "./OpponentStatus";
import { SessionsPanel } from "./SessionsPanel";
import { SessionStats } from "./SessionStats";
import { CelebrationOverlay } from "./CelebrationOverlay";

type MobileTab = "timer" | "match" | "history";

export function RoomPage() {
  const { roomCode = "" } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();

  const media = useMedia();
  const session = useSession();

  // ── Settings ──────────────────────────────────────────────────────────────
  const [inspectionEnabled, setInspectionEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Mobile navigation ─────────────────────────────────────────────────────
  const [mobileTab, setMobileTab] = useState<MobileTab>("timer");

  // ── Single-solve tracking (for OpponentStatus) ────────────────────────────
  const [myLastTime, setMyLastTime] = useState<number | null>(null);
  const [myFinished, setMyFinished] = useState(false);

  // ── Best-of-N match state ─────────────────────────────────────────────────
  const [matchN, setMatchN] = useState<MatchN>(3);
  const [myMatchTimes, setMyMatchTimes] = useState<(number | null)[]>([]);
  const [oppMatchTimes, setOppMatchTimes] = useState<(number | null)[]>([]);
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);

  const prevOppSolveCountRef = useRef(0);

  // ── Match sync callbacks (stable refs, safe to pass to useRoomConnection) ─
  const handleMatchSync = useCallback(
    (msg: Extract<SyncMessage, { type: "MATCH_CONFIG" | "MATCH_RESET" }>) => {
      if (msg.type === "MATCH_CONFIG") {
        setMatchN(msg.n as MatchN);
      }
      // Always reset on either config change or explicit reset
      setMyMatchTimes([]);
      setOppMatchTimes([]);
      setCelebrationDismissed(false);
      prevOppSolveCountRef.current = 0;
    },
    []
  );

  const room = useRoomConnection(roomCode, media.localStream, handleMatchSync);

  // ── Track opponent's new solves ───────────────────────────────────────────
  const { roundResults, myWins, oppWins, matchWinner } = computeMatch(
    matchN,
    myMatchTimes,
    oppMatchTimes
  );
  const matchOver = matchWinner !== null;

  useEffect(() => {
    if (room.opponent.solveCount > prevOppSolveCountRef.current) {
      prevOppSolveCountRef.current = room.opponent.solveCount;
      if (!matchOver) {
        setOppMatchTimes((prev) => [...prev, room.opponent.latestTime]);
      }
    }
  }, [room.opponent.solveCount, room.opponent.latestTime, matchOver]);

  const showCelebration =
    matchOver && !celebrationDismissed && room.opponent.connected;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSolveComplete = (solve: Solve) => {
    session.addSolve(solve);
    setMyLastTime(solve.finalTimeMs);
    setMyFinished(true);
    setTimeout(() => setMyFinished(false), 30_000);
    if (!matchOver) {
      setMyMatchTimes((prev) => [...prev, solve.finalTimeMs]);
    }
  };

  const handlePenaltyChange = (id: SolveId, penalty: Penalty) => {
    session.updatePenalty(id, penalty);
  };

  const handleSync = useCallback(
    (msg: SyncMessage) => { room.sendSync(msg); },
    [room]
  );

  const handleLeave = () => {
    room.leave();
    media.stopAll();
    navigate("/");
  };

  const handleSetMatchN = (n: MatchN) => {
    setMatchN(n);
    setMyMatchTimes([]);
    setOppMatchTimes([]);
    setCelebrationDismissed(false);
    prevOppSolveCountRef.current = 0;
    room.sendSync({ type: "MATCH_CONFIG", n });
  };

  const handleResetMatch = () => {
    setMyMatchTimes([]);
    setOppMatchTimes([]);
    setCelebrationDismissed(false);
    prevOppSolveCountRef.current = 0;
    room.sendSync({ type: "MATCH_RESET" });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Reconnect badge label ─────────────────────────────────────────────────
  const connLabel =
    room.connectionState === "reconnecting" ? "Reconnecting…" :
    room.connectionState === "connecting"   ? "Connecting"    :
    room.connectionState === "connected"    ? "Connected"     :
    "Waiting";

  return (
    <div className="h-[100dvh] flex flex-col bg-[#090b0f] overflow-hidden">

      {/* ── Celebration overlay ────────────────────────────────── */}
      {showCelebration && matchWinner && (
        <CelebrationOverlay
          winner={matchWinner}
          myWins={myWins}
          oppWins={oppWins}
          matchN={matchN}
          roundResults={roundResults}
          onPlayAgain={() => { handleResetMatch(); setCelebrationDismissed(false); }}
          onLeave={handleLeave}
        />
      )}

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="flex-shrink-0 border-b border-white/[0.07] px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between z-20 bg-[#090b0f]/95 backdrop-blur-xl">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600/20 border border-blue-500/25 flex items-center justify-center">
              <CubeIconSmall className="w-3 h-3 text-blue-400" />
            </div>
            <span className="text-white font-bold text-sm tracking-tight hidden sm:block">
              Cube<span className="text-gradient-blue">Mate</span>
            </span>
          </div>

          <div className="w-px h-4 bg-white/10 hidden sm:block" />

          {/* Room code */}
          <div className="flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] rounded-lg px-2 sm:px-2.5 py-1">
            <span className="font-mono text-[11px] sm:text-xs text-white/60 tracking-[0.15em] sm:tracking-[0.2em]">
              {roomCode}
            </span>
            <button onClick={copyLink} className="text-white/30 hover:text-white/70 transition-colors ml-0.5">
              {copied ? <CheckIcon className="w-3 h-3 text-green-400" /> : <CopyIcon className="w-3 h-3" />}
            </button>
          </div>

          {/* Connection badge */}
          <ConnectionBadge
            state={room.connectionState}
            label={connLabel}
            onReconnect={
              room.connectionState === "disconnected" || room.connectionState === "reconnecting"
                ? room.reconnect
                : undefined
            }
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Sync toggle — prominent in header */}
          <button
            onClick={() => setSyncEnabled((v) => !v)}
            title={syncEnabled ? "Sync ON: scramble/event broadcast to opponent" : "Sync OFF: independent puzzles"}
            className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium transition-all ${
              syncEnabled
                ? "bg-blue-600/15 border-blue-500/25 text-blue-300"
                : "bg-white/[0.05] border-white/[0.09] text-white/30"
            }`}
          >
            <SyncIcon className="w-3 h-3" />
            <span>Sync</span>
          </button>

          <button onClick={media.toggleCamera} title={media.cameraOn ? "Camera off" : "Camera on"}
            className={`btn text-xs py-1 px-2 rounded-lg ${media.cameraOn ? "btn-secondary" : "bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/25"}`}>
            {media.cameraOn ? <CameraIcon className="w-3.5 h-3.5" /> : <CameraOffIcon className="w-3.5 h-3.5" />}
          </button>

          <button onClick={media.toggleMic} title={media.micOn ? "Mute" : "Unmute"}
            className={`btn text-xs py-1 px-2 rounded-lg ${media.micOn ? "btn-secondary" : "bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/25"}`}>
            {media.micOn ? <MicIcon className="w-3.5 h-3.5" /> : <MicOffIcon className="w-3.5 h-3.5" />}
          </button>

          <button onClick={() => setShowSettings((s) => !s)} title="Settings"
            className={`btn text-xs py-1 px-2 rounded-lg ${showSettings ? "bg-white/15 text-white border border-white/20" : "btn-secondary"}`}>
            <SettingsIcon className="w-3.5 h-3.5" />
          </button>

          <button onClick={handleLeave} className="btn btn-danger text-xs py-1 px-2.5 rounded-lg">
            Leave
          </button>
        </div>
      </header>

      {/* ── Settings drawer ────────────────────────────────────── */}
      {showSettings && (
        <div className="flex-shrink-0 border-b border-white/[0.07] px-4 sm:px-5 py-2 sm:py-2.5 bg-[#0d1018] flex flex-wrap gap-4 sm:gap-5 text-sm">
          <ToggleSetting label="Inspection (15s)" value={inspectionEnabled} onChange={setInspectionEnabled} />
          <ToggleSetting label="Sound cues"       value={soundEnabled}      onChange={setSoundEnabled} />
          <ToggleSetting label="Vibration"        value={vibrationEnabled}  onChange={setVibrationEnabled} />
          {/* Sync toggle duplicated here for mobile where header toggle is hidden */}
          <ToggleSetting label="Sync scramble"    value={syncEnabled}       onChange={setSyncEnabled} />
        </div>
      )}

      {/* ── Corruption warning ─────────────────────────────────── */}
      {session.corrupted && (
        <div className="flex-shrink-0 bg-amber-900/30 border-b border-amber-500/20 px-4 py-1.5 text-amber-300/80 text-xs">
          ⚠ Solve data could not be loaded — starting fresh.
        </div>
      )}

      {/* ── Main layout ────────────────────────────────────────── */}
      {/*  Desktop: side-by-side. Mobile: tabs control visibility  */}
      <main className="flex-1 flex overflow-hidden min-h-0">

        {/* LEFT — Timer (+ videos on mobile) */}
        <div className={`
          flex-col flex-1 min-w-0 overflow-hidden
          ${mobileTab === "timer" ? "flex" : "hidden"} md:flex
        `}>
          {/* Video feeds — mobile only, compact row above timer */}
          <div className="md:hidden flex-shrink-0 grid grid-cols-2 gap-1.5 p-2 pb-0">
            <VideoPanel stream={media.localStream} muted label="You"      connected cameraOn={media.cameraOn} mirror />
            <VideoPanel stream={room.remoteStream} label="Opponent" connected={room.opponent.connected} cameraOn />
          </div>

          <TimerPanel
            onSolveComplete={handleSolveComplete}
            onPenaltyChange={handlePenaltyChange}
            onSync={handleSync}
            inspectionEnabled={inspectionEnabled}
            soundEnabled={soundEnabled}
            vibrationEnabled={vibrationEnabled}
            syncEnabled={syncEnabled}
            onSyncEnabledChange={setSyncEnabled}
          />
        </div>

        {/* RIGHT — Match + history */}
        <div className={`
          flex-col flex-1 min-w-0 border-white/[0.07] overflow-hidden
          ${mobileTab === "timer" ? "hidden" : "flex"} md:flex md:border-l
        `}>

          {/* ── Pinned top section ──────────────────────────────── */}
          <div className={`
            flex-shrink-0 p-2 sm:p-3 space-y-2
            ${mobileTab === "history" ? "hidden md:block" : ""}
          `}>
            {/* Videos — desktop only (mobile shows them in timer tab) */}
            <div className="hidden md:grid grid-cols-2 gap-2">
              <VideoPanel stream={media.localStream} muted label="You"      connected cameraOn={media.cameraOn} mirror />
              <VideoPanel stream={room.remoteStream} label="Opponent" connected={room.opponent.connected} cameraOn />
            </div>

            {/* Opponent + session stats */}
            <div className="grid grid-cols-2 gap-2">
              <OpponentStatus opponent={room.opponent} myFinished={myFinished} myTime={myLastTime} />
              <SessionStats solves={session.solves} />
            </div>

            {/* ── Best-of-N match panel ─────────────────────────── */}
            <MatchPanel
              matchN={matchN}
              myWins={myWins}
              oppWins={oppWins}
              winsNeeded={Math.ceil(matchN / 2)}
              roundResults={roundResults}
              matchWinner={matchWinner}
              opponentConnected={room.opponent.connected}
              myPendingRound={myMatchTimes.length > oppMatchTimes.length}
              oppPendingRound={oppMatchTimes.length > myMatchTimes.length}
              onSetMatchN={handleSetMatchN}
              onReset={handleResetMatch}
            />
          </div>

          {/* ── Scrollable history ──────────────────────────────── */}
          <div className={`
            flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 pt-0
            ${mobileTab === "match" ? "hidden md:block" : ""}
          `}>
            <SessionsPanel
              sessions={session.sessions}
              allSolves={session.allSolves}
              currentSessionId={session.currentSessionId}
              onDeleteSolve={session.deleteSolve}
              onUpdatePenalty={session.updatePenalty}
              onDeleteSessions={session.deleteSessions}
              onClearAll={session.clearAll}
            />
          </div>
        </div>
      </main>

      {/* ── Compact match bar — timer tab only, mobile only ───── */}
      {mobileTab === "timer" && (
        <div className="md:hidden flex-shrink-0 border-t border-white/[0.06] bg-[#0d1018] px-4 py-2 flex items-center gap-3">
          {/* Bo label */}
          <span className="text-white/30 text-[10px] font-semibold uppercase tracking-wider flex-shrink-0">
            Bo{matchN}
          </span>

          {/* My pips */}
          <div className="flex gap-1 flex-1">
            {Array.from({ length: Math.ceil(matchN / 2) }, (_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i < myWins ? "bg-blue-500" : "bg-white/[0.08]"}`} />
            ))}
          </div>

          {/* Score */}
          <div className="font-mono text-sm font-bold tabular-nums flex-shrink-0 min-w-[36px] text-center">
            {matchWinner ? (
              <span className={matchWinner === "me" ? "text-green-400" : "text-red-400"}>
                {matchWinner === "me" ? "Win!" : "Loss"}
              </span>
            ) : (
              <span className="text-white/50">{myWins}–{oppWins}</span>
            )}
          </div>

          {/* Opp pips */}
          <div className="flex gap-1 flex-1 justify-end">
            {Array.from({ length: Math.ceil(matchN / 2) }, (_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i < oppWins ? "bg-red-500" : "bg-white/[0.08]"}`} />
            ))}
          </div>

          {/* Reset */}
          {(myMatchTimes.length > 0 || oppMatchTimes.length > 0) && (
            <button onClick={handleResetMatch} className="flex-shrink-0 text-white/20 hover:text-white/50 transition-colors ml-1">
              <ResetIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* ── Mobile bottom tab bar ──────────────────────────────── */}
      <nav className="md:hidden flex-shrink-0 border-t border-white/[0.08] bg-[#090b0f]/95 backdrop-blur-xl flex pb-safe">
        <MobileTabBtn icon={<TimerTabIcon />} label="Timer"   active={mobileTab === "timer"}   onClick={() => setMobileTab("timer")} />
        <MobileTabBtn icon={<MatchTabIcon />} label="Match"   active={mobileTab === "match"}   onClick={() => setMobileTab("match")} />
        <MobileTabBtn icon={<HistoryTabIcon />} label="History" active={mobileTab === "history"} onClick={() => setMobileTab("history")} />
      </nav>
    </div>
  );
}

// ── Match panel ───────────────────────────────────────────────────────────────

interface MatchPanelProps {
  matchN: MatchN;
  myWins: number;
  oppWins: number;
  winsNeeded: number;
  roundResults: RoundResult[];
  matchWinner: "me" | "opponent" | null;
  opponentConnected: boolean;
  myPendingRound: boolean;
  oppPendingRound: boolean;
  onSetMatchN: (n: MatchN) => void;
  onReset: () => void;
}

function MatchPanel({
  matchN, myWins, oppWins, winsNeeded, roundResults,
  matchWinner, opponentConnected, myPendingRound, oppPendingRound,
  onSetMatchN, onReset,
}: MatchPanelProps) {
  const hasProgress = roundResults.length > 0 || myPendingRound || oppPendingRound;

  return (
    <div className="card p-3 space-y-2.5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="section-label">Best of</span>
        <div className="flex items-center gap-1">
          {([1, 3, 5] as MatchN[]).map((n) => (
            <button
              key={n}
              onClick={() => onSetMatchN(n)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                matchN === n
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                  : "text-white/35 hover:bg-white/[0.08] hover:text-white/70"
              }`}
            >
              {n}
            </button>
          ))}
          {hasProgress && (
            <button
              onClick={onReset}
              className="ml-1 text-[10px] text-white/25 hover:text-white/55 px-1.5 py-1 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center gap-3">
        {/* My pips */}
        <div className="flex gap-1 flex-1">
          {Array.from({ length: winsNeeded }, (_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                i < myWins ? "bg-blue-500 shadow-sm shadow-blue-500/50" : "bg-white/[0.08]"
              }`}
            />
          ))}
        </div>

        {/* Centre text */}
        <div className="text-center flex-shrink-0 min-w-[52px]">
          {matchWinner ? (
            <span className={`text-xs font-bold ${matchWinner === "me" ? "text-green-400" : "text-red-400"}`}>
              {matchWinner === "me" ? "You win!" : "They win"}
            </span>
          ) : opponentConnected ? (
            <span className="text-white/30 font-mono text-sm font-bold tabular-nums">
              {myWins}–{oppWins}
            </span>
          ) : (
            <span className="text-white/20 text-[10px]">waiting</span>
          )}
        </div>

        {/* Opp pips */}
        <div className="flex gap-1 flex-1 justify-end">
          {Array.from({ length: winsNeeded }, (_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                i < oppWins ? "bg-red-500 shadow-sm shadow-red-500/50" : "bg-white/[0.08]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Pending indicators */}
      {opponentConnected && (myPendingRound || oppPendingRound) && !matchWinner && (
        <div className="flex items-center justify-between text-[10px]">
          <span className={myPendingRound ? "text-blue-400/70 animate-pulse" : "text-white/20"}>
            {myPendingRound ? "Waiting for opponent…" : ""}
          </span>
          <span className={oppPendingRound ? "text-amber-400/70 animate-pulse" : "text-white/20"}>
            {oppPendingRound ? "Opponent submitted" : ""}
          </span>
        </div>
      )}

      {/* Round history (compact) */}
      {roundResults.length > 0 && (
        <div className="space-y-0.5">
          {roundResults.map((r) => (
            <div key={r.round} className="flex items-center gap-2 text-[10px] font-mono px-0.5">
              <span className="text-white/20 w-6">R{r.round}</span>
              <span className={`flex-1 tabular-nums ${r.winner === "me" ? "text-blue-400" : "text-white/40"}`}>
                {r.myTime === null ? "DNF" : formatTime(r.myTime)}
              </span>
              <span className={`text-[9px] font-bold uppercase ${
                r.winner === "tie" ? "text-amber-400/60" : r.winner === "me" ? "text-green-400/60" : "text-red-400/60"
              }`}>
                {r.winner === "tie" ? "tie" : r.winner === "me" ? "win" : "loss"}
              </span>
              <span className={`flex-1 text-right tabular-nums ${r.winner === "opponent" ? "text-red-400" : "text-white/40"}`}>
                {r.oppTime === null ? "DNF" : formatTime(r.oppTime)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ConnectionBadge({
  state, label, onReconnect,
}: {
  state: string;
  label: string;
  onReconnect?: () => void;
}) {
  const dot =
    state === "connected"    ? "bg-green-400" :
    state === "reconnecting" ? "bg-amber-400 animate-ping" :
    state === "connecting"   ? "bg-amber-400 animate-pulse" :
                               "bg-red-400";
  const text =
    state === "connected"    ? "text-green-400/70" :
    state === "reconnecting" ? "text-amber-400/80" :
    state === "connecting"   ? "text-amber-400/60" :
                               "text-red-400/70";

  return (
    <div className="hidden sm:flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span className={`text-[11px] font-medium ${text}`}>{label}</span>
      {onReconnect && (
        <button
          onClick={onReconnect}
          className="text-[10px] text-blue-400/60 hover:text-blue-400 underline transition-colors ml-0.5"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function ToggleSetting({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 sm:gap-2.5 cursor-pointer">
      <span className="text-white/50 text-xs">{label}</span>
      <div
        onClick={() => onChange(!value)}
        className={`relative rounded-full transition-colors cursor-pointer ${value ? "bg-blue-600" : "bg-white/15"}`}
        style={{ width: "34px", height: "18px" }}
      >
        <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-[17px]" : "translate-x-0.5"}`} />
      </div>
    </label>
  );
}

function MobileTabBtn({
  icon, label, active, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
        active ? "text-blue-400" : "text-white/30 hover:text-white/55"
      }`}
    >
      <div className="w-5 h-5">{icon}</div>
      <span className="text-[9px] font-semibold tracking-wide uppercase">{label}</span>
    </button>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

const CubeIconSmall   = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>;
const CameraIcon      = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>;
const CameraOffIcon   = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 00-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409" /></svg>;
const MicIcon         = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>;
const MicOffIcon      = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.75a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75H9A2.25 2.25 0 0011.25 16.5v-9a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>;
const SettingsIcon    = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CopyIcon        = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>;
const CheckIcon       = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const SyncIcon        = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;

const ResetIcon       = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;

const TimerTabIcon  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-full h-full"><circle cx="12" cy="13" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4l2.5 2.5M12 5V3m-2 0h4" /></svg>;
const MatchTabIcon  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const HistoryTabIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
