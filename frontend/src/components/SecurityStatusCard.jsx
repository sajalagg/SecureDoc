import { useEffect, useState } from "react";
import { Key, KeyRound, Lock, ShieldCheck, Users } from "lucide-react";
import { getSecurityStatus } from "../services/securityService";
import { pluralize } from "../lib/format";

const FEATURES = [
  {
    icon: Lock,
    title: "Selective encryption",
    detail: "Only sensitive fragments are protected.",
  },
  {
    icon: KeyRound,
    title: "AES-256-GCM",
    detail: "Authenticated symmetric encryption.",
  },
  {
    icon: Key,
    title: "Per-document keys",
    detail: "Keys are wrapped by a master key.",
  },
  {
    icon: Users,
    title: "Access controlled",
    detail: "Role-based USER / ADMIN access.",
  },
];

export default function SecurityStatusCard() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let active = true;
    getSecurityStatus().then((value) => {
      if (active) setStatus(value);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!status) {
    return (
      <section className="card flex items-center justify-center p-8" aria-busy="true">
        <p className="text-sm text-slate-500">Loading security status…</p>
      </section>
    );
  }

  return (
    <section className="card p-5" aria-labelledby="security-status-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <ShieldCheck size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 id="security-status-heading" className="text-sm font-semibold text-slate-900">
              Security status
            </h2>
            <p className="text-sm text-slate-500">Protection active across your workspace</p>
          </div>
        </div>
        <span className="badge border-emerald-200 bg-emerald-50 text-emerald-700">
          <ShieldCheck size={13} aria-hidden="true" />
          Protection active
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, detail }) => (
          <div
            key={title}
            className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-slate-500 shadow-sm">
              <Icon size={16} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">{title}</p>
              <p className="text-xs leading-5 text-slate-500">{detail}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {pluralize(status.summary.protected, "document")} protected of {status.summary.total} ·{" "}
        {pluralize(status.summary.fragments, "fragment")} encrypted
      </p>
    </section>
  );
}
