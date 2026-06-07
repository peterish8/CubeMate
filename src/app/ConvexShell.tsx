import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { useMemo, type ReactNode } from "react";
import { isConvexConfigured } from "../persistence";
import { CloudSyncRegistrar } from "./CloudSyncRegistrar";

export function ConvexShell({ children }: { children: ReactNode }) {
  if (!isConvexConfigured()) {
    return <>{children}</>;
  }

  const url = import.meta.env.VITE_CONVEX_URL!;
  const client = useMemo(() => new ConvexReactClient(url), [url]);

  return (
    <ConvexAuthProvider client={client}>
      <CloudSyncRegistrar />
      {children}
    </ConvexAuthProvider>
  );
}