import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import ErrorAlert from "./ErrorAlert";

export default function DecryptConfirmDialog({
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
        aria-labelledby="decrypt-dialog-title"
        className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg"
      >
        <p className="tech-label">Admin-only action</p>
        <h2 id="decrypt-dialog-title" className="mt-2 text-lg font-semibold text-text-primary">
          Decrypt document
        </h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          This will reveal the original values of{" "}
          <span className="font-medium text-zinc-200">"{documentName}"</span> in this view.
          Decrypted content stays in memory, and the access is recorded in the audit trail.
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
          <button type="button" onClick={onConfirm} disabled={pending} className="btn btn-danger">
            {pending ? (
              <>
                <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
                Decrypting…
              </>
            ) : (
              "Decrypt document"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}