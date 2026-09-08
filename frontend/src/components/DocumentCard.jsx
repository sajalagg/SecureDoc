import { Link } from "react-router-dom";
import { ChevronRight, KeyRound } from "lucide-react";
import { formatDate, pluralize } from "../lib/format";
import StatusBadge from "./StatusBadge";
import DocumentTypeBadge from "./DocumentTypeBadge";

export default function DocumentCard({ document, showPreview = false }) {
  const preview = document.maskedPreview
    ? document.maskedPreview.split("\n").join("  ·  ")
    : "";
  const version = document.metadata?.version ?? 1;

  return (
    <Link
      to={`/documents/${document.document_id}`}
      className="card group block overflow-hidden transition-colors hover:border-primary/40"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[15px] font-semibold text-text-primary">
              {document.name}
            </h3>
            <DocumentTypeBadge type={document.fileType} />
            <span className="badge border-border bg-white/5 font-mono text-text-secondary">
              V{version}
            </span>
          </div>
          <p className="mt-1 truncate font-mono text-xs text-text-secondary">
            {document.sourceFilename}
          </p>
          {showPreview && preview ? (
            <p className="mt-1.5 truncate font-mono text-xs text-text-secondary">
              {preview}
            </p>
          ) : null}
          {document.note ? <p className="mt-1 text-xs text-rose-400">{document.note}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <StatusBadge status={document.status} />
          <ChevronRight
            size={16}
            className="text-text-secondary transition-colors group-hover:text-primary"
            aria-hidden="true"
          />
        </div>
      </div>

      <dl className="grid grid-cols-2 divide-x divide-border border-t border-border bg-white/[0.02] sm:grid-cols-4">
        <div className="px-4 py-3 sm:px-5">
          <dt className="field-label">Owner</dt>
          <dd className="mt-0.5 truncate text-sm font-medium text-zinc-200">{document.owner}</dd>
        </div>
        <div className="px-4 py-3 sm:px-5">
          <dt className="field-label">Created</dt>
          <dd className="mt-0.5 text-sm font-medium text-zinc-200">
            {formatDate(document.createdAt)}
          </dd>
        </div>
        <div className="px-4 py-3 sm:px-5">
          <dt className="field-label">Version</dt>
          <dd className="mt-0.5 font-mono text-sm text-zinc-200">v{version}</dd>
        </div>
        <div className="px-4 py-3 sm:px-5">
          <dt className="field-label">Sensitive fields</dt>
          <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-zinc-200">
            <KeyRound size={14} className="text-text-secondary" aria-hidden="true" />
            {pluralize(document.sensitiveFieldCount, "field")}
          </dd>
        </div>
      </dl>
    </Link>
  );
}