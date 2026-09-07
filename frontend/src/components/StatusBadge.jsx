import { Clock, ShieldCheck, TriangleAlert } from "lucide-react";

const STATUS_META = {
  protected: {
    label: "Protected",
    icon: ShieldCheck,
    classes: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    classes: "border-amber-200 bg-amber-50 text-amber-700",
  },
  "needs-attention": {
    label: "Needs Attention",
    icon: TriangleAlert,
    classes: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

export default function StatusBadge({ status, className = "" }) {
  const meta =
    STATUS_META[status] ?? {
      label: status,
      icon: null,
      classes: "border-slate-200 bg-slate-50 text-slate-600",
    };
  const Icon = meta.icon;
  return (
    <span className={`badge ${meta.classes} ${className}`}>
      {Icon ? <Icon size={13} aria-hidden="true" /> : null}
      {meta.label}
    </span>
  );
}
