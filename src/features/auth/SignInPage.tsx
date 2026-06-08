import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { AuthPanel } from "./AuthPanel";
import { isConvexConfigured } from "../../persistence";

export function SignInPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  if (!isConvexConfigured()) {
    return <Navigate404 />;
  }

  return (
    <div className="signin-shell">
      <div className="signin-card motion-enter">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
            <CubeGlyph />
          </div>
          <span className="font-[Sora] text-base font-semibold tracking-tight text-white">CubeMate</span>
        </div>

        {/* Heading */}
        <div className="mb-7">
          <h1 className="display-title text-2xl sm:text-3xl text-white">Sign in</h1>
          <p className="mt-2 text-sm text-white/42">
            Back up your solves and sync across all devices.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <span className="text-white/30 text-sm">Loading...</span>
          </div>
        ) : (
          <AuthPanel />
        )}

        <div className="mt-6 pt-5 border-t border-white/[0.07]">
          <Link to="/" className="text-sm text-white/38 hover:text-white/65 transition-colors">
            ← Back to CubeMate
          </Link>
        </div>
      </div>
    </div>
  );
}

function Navigate404() {
  return (
    <div className="signin-shell">
      <div className="signin-card text-center">
        <p className="text-white/40 text-sm">Auth not configured.</p>
        <Link to="/" className="mt-4 block text-[#4db6ff] text-sm">← Home</Link>
      </div>
    </div>
  );
}

function CubeGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 text-[#8cd8ff]" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 2L18 6.5V13.5L10 18L2 13.5V6.5L10 2Z" />
      <path d="M10 2V18M2 6.5L10 11L18 6.5" />
    </svg>
  );
}
