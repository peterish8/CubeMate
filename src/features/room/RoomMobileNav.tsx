import { HistoryTabIcon, MatchTabIcon, TimerTabIcon } from "../../shared/ui/icons";

export type MobileTab = "timer" | "match" | "history";

function MobileTabBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[44px] min-w-[44px] touch-manipulation transition-colors ${
        active ? "text-blue-400" : "text-white/30 hover:text-white/55"
      }`}
    >
      <div className="w-5 h-5">{icon}</div>
      <span className="text-[9px] font-semibold tracking-wide uppercase">{label}</span>
    </button>
  );
}

export function RoomMobileNav({
  mobileTab,
  onTabChange,
}: {
  mobileTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}) {
  return (
    <nav className="md:hidden flex-shrink-0 border-t border-white/[0.08] bg-[#090b0f]/95 backdrop-blur-xl flex pb-safe">
      <MobileTabBtn
        icon={<TimerTabIcon />}
        label="Timer"
        active={mobileTab === "timer"}
        onClick={() => onTabChange("timer")}
      />
      <MobileTabBtn
        icon={<MatchTabIcon />}
        label="Match"
        active={mobileTab === "match"}
        onClick={() => onTabChange("match")}
      />
      <MobileTabBtn
        icon={<HistoryTabIcon />}
        label="History"
        active={mobileTab === "history"}
        onClick={() => onTabChange("history")}
      />
    </nav>
  );
}