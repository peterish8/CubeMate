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
      aria-current={active ? "page" : undefined}
      className={`motion-press relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
        active ? "text-blue-400" : "text-white/30 hover:text-white/55"
      }`}
    >
      <span
        className={`absolute top-0 h-0.5 w-10 rounded-full bg-[var(--cm-accent)] transition-all duration-300 ${
          active ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
        }`}
      />
      <div className={`w-5 h-5 transition-transform duration-200 ${active ? "-translate-y-0.5" : ""}`}>
        {icon}
      </div>
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
