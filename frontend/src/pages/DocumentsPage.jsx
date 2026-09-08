import { Link } from "react-router-dom";
import { Plus, ScanSearch } from "lucide-react";
import PageHeader from "../components/PageHeader";
import DocumentCard from "../components/DocumentCard";
import EmptyState from "../components/EmptyState";
import { useDocuments } from "../hooks/useDocuments";
import { pluralize } from "../lib/format";

export default function DocumentsPage() {
  const { documents, loading } = useDocuments();

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
            <Link to="/documents/new" className="btn btn-primary">
              <Plus size={16} aria-hidden="true" />
              New document
            </Link>
          </>
        }
      />

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-text-secondary">Loading documents…</p>
        ) : documents.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">{pluralize(documents.length, "document")}</p>
            {documents.map((document) => (
              <DocumentCard key={document.document_id} document={document} showPreview />
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
    </>
  );
}