import { useCallback, useMemo, useState } from "react";
import type { SessionId, Solve } from "../../../domain/types";

export function useSessionSelection(allSolves: Solve[], currentSessionId: SessionId) {
  const [selected, setSelected] = useState<Set<SessionId>>(new Set());
  const [expanded, setExpanded] = useState<Set<SessionId>>(new Set([currentSessionId]));
  const [moreStats, setMoreStats] = useState<Set<SessionId>>(new Set());
  const [confirmClear, setConfirmClear] = useState(false);

  const selectedSolves = useMemo(
    () => allSolves.filter((s) => s.sessionId && selected.has(s.sessionId as SessionId)),
    [allSolves, selected]
  );

  const selectedCount = selected.size;

  const toggleSelect = useCallback((id: SessionId, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleExpand = useCallback((id: SessionId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleMoreStats = useCallback((id: SessionId, e: React.MouseEvent) => {
    e.stopPropagation();
    setMoreStats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const resetAfterClearAll = useCallback(() => {
    setSelected(new Set());
    setExpanded(new Set());
    setMoreStats(new Set());
    setConfirmClear(false);
  }, []);

  const requestClearAll = useCallback((onClear: () => void) => {
    if (confirmClear) {
      onClear();
      resetAfterClearAll();
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  }, [confirmClear, resetAfterClearAll]);

  return {
    selected,
    expanded,
    moreStats,
    confirmClear,
    selectedSolves,
    selectedCount,
    toggleSelect,
    toggleExpand,
    toggleMoreStats,
    clearSelection,
    resetAfterClearAll,
    requestClearAll,
    setSelected,
  };
}