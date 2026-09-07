import { KeyRound } from "lucide-react";
import { formatDate, pluralize } from "../lib/format";
import StatusBadge from "./StatusBadge";
import DocumentTypeBadge from "./DocumentTypeBadge";

export default function DocumentCard({ document, showPreview = false }) {
  const preview = document.maskedPreview
    ? document.maskedPreview.split("\n").join("  ·  ")
    : "";

  return (
    <article className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-900">{document.name}</h3>
            <DocumentTypeBadge type={document.fileType} />
          </div>
          <p className="mt-1 truncate font-mono text-xs text-slate-500">{document.sourceFilename}</p>
          {showPreview && preview ? (
            <p className="mt-1.5 truncate font-mono text-xs text-slate-500">{preview}</p>
          ) : null}
          {document.note ? <p className="mt-1 text-xs text-rose-600">{document.note}</p> : null}
        </div>
        <div className="shrink-0">
          <StatusBadge status={document.status} />
        </div>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/60">
        <div className="px-4 py-3 sm:px-5">
          <dt className="field-label">Owner</dt>
          <dd className="mt-0.5 truncate text-sm font-medium text-slate-700">{document.owner}</dd>
        </div>
        <div className="px-4 py-3 sm:px-5">
          <dt className="field-label">Created</dt>
          <dd className="mt-0.5 text-sm font-medium text-slate-700">
            {formatDate(document.createdAt)}
          </dd>
        </div>
        <div className="px-4 py-3 sm:px-5">
          <dt className="field-label">Sensitive fields</dt>
          <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <KeyRound size={14} className="text-slate-400" aria-hidden="true" />
            {pluralize(document.sensitiveFieldCount, "field")}
          </dd>
        </div>
      </dl>
    </article>
  );
}
