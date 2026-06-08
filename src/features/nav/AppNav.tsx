import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useConvexAuth } from "@convex-dev/auth/react";
import { useAuthActions } from "@convex-dev/auth/react";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/solves", label: "Solves" },
  { to: "/practice", label: "Practice" },
];

function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function AppNav() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (isLoading || !isAuthenticated) return null;

  const handlePlay = () => {
    setMenuOpen(false);
    navigate(`/room/${makeRoomCode()}`);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="app-nav">
      <div className="app-nav-inner">
        <Link to="/dashboard" className="app-nav-logo" onClick={() => setMenuOpen(false)}>
          CubeMate
        </Link>

        <nav className="app-nav-links" aria-label="Main navigation">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={isActive(to) ? "app-nav-link app-nav-link-active" : "app-nav-link"}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="app-nav-actions">
          <button type="button" onClick={handlePlay} className="app-nav-play">
            Play
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="app-nav-signout hidden sm:block"
          >
            Sign out
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="app-nav-burger sm:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? "✕" : "≡"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="app-nav-mobile-drawer sm:hidden">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={isActive(to) ? "app-nav-drawer-link app-nav-drawer-link-active" : "app-nav-drawer-link"}
            >
              {label}
            </Link>
          ))}
          <div className="app-nav-drawer-divider" />
          <button
            type="button"
            onClick={() => { setMenuOpen(false); void signOut(); }}
            className="app-nav-drawer-link text-white/35 w-full text-left"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
