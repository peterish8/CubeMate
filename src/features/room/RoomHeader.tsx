import type { ConnectionState } from "../connection/useRoomConnection";
import { ConnectionBadge } from "../../shared/ui/ConnectionBadge";
import {
  CameraIcon,
  CameraOffIcon,
  CheckIcon,
  CopyIcon,
  CubeIconSmall,
  MicIcon,
  MicOffIcon,
  SettingsIcon,
  SyncIcon,
} from "../../shared/ui/icons";

export interface RoomHeaderProps {
  roomCode: string;
  copied: boolean;
  onCopyLink: () => void;
  connectionState: ConnectionState;
  connLabel: string;
  onReconnect?: () => void;
  syncEnabled: boolean;
  onToggleSync: () => void;
  cameraOn: boolean;
  micOn: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  showSettings: boolean;
  onToggleSettings: () => void;
  onSkip?: () => void;
  skipDisabled?: boolean;
  onLeave: () => void;
}

export function RoomHeader({
  roomCode,
  copied,
  onCopyLink,
  connectionState,
  connLabel,
  onReconnect,
  syncEnabled,
  onToggleSync,
  cameraOn,
  micOn,
  onToggleCamera,
  onToggleMic,
  showSettings,
  onToggleSettings,
  onSkip,
  skipDisabled,
  onLeave,
}: RoomHeaderProps) {
  return (
    <header className="flex-shrink-0 border-b border-white/[0.07] px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between z-20 bg-[#090b0f]/95 backdrop-blur-xl">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600/20 border border-blue-500/25 flex items-center justify-center">
            <CubeIconSmall className="w-3 h-3 text-blue-400" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight hidden sm:block">
            Cube<span className="text-gradient-blue">Mate</span>
          </span>
        </div>

        <div className="w-px h-4 bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] rounded-lg px-2 sm:px-2.5 py-1">
          <span className="font-mono text-[11px] sm:text-xs text-white/60 tracking-[0.15em] sm:tracking-[0.2em]">
            {roomCode}
          </span>
          <button
            type="button"
            onClick={onCopyLink}
            className="motion-press text-white/30 hover:text-white/70 transition-colors ml-0.5"
            aria-label={copied ? "Room link copied" : "Copy room link"}
            aria-live="polite"
          >
            {copied ? <CheckIcon className="motion-pop w-3 h-3 text-green-400" /> : <CopyIcon className="w-3 h-3" />}
          </button>
        </div>

        <ConnectionBadge state={connectionState} label={connLabel} onReconnect={onReconnect} />
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          onClick={onToggleSync}
          title={syncEnabled ? "Sync ON: scramble/event broadcast to opponent" : "Sync OFF: independent puzzles"}
          className={`motion-press hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium transition-all ${
            syncEnabled
              ? "bg-blue-600/15 border-blue-500/25 text-blue-300"
              : "bg-white/[0.05] border-white/[0.09] text-white/30"
          }`}
        >
          <SyncIcon className="w-3 h-3" />
          <span>Sync</span>
        </button>

        <button
          type="button"
          onClick={onToggleCamera}
          title={cameraOn ? "Camera off" : "Camera on"}
          className={`btn text-xs py-1 px-2 rounded-lg ${cameraOn ? "btn-secondary" : "bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/25"}`}
        >
          <span key={cameraOn ? "on" : "off"} className="motion-pop">
            {cameraOn ? <CameraIcon className="w-3.5 h-3.5" /> : <CameraOffIcon className="w-3.5 h-3.5" />}
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleMic}
          title={micOn ? "Mute" : "Unmute"}
          className={`btn text-xs py-1 px-2 rounded-lg ${micOn ? "btn-secondary" : "bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/25"}`}
        >
          <span key={micOn ? "on" : "off"} className="motion-pop">
            {micOn ? <MicIcon className="w-3.5 h-3.5" /> : <MicOffIcon className="w-3.5 h-3.5" />}
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleSettings}
          title="Settings"
          className={`btn text-xs py-1 px-2 rounded-lg ${showSettings ? "bg-white/15 text-white border border-white/20" : "btn-secondary"}`}
        >
          <SettingsIcon className="w-3.5 h-3.5" />
        </button>

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={skipDisabled}
            title="Skip opponent and find another cuber"
            className="btn btn-secondary text-xs py-1 px-2.5 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        )}

        <button type="button" onClick={onLeave} className="btn btn-danger text-xs py-1 px-2.5 rounded-lg">
          Leave
        </button>
      </div>
    </header>
  );
}
