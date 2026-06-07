import { useCallback, useEffect, useRef, useState } from "react";
import type { MatchSyncHandler } from "../connection/syncProtocol";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { usePairing } from "../pairing/usePairing";
import type { Penalty, SolveId, SyncMessage } from "../../domain/types";
import { useMedia } from "../../hooks/useMedia";
import { useSession } from "../session/useSession";
import { useRoomConnection } from "../connection/useRoomConnection";
import { CelebrationOverlay } from "./CelebrationOverlay";
import { OpponentStatus } from "./OpponentStatus";
import { SessionStats } from "../session/SessionStats";
import { SessionsPanel } from "../session/sessions/SessionsPanel";
import { TimerPanel } from "../timer/TimerPanel";
import { VideoPanel } from "./VideoPanel";
import { MatchPanel } from "../match/MatchPanel";
import { MatchScoreStrip } from "../match/components/MatchScoreStrip";
import { useRoomMatch } from "../match/useRoomMatch";
import { useSolveRecorder } from "../match/useSolveRecorder";
import { RoomHeader } from "./RoomHeader";
import { RoomMobileNav, type MobileTab } from "./RoomMobileNav";
import { RoomSettingsSheet } from "./RoomSettingsSheet";

export function RoomPage() {
  const { roomCode = "" } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromQueue = Boolean(
    (location.state as { fromQueue?: boolean } | null)?.fromQueue
  );

  const media = useMedia();
  const session = useSession();

  const [inspectionEnabled, setInspectionEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("timer");
  const [skipNotice, setSkipNotice] = useState<string | null>(null);

  const matchSyncRef = useRef<MatchSyncHandler | undefined>(undefined);
  const room = useRoomConnection(roomCode, media.localStream, (msg) => matchSyncRef.current?.(msg));

  const matchLive = useRoomMatch({ opponent: room.opponent, sendSync: room.sendSync });
  useEffect(() => {
    matchSyncRef.current = matchLive.handleMatchSync;
  }, [matchLive.handleMatchSync]);

  const pairing = usePairing({
    roomCode,
    onMatched: (code) => {
      if (code === roomCode.toUpperCase()) return;
      matchLive.handleResetMatch();
      room.leave();
      navigate(`/room/${code}`, { replace: true, state: { fromQueue: true } });
    },
    onSkipRateLimited: () => {
      setSkipNotice("Too many skips — wait a minute.");
      setTimeout(() => setSkipNotice(null), 4000);
    },
  });

  const handleSkip = () => {
    matchLive.handleResetMatch();
    room.leave();
    pairing.skipMatch();
  };

  const handleSolveComplete = useSolveRecorder({ session, match: matchLive });

  const handlePenaltyChange = (id: SolveId, penalty: Penalty) => {
    session.updatePenalty(id, penalty);
  };

  const handleSync = useCallback((msg: SyncMessage) => room.sendSync(msg), [room]);

  const handleLeave = () => {
    pairing.disconnect();
    room.leave();
    media.stopAll();
    navigate("/");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const connLabel =
    room.connectionState === "reconnecting"
      ? "Reconnecting…"
      : room.connectionState === "connecting"
        ? "Connecting"
        : room.connectionState === "connected"
          ? "Connected"
          : "Waiting";

  const winsNeeded = Math.ceil(matchLive.matchN / 2);

  return (
    <div className="h-[100dvh] flex flex-col bg-[#090b0f] overflow-hidden">
      {matchLive.showCelebration && matchLive.matchWinner && (
        <CelebrationOverlay
          winner={matchLive.matchWinner}
          myWins={matchLive.myWins}
          oppWins={matchLive.oppWins}
          matchN={matchLive.matchN}
          roundResults={matchLive.roundResults}
          onPlayAgain={matchLive.resetCelebrationOnPlayAgain}
          onLeave={handleLeave}
        />
      )}

      {pairing.findingNext && (
        <div className="flex-shrink-0 bg-blue-950/50 border-b border-blue-500/20 px-4 py-2 text-blue-200/90 text-xs text-center">
          Finding next cuber…
        </div>
      )}

      {skipNotice && (
        <div className="flex-shrink-0 bg-amber-900/30 border-b border-amber-500/20 px-4 py-1.5 text-amber-300/80 text-xs text-center">
          {skipNotice}
        </div>
      )}

      <RoomHeader
        roomCode={roomCode}
        copied={copied}
        onCopyLink={copyLink}
        connectionState={room.connectionState}
        connLabel={connLabel}
        onReconnect={
          room.connectionState === "disconnected" || room.connectionState === "reconnecting"
            ? room.reconnect
            : undefined
        }
        syncEnabled={syncEnabled}
        onToggleSync={() => setSyncEnabled((v) => !v)}
        cameraOn={media.cameraOn}
        micOn={media.micOn}
        onToggleCamera={media.toggleCamera}
        onToggleMic={media.toggleMic}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings((s) => !s)}
        onSkip={fromQueue ? handleSkip : undefined}
        skipDisabled={pairing.findingNext}
        onLeave={handleLeave}
      />

      {showSettings && (
        <RoomSettingsSheet
          inspectionEnabled={inspectionEnabled}
          soundEnabled={soundEnabled}
          vibrationEnabled={vibrationEnabled}
          syncEnabled={syncEnabled}
          onInspectionChange={setInspectionEnabled}
          onSoundChange={setSoundEnabled}
          onVibrationChange={setVibrationEnabled}
          onSyncChange={setSyncEnabled}
        />
      )}

      {session.corrupted && (
        <div className="flex-shrink-0 bg-amber-900/30 border-b border-amber-500/20 px-4 py-1.5 text-amber-300/80 text-xs">
          Solve data could not be loaded — starting fresh.
        </div>
      )}

      <main className="flex-1 flex overflow-hidden min-h-0">
        <div
          className={`flex-col flex-1 min-w-0 overflow-hidden ${mobileTab === "timer" ? "flex" : "hidden"} md:flex`}
        >
          <div className="md:hidden flex-shrink-0 grid grid-cols-2 gap-1.5 p-2 pb-0">
            <VideoPanel stream={media.localStream} muted label="You" connected cameraOn={media.cameraOn} mirror />
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

        <div
          className={`flex-col flex-1 min-w-0 border-white/[0.07] overflow-hidden ${mobileTab === "timer" ? "hidden" : "flex"} md:flex md:border-l`}
        >
          <div
            className={`flex-shrink-0 p-2 sm:p-3 space-y-2 ${mobileTab === "history" ? "hidden md:block" : ""}`}
          >
            <div className="hidden md:grid grid-cols-2 gap-2">
              <VideoPanel stream={media.localStream} muted label="You" connected cameraOn={media.cameraOn} mirror />
              <VideoPanel stream={room.remoteStream} label="Opponent" connected={room.opponent.connected} cameraOn />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <OpponentStatus
                opponent={room.opponent}
                myFinished={matchLive.myFinished}
                myTime={matchLive.myLastTime}
              />
              <SessionStats solves={session.solves} />
            </div>

            <MatchPanel
              matchN={matchLive.matchN}
              myWins={matchLive.myWins}
              oppWins={matchLive.oppWins}
              winsNeeded={winsNeeded}
              roundResults={matchLive.roundResults}
              matchWinner={matchLive.matchWinner}
              opponentConnected={room.opponent.connected}
              myPendingRound={matchLive.myPendingRound}
              oppPendingRound={matchLive.oppPendingRound}
              onSetMatchN={matchLive.handleSetMatchN}
              onReset={matchLive.handleResetMatch}
            />
          </div>

          <div
            className={`flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 pt-0 ${mobileTab === "match" ? "hidden md:block" : ""}`}
          >
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

      {mobileTab === "timer" && (
        <MatchScoreStrip
          matchN={matchLive.matchN}
          myWins={matchLive.myWins}
          oppWins={matchLive.oppWins}
          matchWinner={matchLive.matchWinner}
          hasProgress={matchLive.hasMatchProgress}
          onReset={matchLive.handleResetMatch}
        />
      )}

      <RoomMobileNav mobileTab={mobileTab} onTabChange={setMobileTab} />
    </div>
  );
}