import { FileText } from "lucide-react";

const TYPE_TONES = {
  TXT: "border-slate-200 bg-slate-100 text-slate-600",
  DOCX: "border-blue-200 bg-blue-50 text-blue-700",
  PDF: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function DocumentTypeBadge({ type, className = "" }) {
  const tone = TYPE_TONES[type] ?? "border-slate-200 bg-slate-100 text-slate-600";
  return (
    <span className={`badge ${tone} ${className}`}>
      <FileText size={13} aria-hidden="true" />
      <span className="font-mono">{type}</span>
    </span>
  );
}
