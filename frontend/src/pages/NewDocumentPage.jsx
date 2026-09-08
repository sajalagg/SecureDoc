import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ErrorAlert from "../components/ErrorAlert";
import { createDocument } from "../services/documentService";

const DEMO_TEXT = `Database Host: db.internal.net:5432
Database Password: SuperSecretDatabasePass123!
API Key: ak_live_51M0abcdefghijklmnopqrstuvwxyz
Admin Contact: devops@securedoc.internal`;

export default function NewDocumentPage() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pending) return;
    setError(null);
    if (!text.trim()) {
      setError("Enter document text to create a document.");
      return;
    }
    setPending(true);
    try {
      const created = await createDocument({
        text,
        document_id: documentId.trim() || undefined,
      });
      navigate(`/documents/${created.document_id}`, { state: { created: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Create"
        title="New document"
        description="Protect sensitive fields with AES-256-GCM envelope encryption. Non-sensitive text remains readable."
      />

      <div className="mt-6">
        <form onSubmit={handleSubmit} className="card space-y-5 p-5 sm:p-6" noValidate>
          <div>
            <label htmlFor="new-document-text" className="field-label block">
              Document text
            </label>
            <textarea
              id="new-document-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste document content…"
              className="input mt-1.5 min-h-48 resize-y font-mono"
            />
          </div>

          <div>
            <label htmlFor="new-document-id" className="field-label block">
              Document identifier (optional)
            </label>
            <input
              id="new-document-id"
              type="text"
              value={documentId}
              onChange={(event) => setDocumentId(event.target.value)}
              placeholder="e.g. demo-doc-001 — generated when empty"
              className="input mt-1.5 font-mono"
            />
          </div>

          {error ? <ErrorAlert>{error}</ErrorAlert> : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <button
              type="button"
              onClick={() => setText(DEMO_TEXT)}
              className="btn btn-secondary"
            >
              Use demo text
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/documents" className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" disabled={pending} className="btn btn-primary">
                {pending ? (
                  <>
                    <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
                    Creating…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={15} aria-hidden="true" />
                    Protect & create
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}