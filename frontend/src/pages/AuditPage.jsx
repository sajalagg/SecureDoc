import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ScrollText } from "lucide-react";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import ErrorAlert from "../components/ErrorAlert";
import AuditTable from "../components/AuditTable";
import { getAudit } from "../services/documentService";
import { getUsers } from "../services/userService";

export default function AuditPage() {
  const { id } = useParams();
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    getAudit(id).then(
      (response) => {
        if (!active) return;
        setRecords(response.records);
        setLoading(false);
      },
      (err) => {
        if (!active) return;
        setError(err.message);
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [id]);

  const usersById = Object.fromEntries(getUsers().map((user) => [user.id, user.username]));

  return (
    <>
      <Link
        to={`/documents/${id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-accent"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to document
      </Link>

      <PageHeader
        eyebrow="Admin view"
        title="Audit trail"
        description="Security events recorded for this document. Records contain IDs and outcomes only."
      />

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-text-secondary">Loading audit trail…</p>
        ) : error ? (
          <div className="space-y-4">
            <ErrorAlert>{error}</ErrorAlert>
            <Link to="/documents" className="btn btn-secondary">
              Back to documents
            </Link>
          </div>
        ) : records.length > 0 ? (
          <section className="card p-5 sm:p-6" aria-labelledby="audit-records-heading">
            <div className="flex flex-wrap items-center gap-2">
              <ScrollText size={18} className="text-primary" aria-hidden="true" />
              <h2 id="audit-records-heading" className="text-lg font-semibold text-text-primary">
                Audit records
              </h2>
              <span className="badge border-border bg-white/5 font-mono text-text-secondary">
                {records.length}
              </span>
            </div>
            <div className="mt-4">
              <AuditTable records={records} usersById={usersById} />
            </div>
          </section>
        ) : (
          <EmptyState
            title="No audit records"
            description="No security events have been recorded for this document."
          />
        )}
      </div>
    </>
  );
}