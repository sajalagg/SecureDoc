import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Info, Plus } from "lucide-react";
import PageHeader from "../components/PageHeader";
import SecurityStatusCard from "../components/SecurityStatusCard";
import DocumentCard from "../components/DocumentCard";
import EmptyState from "../components/EmptyState";
import { useDocuments } from "../hooks/useDocuments";
import { useAuth } from "../context/useAuth";

export default function DashboardPage() {
  const { documents, loading } = useDocuments();
  const { user } = useAuth();
  const [showNotice, setShowNotice] = useState(false);
  const recent = documents.slice(0, 4);

  const handleNewDocument = () => {
    setShowNotice(true);
    window.setTimeout(() => setShowNotice(false), 3200);
  };

  return (
    <>
      <PageHeader
        eyebrow={`Welcome back, ${user?.username ?? "there"}`}
        title="SecureDoc"
        description="Protect sensitive fields without locking the entire document."
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
        <SecurityStatusCard />
      </div>

      <section className="mt-8" aria-labelledby="recent-documents-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="recent-documents-heading" className="text-lg font-semibold text-text-primary">
            Recent documents
          </h2>
          <Link
            to="/documents"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-accent"
          >
            View all
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-sm text-text-secondary">Loading documents…</p>
          ) : recent.length > 0 ? (
            recent.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))
          ) : (
            <EmptyState
              title="No documents yet"
              description="Documents you protect will appear here."
              action={
                <button type="button" onClick={handleNewDocument} className="btn btn-primary">
                  <Plus size={16} aria-hidden="true" />
                  New Document
                </button>
              }
            />
          )}
        </div>
      </section>
    </>
  );
}