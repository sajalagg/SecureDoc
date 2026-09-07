import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar, { Brand } from "../components/Sidebar";
import { useAuth } from "../context/useAuth";

export default function AppLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const [prevPathname, setPrevPathname] = useState(location.pathname);

  // Close the mobile drawer whenever the route changes, including via the
  // browser back/forward buttons.
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setNavOpen(false);
  }

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (event) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  return (
    <div className="min-h-screen bg-background lg:flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-on-primary"
      >
        Skip to content
      </a>

      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Open navigation"
          className="btn btn-secondary px-2.5"
        >
          <Menu size={18} aria-hidden="true" />
        </button>
        <Brand />
        <span className="w-10" aria-hidden="true" />
      </div>

      {navOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-background transition-transform duration-200 lg:static lg:z-auto lg:shrink-0 lg:translate-x-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar user={user} onNavigate={() => setNavOpen(false)} />
      </div>

      <div className="min-w-0 flex-1">
        <main
          id="main-content"
          className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}