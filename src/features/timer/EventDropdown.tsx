import { useEffect, useRef, useState } from "react";
import type { CubeEvent } from "../../domain/types";
import { WCA_EVENTS } from "../../domain/types";

interface EventDropdownProps {
  value: CubeEvent;
  onChange: (event: CubeEvent) => void;
}

const GROUPS = [
  { label: "Cubes",   ids: ["333","222","444","555","666","777"] },
  { label: "Variants", ids: ["333oh","333bf","333fm","333mbf","444bf","555bf"] },
  { label: "Puzzles",  ids: ["pyram","skewb","clock","minx","sq1"] },
] as const;

const EVENT_LABEL = Object.fromEntries(WCA_EVENTS.map(({ id, label }) => [id, label]));

export function EventDropdown({ value, onChange }: EventDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold
          border transition-all duration-200 select-none
          ${open
            ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
            : "bg-white/[0.06] border-white/[0.09] text-white/75 hover:bg-white/[0.10] hover:border-white/[0.15] hover:text-white"
          }
        `}
      >
        <span>{EVENT_LABEL[value] ?? value}</span>
        <ChevronIcon
          className={`w-3 h-3 opacity-50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Panel */}
      {open && (
        <div
          className="
            absolute left-0 top-[calc(100%+6px)] z-50
            w-52 rounded-2xl overflow-hidden
            bg-[#10131a]/95 border border-white/[0.09]
            shadow-2xl shadow-black/70
            backdrop-blur-xl
            animate-dropdown
          "
          style={{ animation: "dropdownIn 0.15s ease-out both" }}
        >
          {GROUPS.map((group, gi) => (
            <div key={group.label}>
              {gi > 0 && <div className="h-px bg-white/[0.06] mx-2" />}
              <div className="px-3 pt-2.5 pb-1">
                <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-white/25">
                  {group.label}
                </span>
              </div>
              <div className="px-1.5 pb-1.5 grid grid-cols-3 gap-0.5">
                {(group.ids as readonly string[]).map((id) => {
                  const selected = value === id;
                  return (
                    <button
                      key={id}
                      onClick={() => { onChange(id as CubeEvent); setOpen(false); }}
                      className={`
                        px-1.5 py-1.5 rounded-lg text-[10px] font-semibold text-center
                        transition-all duration-150 leading-tight
                        ${selected
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                          : "text-white/55 hover:bg-white/[0.08] hover:text-white/90"
                        }
                      `}
                    >
                      {EVENT_LABEL[id]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </div>
  );
}

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
  </svg>
);
