import { Navigate } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { AppNav } from "../nav/AppNav";
import { SessionsPanel } from "../session/sessions/SessionsPanel";
import { useSession } from "../session/useSession";
import { isConvexConfigured } from "../../persistence";

export function SolvesPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const session = useSession();

  if (isLoading) {
    return (
      <div className="page-shell">
        <AppNav />
        <div className="flex items-center justify-center h-64">
          <span className="text-white/35 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (isConvexConfigured() && !isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page-shell">
      <AppNav />
      <div className="section-wrap py-8 sm:py-10 relative z-10">
        <div className="mb-7">
          <p className="section-label">History</p>
          <h1 className="display-title mt-3 text-3xl sm:text-4xl text-white">All sessions</h1>
          <p className="mt-2 text-sm text-white/40">
            {session.allSolves.length} solve{session.allSolves.length !== 1 ? "s" : ""} across {session.sessions.length} session{session.sessions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <SessionsPanel
          sessions={session.sessions}
          allSolves={session.allSolves}
          currentSessionId={session.currentSessionId}
          onDeleteSolve={session.deleteSolve}
          onUpdatePenalty={session.updatePenalty}
          onDeleteSessions={session.deleteSessions}
          onClearAll={session.clearAll}
        />
      </div>
    </div>
  );
}
