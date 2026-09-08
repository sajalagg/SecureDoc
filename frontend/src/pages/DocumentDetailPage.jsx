import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, KeyRound, ScrollText, ShieldCheck, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import DocumentTypeBadge from "../components/DocumentTypeBadge";
import SensitiveTypeBadge from "../components/SensitiveTypeBadge";
import ProtectedFragment from "../components/ProtectedFragment";
import EmptyState from "../components/EmptyState";
import DecryptConfirmDialog from "../components/DecryptConfirmDialog";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import { useDocument } from "../hooks/useDocument";
import { useAuth } from "../context/useAuth";
import { decryptDocument, deleteDocument } from "../services/documentService";
import { formatDate, pluralize } from "../lib/format";
import { splitProtectedText } from "../lib/fragmentText";

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { document, loading, notFound } = useDocument(id);
  const { role } = useAuth();
  const location = useLocation();
  const created = location.state?.created === true;
  const [decryptOpen, setDecryptOpen] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [plaintext, setPlaintext] = useState(null);

  if (loading) {
    return <p className="text-sm text-text-secondary">Loading document…</p>;
  }

  if (notFound || !document) {
    return (
      <>
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-accent"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to documents
        </Link>
        <div className="mt-6">
          <EmptyState
            title="Document not found"
            description="No document exists with this identifier, or it is not available to your session."
            action={
              <Link to="/documents" className="btn btn-secondary">
                Back to documents
              </Link>
            }
          />
        </div>
      </>
    );
  }

  const isAdmin = role === "ADMIN";
  const content = isAdmin ? document.protected_text : document.masked_text;
  const segments = splitProtectedText(content, isAdmin ? "protected" : "masked");
  const fragments = document.metadata?.encrypted_spans ?? [];
  const version = document.metadata?.version ?? 1;
  const envelope = document.metadata?.key_envelope ?? null;

  const handleConfirmDecrypt = async () => {
    if (decrypting) return;
    setDecryptError(null);
    setDecrypting(true);
    try {
      const result = await decryptDocument(document.document_id);
      setPlaintext(result.text);
      setDecryptOpen(false);
    } catch (err) {
      setDecryptError(err.message);
    } finally {
      setDecrypting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleting) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteDocument(document.document_id);
      setDeleteOpen(false);
      navigate("/documents", {
        replace: true,
        state: { deleted: true, documentName: document.name },
      });
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Link
        to="/documents"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-accent"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to documents
      </Link>

      <PageHeader
        eyebrow="Document detail"
        title={document.name}
        description={`${document.sourceFilename} · v${version}`}
        actions={<StatusBadge status={document.status} />}
      />

      {created ? (
        <div
          role="status"
          className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400"
        >
          <ShieldCheck size={15} aria-hidden="true" />
          Document created and protected.
        </div>
      ) : null}

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-3">
        <div className="col-span-2 min-w-0 sm:col-span-1">
          <dt className="tech-label">Document id</dt>
          <dd className="mt-1 truncate font-mono text-xs text-zinc-200" title={document.document_id}>
            {document.document_id}
          </dd>
        </div>
        <div>
          <dt className="tech-label">File type</dt>
          <dd className="mt-1">
            <DocumentTypeBadge type={document.fileType} />
          </dd>
        </div>
        <div>
          <dt className="tech-label">Version</dt>
          <dd className="mt-1 font-mono text-sm text-zinc-200">v{version}</dd>
        </div>
        <div>
          <dt className="tech-label">Owner</dt>
          <dd className="mt-1 truncate text-sm text-zinc-200">{document.owner}</dd>
        </div>
        <div>
          <dt className="tech-label">Created</dt>
          <dd className="mt-1 text-sm text-zinc-200">{formatDate(document.createdAt)}</dd>
        </div>
        <div>
          <dt className="tech-label">Sensitive fields</dt>
          <dd className="mt-1 flex items-center gap-1.5 text-sm text-zinc-200">
            <KeyRound size={14} className="text-text-secondary" aria-hidden="true" />
            {pluralize(document.sensitiveFieldCount, "field")}
          </dd>
        </div>
      </dl>

      <section className="card mt-6 p-5 sm:p-6" aria-labelledby="document-content-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="document-content-heading" className="text-lg font-semibold text-text-primary">
            Document content
          </h2>
          <span className="badge border-border bg-white/5 font-mono text-text-secondary">
            {isAdmin ? "PROTECTED VIEW" : "MASKED VIEW"}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          {isAdmin
            ? "Protected representation — placeholders mark encrypted fragments. Content is never reconstructed in this view."
            : "Masked view for your role — sensitive values are redacted and never shown."}
        </p>
        <div className="mt-4 whitespace-pre-wrap rounded-xl border border-border bg-background p-4 font-mono text-[13px] leading-6 text-zinc-200 sm:p-5">
          {segments.length > 0 ? (
            segments.map((segment, index) =>
              segment.type === "text" ? (
                <span key={index}>{segment.text}</span>
              ) : (
                <ProtectedFragment
                  key={index}
                  kind={segment.type === "redacted" ? "redacted" : "encrypted"}
                  label={segment.text}
                />
              ),
            )
          ) : (
            <span>{content}</span>
          )}
        </div>
      </section>

      {isAdmin ? (
        <section className="card mt-6 p-5 sm:p-6" aria-labelledby="fragments-heading">
          <div className="flex flex-wrap items-center gap-2">
            <KeyRound size={18} className="text-primary" aria-hidden="true" />
            <h2 id="fragments-heading" className="text-lg font-semibold text-text-primary">
              Protected fragments
            </h2>
            <span className="badge border-border bg-white/5 font-mono text-text-secondary">
              {fragments.length}
            </span>
          </div>
          {fragments.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {fragments.map((fragment) => (
                <li
                  key={fragment.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-white/[0.02] px-4 py-3"
                >
                  <SensitiveTypeBadge type={fragment.type} />
                  <span
                    className="min-w-0 truncate font-mono text-xs text-blue-300"
                    title={fragment.placeholder}
                  >
                    {fragment.placeholder}
                  </span>
                  <span className="ml-auto font-mono text-xs text-text-secondary">
                    chars {fragment.original_start}–{fragment.original_end}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-text-secondary">
              No protected fragments in this document.
            </p>
          )}
          <p className="mt-4 border-t border-border pt-3 text-xs leading-5 text-text-secondary">
            {envelope
              ? `Key envelope: ${envelope.algorithm} · version ${envelope.key_version}. `
              : ""}
            Cipher material and encryption keys are never exposed in this interface.
          </p>
        </section>
      ) : null}

      {isAdmin && plaintext ? (
        <section
          className="card mt-6 border-emerald-500/30 p-5 sm:p-6"
          aria-labelledby="decrypted-content-heading"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="decrypted-content-heading" className="text-lg font-semibold text-text-primary">
              Decrypted content
            </h2>
            <span className="badge border-emerald-500/40 bg-emerald-500/10 font-mono text-emerald-400">
              DECRYPTED IN MEMORY
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Shown in this view only — never persisted to storage and never sent to the URL.
          </p>
          <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-border bg-background p-4 font-mono text-[13px] leading-6 text-zinc-200">
            {plaintext}
          </pre>
        </section>
      ) : null}

      {isAdmin ? (
        <section className="card mt-6 p-5 sm:p-6" aria-labelledby="admin-actions-heading">
          <h2 id="admin-actions-heading" className="text-lg font-semibold text-text-primary">
            Admin actions
          </h2>
          <p className="mt-1 text-sm leading-6 text-text-secondary">
            Admin-only operations. Access is recorded in the audit trail.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setDecryptError(null);
                setDecryptOpen(true);
              }}
              className="btn btn-secondary"
            >
              <KeyRound size={15} aria-hidden="true" />
              Decrypt document
            </button>
            <Link to={`/documents/${document.document_id}/audit`} className="btn btn-secondary">
              <ScrollText size={15} aria-hidden="true" />
              View audit trail
            </Link>
            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setDeleteOpen(true);
              }}
              className="btn btn-danger"
            >
              <Trash2 size={15} aria-hidden="true" />
              Delete document
            </button>
          </div>
        </section>
      ) : null}

      <DecryptConfirmDialog
        open={decryptOpen}
        documentName={document.name}
        pending={decrypting}
        error={decryptError}
        onConfirm={handleConfirmDecrypt}
        onCancel={() => {
          setDecryptOpen(false);
          setDecryptError(null);
        }}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        documentName={document.name}
        pending={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteError(null);
        }}
      />
    </>
  );
}