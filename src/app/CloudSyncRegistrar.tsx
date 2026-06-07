import { useEffect, useRef } from "react";
import { useConvexAuth } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { CubeSession, Penalty, Solve, SolveId } from "../domain/types";
import { localStorageRepository } from "../persistence/adapters/localStorageRepository";
import {
  getConvexSessionId,
  rememberConvexSession,
  runGuestMergeIfNeeded,
  setCloudSyncHooks,
  flushOutbox,
} from "../persistence/sync/cloudSync";

/** Registers Convex mutations for the hybrid repository outbox. */
export function CloudSyncRegistrar() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const insertSolve = useMutation(api.solves.insert);
  const createSession = useMutation(api.sessions.create);
  const bulkImport = useMutation(api.merge.bulkImport);
  const updatePenaltyMut = useMutation(api.solves.updatePenalty);

  const solveIdToConvexRef = useRef<Map<string, Id<"solves">>>(new Map());

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      setCloudSyncHooks(null);
      return;
    }

    setCloudSyncHooks({
      isAuthenticated: () => true,

      async ensureConvexSession(session: CubeSession) {
        const existing = getConvexSessionId(session.id);
        if (existing) return existing;

        const id = (await createSession({
          clientSessionId: session.id,
          label: session.label,
          startedAt: session.startedAt,
        })) as string;
        rememberConvexSession(session.id, id);
        return id;
      },

      async insertSolve(convexSessionId, solve) {
        const convexId = await insertSolve({
          sessionId: convexSessionId as Id<"sessions">,
          clientId: solve.id,
          event: solve.event,
          scramble: solve.scramble,
          rawTimeMs: solve.rawTimeMs,
          penalty: solve.penalty,
          finalTimeMs: solve.finalTimeMs,
          inspectionMs: solve.inspectionMs,
          startedAt: solve.startedAt,
          endedAt: solve.endedAt,
          dateISO: solve.dateISO,
          comment: solve.comment,
        });
        solveIdToConvexRef.current.set(solve.id, convexId as Id<"solves">);
      },

      async updatePenalty(solveId: SolveId, penalty: Penalty) {
        let convexId = solveIdToConvexRef.current.get(solveId);
        if (!convexId) {
          await flushOutbox();
          convexId = solveIdToConvexRef.current.get(solveId);
        }
        if (!convexId) return;
        await updatePenaltyMut({ solveId: convexId, penalty });
      },

      async softDeleteSolve(_solveId: SolveId) {
        // Soft delete by client id requires lookup; skip until dashboard needs it
      },

      async bulkImportGuestData(sessions: CubeSession[], solves: Solve[]) {
        await bulkImport({
          sessions: sessions.map((s) => ({
            clientSessionId: s.id,
            label: s.label,
            startedAt: s.startedAt,
          })),
          solves: solves
            .filter((s) => s.sessionId)
            .map((s) => ({
              clientId: s.id,
              clientSessionId: s.sessionId!,
              event: s.event,
              scramble: s.scramble,
              rawTimeMs: s.rawTimeMs,
              penalty: s.penalty,
              finalTimeMs: s.finalTimeMs,
              inspectionMs: s.inspectionMs,
              startedAt: s.startedAt,
              endedAt: s.endedAt,
              dateISO: s.dateISO,
              comment: s.comment,
              updatedAt: s.endedAt,
            })),
        });
      },
    });

    const snapshot = localStorageRepository.loadInitialState();
    void runGuestMergeIfNeeded(snapshot.sessions, snapshot.allSolves).then(() =>
      flushOutbox()
    );

    return () => setCloudSyncHooks(null);
  }, [
    isAuthenticated,
    isLoading,
    insertSolve,
    createSession,
    bulkImport,
    updatePenaltyMut,
  ]);

  return null;
}