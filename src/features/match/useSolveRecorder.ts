import { useCallback } from "react";
import type { Solve } from "../../domain/types";
import type { UseSessionResult } from "../session/useSession";
import type { useRoomMatch } from "./useRoomMatch";

interface UseSolveRecorderOptions {
  session: Pick<UseSessionResult, "addSolve">;
  match: Pick<ReturnType<typeof useRoomMatch>, "recordSolve">;
}

/**
 * Single seam for "solve completed" — persists to session storage first,
 * then records into match state. Ordering is guaranteed: storage before score.
 */
export function useSolveRecorder({ session, match }: UseSolveRecorderOptions) {
  return useCallback(
    (solve: Solve) => {
      session.addSolve(solve);
      match.recordSolve(solve);
    },
    [session, match]
  );
}
