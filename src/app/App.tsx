import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { ConvexShell } from "./ConvexShell";
import { AppRoutes } from "./routes";

export function App() {
  return (
    <ConvexShell>
      <BrowserRouter>
        <AppRoutes />
        <Analytics />
      </BrowserRouter>
    </ConvexShell>
  );
}