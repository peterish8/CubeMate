import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useState } from "react";
import { isConvexConfigured } from "../../persistence";

export function AuthPanel() {
  if (!isConvexConfigured()) return null;

  return <AuthPanelInner />;
}

function AuthPanelInner() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (isLoading) return null;

  if (isAuthenticated) {
    return (
      <div className="w-full flex items-center justify-between gap-3 text-sm">
        <span className="text-[#d7fff0]">Signed in - solves sync to cloud</span>
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-white/45 hover:text-white/75 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full text-left text-sm text-white/58 hover:text-white/78 transition-colors"
      >
        Sign in to back up solves and open the cloud dashboard.
      </button>
    );
  }

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      await signIn("password", { email, password, flow: mode });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex gap-3 text-[11px] uppercase tracking-[0.22em] font-semibold text-white/35">
        <button
          type="button"
          onClick={() => setMode("signIn")}
          className={mode === "signIn" ? "text-[#8cd8ff]" : "hover:text-white/58"}
        >
          Sign in
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={() => setMode("signUp")}
          className={mode === "signUp" ? "text-[#8cd8ff]" : "hover:text-white/58"}
        >
          Sign up
        </button>
      </div>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input text-sm"
        autoComplete="email"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="input text-sm"
        autoComplete={mode === "signUp" ? "new-password" : "current-password"}
      />
      {error && <p className="text-sm text-[#ffbba9]">{error}</p>}
      <button
        type="button"
        disabled={busy || !email || !password}
        onClick={() => void submit()}
        className="w-full btn-secondary text-sm disabled:opacity-50"
      >
        {busy ? "..." : mode === "signUp" ? "Create account" : "Sign in"}
      </button>
    </div>
  );
}
