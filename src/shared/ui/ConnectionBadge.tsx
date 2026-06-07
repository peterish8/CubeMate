import type { ConnectionState } from "../../features/connection/useRoomConnection";

export function ConnectionBadge({
  state,
  label,
  onReconnect,
}: {
  state: ConnectionState;
  label: string;
  onReconnect?: () => void;
}) {
  const dot =
    state === "connected"
      ? "bg-green-400"
      : state === "reconnecting"
        ? "bg-amber-400 animate-ping"
        : state === "connecting"
          ? "bg-amber-400 animate-pulse"
          : "bg-red-400";
  const text =
    state === "connected"
      ? "text-green-400/70"
      : state === "reconnecting"
        ? "text-amber-400/80"
        : state === "connecting"
          ? "text-amber-400/60"
          : "text-red-400/70";

  return (
    <div className="hidden sm:flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span className={`text-[11px] font-medium ${text}`}>{label}</span>
      {onReconnect && (
        <button
          type="button"
          onClick={onReconnect}
          className="text-[10px] text-blue-400/60 hover:text-blue-400 underline transition-colors ml-0.5"
        >
          Retry
        </button>
      )}
    </div>
  );
}