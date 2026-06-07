import type { Solve } from "../../../domain/types";
import { exportCSV, exportJSON } from "../../../domain/export/exportSolves";

export function SelectionBar({
  selectedCount,
  selectedSolves,
  onClearSelection,
  onDeleteSelected,
}: {
  selectedCount: number;
  selectedSolves: Solve[];
  onClearSelection: () => void;
  onDeleteSelected: () => void;
}) {
  if (selectedCount === 0) return null;

  return (
    <div
      className="sticky bottom-3 mx-1 rounded-2xl border border-white/[0.10] bg-[#0d1018]/90 backdrop-blur-xl px-4 py-3 flex items-center gap-3 shadow-2xl shadow-black/60"
      style={{ animation: "selectionBarIn 0.2s ease-out both" }}
    >
      <span className="text-white/50 text-xs font-medium flex-1">
        {selectedCount} session{selectedCount !== 1 ? "s" : ""}
        {selectedSolves.length > 0 && (
          <span className="text-white/25">
            {" "}
            · {selectedSolves.length} solve{selectedSolves.length !== 1 ? "s" : ""}
          </span>
        )}
      </span>
      <button
        type="button"
        disabled={selectedSolves.length === 0}
        onClick={() => exportCSV(selectedSolves)}
        className="btn-secondary text-[11px] py-1 px-2.5 disabled:opacity-30"
      >
        CSV
      </button>
      <button
        type="button"
        disabled={selectedSolves.length === 0}
        onClick={() => exportJSON(selectedSolves)}
        className="btn-secondary text-[11px] py-1 px-2.5 disabled:opacity-30"
      >
        JSON
      </button>
      <button
        type="button"
        onClick={onClearSelection}
        className="text-white/30 hover:text-white/70 text-[11px] transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onDeleteSelected}
        className="text-[11px] font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1 rounded-lg transition-all"
      >
        Delete
      </button>
    </div>
  );
}