import { FileText } from "lucide-react";

const TYPE_TONES = {
  TXT: "border-border bg-white/5 text-text-secondary",
  DOCX: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  PDF: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

export default function DocumentTypeBadge({ type, className = "" }) {
  const tone = TYPE_TONES[type] ?? "border-border bg-white/5 text-text-secondary";
  return (
    <span className={`badge ${tone} ${className}`}>
      <FileText size={13} aria-hidden="true" />
      <span className="font-mono">{type}</span>
    </span>
  );
}