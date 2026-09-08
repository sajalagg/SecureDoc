import { Clock, ShieldCheck, TriangleAlert } from "lucide-react";

const STATUS_META = {
  protected: {
    label: "Protected",
    icon: ShieldCheck,
    classes: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    classes: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  },
  "needs-attention": {
    label: "Needs Attention",
    icon: TriangleAlert,
    classes: "border-rose-500/40 bg-rose-500/10 text-rose-400",
  },
};

export default function StatusBadge({ status, className = "" }) {
  const meta =
    STATUS_META[status] ?? {
      label: status,
      icon: null,
      classes: "border-border bg-white/5 text-text-secondary",
    };
  const Icon = meta.icon;
  return (
    <span className={`badge ${meta.classes} ${className}`}>
      {Icon ? <Icon size={13} aria-hidden="true" /> : null}
      {meta.label}
    </span>
  );
}