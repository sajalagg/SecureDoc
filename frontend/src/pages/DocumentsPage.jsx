import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, Plus, ScanSearch, Upload } from "lucide-react";
import PageHeader from "../components/PageHeader";
import DocumentCard from "../components/DocumentCard";
import EmptyState from "../components/EmptyState";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import { useDocuments } from "../hooks/useDocuments";
import { useAuth } from "../context/useAuth";
import { deleteDocument } from "../services/documentService";
import { pluralize } from "../lib/format";

export default function DocumentsPage() {
  const { documents, loading, reload } = useDocuments();
  const { role } = useAuth();
  const isAdmin = role === "ADMIN";
  const location = useLocation();

  const [notification, setNotification] = useState(
    location.state?.deleted
      ? `Document "${location.state?.documentName || "selected document"}" was permanently deleted.`
      : null
  );

  const [targetDoc, setTargetDoc] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleRequestDelete = (doc) => {
    setTargetDoc(doc);
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetDoc || deleting) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteDocument(targetDoc.document_id);
      setDeleteOpen(false);
      setNotification(`Document "${targetDoc.name}" was permanently deleted.`);
      setTargetDoc(null);
      await reload();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Documents"
        description="Documents in this workspace. Sensitive fields are shown masked."
        actions={
          <>
            <Link to="/documents/scan" className="btn btn-secondary">
              <ScanSearch size={16} aria-hidden="true" />
              Scan text
            </Link>
            <Link to="/documents/upload" className="btn btn-secondary">
              <Upload size={16} aria-hidden="true" />
              Upload document
            </Link>
            <Link to="/documents/new" className="btn btn-primary">
              <Plus size={16} aria-hidden="true" />
              New document
            </Link>
          </>
        }
      />

      {notification ? (
        <div
          role="status"
          className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" aria-hidden="true" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs text-emerald-400 hover:text-emerald-200"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-text-secondary">Loading documents…</p>
        ) : documents.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">{pluralize(documents.length, "document")}</p>
            {documents.map((document) => (
              <DocumentCard
                key={document.document_id}
                document={document}
                showPreview
                onDelete={isAdmin ? handleRequestDelete : undefined}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No documents yet"
            description="Protected documents you create will appear here."
            action={
              <Link to="/documents/new" className="btn btn-primary">
                <Plus size={16} aria-hidden="true" />
                New document
              </Link>
            }
          />
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteOpen}
        documentName={targetDoc?.name ?? ""}
        pending={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteOpen(false);
          setTargetDoc(null);
          setDeleteError(null);
        }}
      />
    </>
  );
}