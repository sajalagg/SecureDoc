import {
  Check,
  FileSearch,
  Key,
  KeyRound,
  Lock,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import PageHeader from "../components/PageHeader";

const PROTECTION_FEATURES = [
  {
    icon: Lock,
    title: "Selective field-level encryption",
    detail:
      "Only detected sensitive fragments are encrypted. The rest of the document stays readable.",
  },
  {
    icon: KeyRound,
    title: "AES-256-GCM",
    detail:
      "Every fragment is encrypted with AES-256-GCM authenticated encryption and a fresh nonce.",
  },
  {
    icon: Key,
    title: "Per-document keys",
    detail:
      "Each document receives its own key, wrapped by a separately configured master key.",
  },
  {
    icon: FileSearch,
    title: "Sensitive field detection",
    detail:
      "Transparent rules identify passwords, API keys, payment cards, and email addresses.",
  },
];

const SENSITIVE_TYPES = [
  { label: "Password", mask: "[REDACTED:PASSWORD]" },
  { label: "API key", mask: "[REDACTED:API_KEY]" },
  { label: "Credit card", mask: "[REDACTED:CREDIT_CARD]" },
  { label: "Email", mask: "[REDACTED:EMAIL]" },
];

const ACCESS_ROWS = [
  { capability: "Create documents", user: true, admin: true },
  { capability: "View own documents", user: true, admin: true },
  { capability: "View all documents", user: false, admin: true },
  { capability: "View masked content", user: true, admin: true },
  { capability: "Decrypt protected content", user: false, admin: true },
  { capability: "Delete documents", user: false, admin: true },
  { capability: "View audit trail", user: false, admin: true },
];

const AUDIT_EVENTS = [
  "REGISTER_SUCCESS",
  "LOGIN_SUCCESS",
  "LOGIN_FAILURE",
  "DOCUMENT_CREATED",
  "DOCUMENT_ACCESSED",
  "DOCUMENT_DECRYPTED",
  "DOCUMENT_DELETED",
  "ACCESS_DENIED",
];

function AccessCell({ allowed }) {
  return allowed ? (
    <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400">
      <Check size={15} aria-hidden="true" />
      Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary/60">
      <X size={15} aria-hidden="true" />
      No
    </span>
  );
}

export default function SecurityPage() {
  return (
    <>
      <PageHeader
        eyebrow="Trust model"
        title="Security"
        description="How SecureDoc protects sensitive fragments inside documents."
      />

      <div className="mt-8 space-y-6">
        <section className="card p-5 sm:p-6" aria-labelledby="protection-model-heading">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={18} className="text-primary" aria-hidden="true" />
            <h2 id="protection-model-heading" className="text-lg font-semibold text-text-primary">
              Protection model
            </h2>
          </div>
          <p className="prose-muted mt-1 max-w-2xl">
            SecureDoc never encrypts an entire document. It locates sensitive values, replaces
            them with placeholders, and encrypts only those fragments.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {PROTECTION_FEATURES.map(({ icon: Icon, title, detail }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-xl border border-border bg-white/[0.02] p-4"
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-primary">
                  <Icon size={17} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-text-secondary">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="detection-heading">
          <div className="flex items-center gap-2.5">
            <FileSearch size={18} className="text-primary" aria-hidden="true" />
            <h2 id="detection-heading" className="text-lg font-semibold text-text-primary">
              Detected sensitive fields
            </h2>
          </div>
          <p className="prose-muted mt-1 max-w-2xl">
            Protected values are replaced with typed masks so readers never see the original
            content.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {SENSITIVE_TYPES.map(({ label, mask }) => (
              <li
                key={label}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white/[0.02] px-4 py-3"
              >
                <span className="text-sm font-medium text-zinc-200">{label}</span>
                <code className="rounded-lg bg-background px-2 py-1 font-mono text-xs text-primary">
                  {mask}
                </code>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-border pt-3 text-xs leading-5 text-text-secondary">
            In stored documents, each value is replaced by a placeholder such as
            [SECUREDOC:&lt;fragment-id&gt;] and encrypted separately.
          </p>
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="access-heading">
          <div className="flex items-center gap-2.5">
            <Users size={18} className="text-primary" aria-hidden="true" />
            <h2 id="access-heading" className="text-lg font-semibold text-text-primary">
              Role-based access
            </h2>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <caption className="sr-only">
                Capabilities available to USER and ADMIN roles.
              </caption>
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  <th scope="col" className="py-2 pr-4">
                    Capability
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    User
                  </th>
                  <th scope="col" className="py-2">
                    Admin
                  </th>
                </tr>
              </thead>
              <tbody>
                {ACCESS_ROWS.map(({ capability, user, admin }) => (
                  <tr key={capability} className="border-b border-border/60 last:border-b-0">
                    <td className="py-3 pr-4 text-sm text-zinc-200">{capability}</td>
                    <td className="py-3 pr-4">
                      <AccessCell allowed={user} />
                    </td>
                    <td className="py-3">
                      <AccessCell allowed={admin} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="audit-heading">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={18} className="text-primary" aria-hidden="true" />
            <h2 id="audit-heading" className="text-lg font-semibold text-text-primary">
              Audit logging
            </h2>
          </div>
          <p className="prose-muted mt-1 max-w-2xl">
            Critical lifecycle events are recorded with timestamps, user IDs, document IDs, and
            outcomes only. Document content and secrets are never logged.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {AUDIT_EVENTS.map((event) => (
              <li
                key={event}
                className="badge border-border bg-white/5 font-mono text-text-secondary"
              >
                {event}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}