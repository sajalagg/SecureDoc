import { TriangleAlert } from "lucide-react";

export default function ErrorAlert({ children }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300"
    >
      <TriangleAlert size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}