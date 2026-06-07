import { BrowserRouter } from "react-router-dom";
import { ConvexShell } from "./ConvexShell";
import { AppRoutes } from "./routes";

export function App() {
  return (
    <ConvexShell>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ConvexShell>
  );
}