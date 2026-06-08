import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { type ReactNode } from "react";
import { isConvexConfigured } from "../persistence";
import { CloudSyncRegistrar } from "./CloudSyncRegistrar";

const convexClient = isConvexConfigured()
  ? new ConvexReactClient(import.meta.env.VITE_CONVEX_URL!)
  : null;

export function ConvexShell({ children }: { children: ReactNode }) {
  if (!convexClient) {
    return <>{children}</>;
  }

  return (
    <ConvexAuthProvider client={convexClient}>
      <CloudSyncRegistrar />
      {children}
    </ConvexAuthProvider>
  );
}