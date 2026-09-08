import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ErrorAlert from "../components/ErrorAlert";
import UploadDropzone from "../components/UploadDropzone";
import { uploadDocument } from "../services/documentService";
import { UPLOAD_LIMITS, validateUploadFile } from "../lib/upload";

export default function UploadDocumentPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [documentId, setDocumentId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const validation = file ? validateUploadFile(file) : null;

  const handleFileChange = (selected) => {
    setFile(selected);
    setError(null);
  };

  const handleUpload = async () => {
    if (uploading) return;
    setError(null);
    const check = validateUploadFile(file);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setUploading(true);
    try {
      const created = await uploadDocument(file, documentId.trim() || undefined);
      navigate(`/documents/${created.document_id}`, { state: { created: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Upload"
        title="Upload document"
        description="SecureDoc extracts text, detects sensitive fields, and protects them. Only the protected representation is stored."
      />

      <div className="mt-6">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleUpload();
          }}
          className="card space-y-5 p-5 sm:p-6"
          noValidate
        >
          <div>
            <span className="field-label block">File</span>
            <div className="mt-1.5">
              <UploadDropzone
                file={file}
                error={validation && !validation.ok ? validation.error : null}
                onFileChange={handleFileChange}
                onClear={() => {
                  setFile(null);
                  setError(null);
                }}
              />
            </div>
          </div>

          <ul className="grid gap-2 sm:grid-cols-3">
            {Object.entries(UPLOAD_LIMITS).map(([extension, limit]) => (
              <li
                key={extension}
                className="flex items-center justify-between rounded-xl border border-border bg-white/[0.02] px-3 py-2"
              >
                <span className="font-mono text-xs text-text-primary">{extension}</span>
                <span className="font-mono text-xs text-text-secondary">
                  {limit.label} max
                </span>
              </li>
            ))}
          </ul>

          <div>
            <label htmlFor="upload-document-id" className="field-label block">
              Document identifier (optional)
            </label>
            <input
              id="upload-document-id"
              type="text"
              value={documentId}
              onChange={(event) => setDocumentId(event.target.value)}
              placeholder="e.g. demo-upload-001 — generated when empty"
              className="input mt-1.5 font-mono"
            />
          </div>

          {error ? <ErrorAlert>{error}</ErrorAlert> : null}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-5">
            <Link to="/documents" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={uploading} className="btn btn-primary">
              {uploading ? (
                <>
                  <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
                  Protecting document…
                </>
              ) : (
                <>
                  <ShieldCheck size={15} aria-hidden="true" />
                  Upload & protect
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}