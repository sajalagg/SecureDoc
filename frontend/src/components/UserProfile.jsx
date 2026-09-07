import { initials } from "../lib/format";

const ROLE_LABELS = { ADMIN: "Administrator", USER: "User" };
const ROLE_BADGES = { ADMIN: "Admin", USER: "User" };

export default function UserProfile({ user }) {
  const username = user?.username ?? "Unknown";
  const roleLabel = ROLE_LABELS[user?.role] ?? "User";
  const roleBadge = ROLE_BADGES[user?.role] ?? "User";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700"
        aria-hidden="true"
      >
        {initials(username)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{username}</p>
        <p className="truncate text-xs text-slate-500">{roleLabel}</p>
      </div>
      <span className="badge shrink-0 border-slate-200 bg-slate-100 text-slate-600">
        {roleBadge}
      </span>
    </div>
  );
}
