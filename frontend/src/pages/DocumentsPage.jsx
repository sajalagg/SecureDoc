import { useState } from "react";
import { Info, Plus } from "lucide-react";
import PageHeader from "../components/PageHeader";
import DocumentCard from "../components/DocumentCard";
import EmptyState from "../components/EmptyState";
import { useDocuments } from "../hooks/useDocuments";
import { pluralize } from "../lib/format";

export default function DocumentsPage() {
  const { documents, loading } = useDocuments();
  const [showNotice, setShowNotice] = useState(false);

  const handleNewDocument = () => {
    setShowNotice(true);
    window.setTimeout(() => setShowNotice(false), 3200);
  };

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Documents"
        description="Documents in this workspace. Sensitive fields are shown masked."
        actions={
          <button type="button" onClick={handleNewDocument} className="btn btn-primary">
            <Plus size={16} aria-hidden="true" />
            New Document
          </button>
        }
      />

      {showNotice ? (
        <div
          role="status"
          className="mt-5 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-300"
        >
          <Info size={15} aria-hidden="true" />
          Document creation is not part of this preview yet.
        </div>
      ) : null}

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-text-secondary">Loading documents…</p>
        ) : documents.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">{pluralize(documents.length, "document")}</p>
            {documents.map((document) => (
              <DocumentCard key={document.id} document={document} showPreview />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No documents yet"
            description="Protected documents you create will appear here."
            action={
              <button type="button" onClick={handleNewDocument} className="btn btn-primary">
                <Plus size={16} aria-hidden="true" />
                New Document
              </button>
            }
          />
        )}
      </div>
    </>
  );
}