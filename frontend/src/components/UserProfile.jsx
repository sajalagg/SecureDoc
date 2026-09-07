import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle, LogOut } from "lucide-react";
import { useAuth } from "../context/useAuth";
import RoleGuard from "./RoleGuard";
import { initials } from "../lib/format";

const ROLE_LABELS = { ADMIN: "Administrator", USER: "User" };

export default function UserProfile({ user }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const username = user?.username ?? "Unknown";
  const roleLabel = ROLE_LABELS[user?.role] ?? "User";

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
          aria-hidden="true"
        >
          {initials(username)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">{username}</p>
          <p className="truncate text-xs text-text-secondary">{roleLabel}</p>
        </div>
        <RoleGuard roles={["ADMIN"]}>
          <span className="badge shrink-0 border-primary/30 bg-primary/10 text-primary">
            ADMIN
          </span>
        </RoleGuard>
        <RoleGuard roles={["USER"]}>
          <span className="badge shrink-0 border-border bg-white/5 text-text-secondary">
            USER
          </span>
        </RoleGuard>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="btn btn-secondary w-full"
      >
        {signingOut ? (
          <>
            <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
            Signing out…
          </>
        ) : (
          <>
            <LogOut size={15} aria-hidden="true" />
            Sign out
          </>
        )}
      </button>
    </div>
  );
}