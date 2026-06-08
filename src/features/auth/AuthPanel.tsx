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
        <span className="text-[#d7fff0]">Signed in — solves sync to cloud</span>
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

  const submitGoogle = async () => {
    setError("");
    setBusy(true);
    try {
      await signIn("google");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const submitPassword = async () => {
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

  if (!expanded) {
    return (
      <div className="w-full space-y-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void submitGoogle()}
          className="w-full flex items-center justify-center gap-2.5 btn-secondary text-sm disabled:opacity-50"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full text-left text-sm text-white/45 hover:text-white/70 transition-colors"
        >
          Or sign in with email →
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => void submitGoogle()}
        className="w-full flex items-center justify-center gap-2.5 btn-secondary text-sm disabled:opacity-50"
      >
        <GoogleIcon />
        Continue with Google
      </button>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-white/[0.08]" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/25">or</span>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </div>
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
        onClick={() => void submitPassword()}
        className="w-full btn-secondary text-sm disabled:opacity-50"
      >
        {busy ? "..." : mode === "signUp" ? "Create account" : "Sign in"}
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
