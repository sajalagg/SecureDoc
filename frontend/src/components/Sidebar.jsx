import { Link, NavLink } from "react-router-dom";
import { FileText, LayoutDashboard, Shield, ShieldCheck, X } from "lucide-react";
import UserProfile from "./UserProfile";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/security", label: "Security", icon: Shield },
];

export function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="SecureDoc home">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white">
        <ShieldCheck size={18} aria-hidden="true" />
      </span>
      <span className="text-base font-semibold tracking-tight text-slate-900">SecureDoc</span>
    </Link>
  );
}

export default function Sidebar({ user, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
        <Brand />
        <button
          type="button"
          onClick={onNavigate}
          aria-label="Close navigation"
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="Primary" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`
            }
          >
            <Icon size={17} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-200 px-3 py-4">
        <UserProfile user={user} />
      </div>
    </div>
  );
}
