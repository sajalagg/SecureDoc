import { FileText, Upload } from "lucide-react";
import { formatFileSize } from "../lib/format";
import { getFileExtension } from "../lib/upload";

export default function UploadDropzone({ file, error, onFileChange, onClear }) {
  const handleDrop = (event) => {
    event.preventDefault();
    const dropped = event.dataTransfer?.files?.[0];
    if (dropped) onFileChange(dropped);
  };

  return (
    <div>
      <input
        id="upload-file-input"
        type="file"
        accept=".txt,.docx,.pdf"
        className="sr-only"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) onFileChange(selected);
          event.target.value = "";
        }}
      />

      {!file ? (
        <label
          htmlFor="upload-file-input"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-white/[0.02] px-6 py-12 text-center transition-colors hover:border-primary/40 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-primary">
            <Upload size={22} aria-hidden="true" />
          </span>
          <span className="text-sm font-medium text-text-primary">
            Choose a file or drop it here
          </span>
          <span className="font-mono text-xs text-text-secondary">TXT · DOCX · PDF</span>
        </label>
      ) : (
        <div className="rounded-2xl border border-border bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-primary">
              <FileText size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">{file.name}</p>
              <p className="mt-0.5 font-mono text-xs text-text-secondary">
                {getFileExtension(file.name).toUpperCase() || "UNKNOWN"} · {formatFileSize(file.size)}
              </p>
            </div>
            <label htmlFor="upload-file-input" className="btn btn-secondary">
              Change file
            </label>
            <button type="button" onClick={onClear} className="btn btn-secondary">
              Remove
            </button>
          </div>
          {error ? (
            <p className="mt-3 text-sm text-rose-400" role="alert">
              {error}
            </p>
          ) : (
            <p className="mt-3 text-xs text-emerald-400">Valid file — ready to protect.</p>
          )}
        </div>
      )}

      <p className="mt-3 text-xs leading-5 text-text-secondary">
        PDF protection requires extractable text. Scanned or image-only PDFs may not be supported.
      </p>
    </div>
  );
}