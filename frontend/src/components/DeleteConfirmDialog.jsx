import { useEffect } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import ErrorAlert from "./ErrorAlert";

export default function DeleteConfirmDialog({
  open,
  documentName,
  pending,
  error,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="relative w-full max-w-md rounded-2xl border border-rose-500/30 bg-surface p-6 shadow-xl"
      >
        <div className="flex items-center gap-2 text-rose-400">
          <Trash2 size={18} aria-hidden="true" />
          <p className="tech-label text-rose-400">Admin-only action</p>
        </div>
        <h2 id="delete-dialog-title" className="mt-2 text-lg font-semibold text-text-primary">
          Delete document
        </h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Are you sure you want to permanently delete{" "}
          <span className="font-medium text-zinc-200">"{documentName}"</span>?
        </p>
        <p className="mt-2 text-xs leading-5 text-text-secondary">
          The document, encrypted fragments, and wrapped keys will be permanently removed from storage.
          The action will be recorded in the audit trail.
        </p>

        {error ? (
          <div className="mt-4">
            <ErrorAlert>{error}</ErrorAlert>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            autoFocus
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="btn bg-rose-600 text-white hover:bg-rose-500 transition border border-rose-500/50"
          >
            {pending ? (
              <>
                <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 size={15} aria-hidden="true" />
                Delete document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
