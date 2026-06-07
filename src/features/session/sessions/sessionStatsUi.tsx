import { formatTime } from "../../../domain/timer/timerEngine";

const AO_COLORS: Record<number, string> = {
  5: "text-blue-400/75   bg-blue-500/[0.09]   border-blue-500/20",
  12: "text-purple-400/75 bg-purple-500/[0.09] border-purple-500/20",
  50: "text-indigo-400/75 bg-indigo-500/[0.09] border-indigo-500/20",
  100: "text-violet-400/75 bg-violet-500/[0.09] border-violet-500/20",
};

export function AoChip({ label, value, n }: { label: string; value: number; n: number }) {
  const cls = AO_COLORS[n] ?? "text-white/50 bg-white/[0.06] border-white/[0.10]";
  return (
    <div className={`border rounded-lg px-2 py-1 text-center ${cls}`}>
      <p className="text-[9px] uppercase tracking-wider opacity-60 font-bold">{label}</p>
      <p className="font-mono font-bold text-[11px] tabular-nums leading-tight">{formatTime(value)}</p>
    </div>
  );
}

export function DetailStat({
  label,
  value,
  fmt = false,
}: {
  label: string;
  value: number | null;
  fmt?: boolean;
}) {
  const display = value === null ? "—" : fmt ? formatTime(value) : value.toString();
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
      <p className="text-[9px] uppercase tracking-wider text-white/25 font-bold">{label}</p>
      <p className="font-mono font-bold text-[12px] text-white/70 tabular-nums mt-0.5">{display}</p>
    </div>
  );
}

export function fmtSessionDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Today ${time}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + time;
}