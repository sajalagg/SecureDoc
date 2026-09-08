import { Check, X } from "lucide-react";
import { formatDateTime } from "../lib/format";

const RESULT_TONES = {
  SUCCESS: {
    classes: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    icon: Check,
  },
  DENIED: {
    classes: "border-rose-500/40 bg-rose-500/10 text-rose-400",
    icon: X,
  },
  FAILURE: {
    classes: "border-rose-500/40 bg-rose-500/10 text-rose-400",
    icon: X,
  },
};

export default function AuditTable({ records, usersById }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <caption className="sr-only">Audit records for this document.</caption>
        <thead>
          <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-text-secondary">
            <th scope="col" className="py-2 pr-4">
              Timestamp
            </th>
            <th scope="col" className="py-2 pr-4">
              User
            </th>
            <th scope="col" className="py-2 pr-4">
              Document
            </th>
            <th scope="col" className="py-2 pr-4">
              Action
            </th>
            <th scope="col" className="py-2">
              Result
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => {
            const tone = RESULT_TONES[record.result] ?? {
              classes: "border-border bg-white/5 text-text-secondary",
              icon: null,
            };
            const ResultIcon = tone.icon;
            const username = usersById[record.user_id];
            return (
              <tr
                key={`${record.timestamp}-${record.action}-${index}`}
                className="border-b border-border/60 last:border-b-0"
              >
                <td className="py-3 pr-4 font-mono text-xs text-zinc-200">
                  {formatDateTime(record.timestamp)}
                </td>
                <td className="py-3 pr-4 text-sm text-zinc-200">
                  {username ?? `user #${record.user_id ?? "—"}`}
                </td>
                <td className="max-w-40 py-3 pr-4">
                  <span
                    className="block truncate font-mono text-xs text-text-secondary"
                    title={record.document_id}
                  >
                    {record.document_id}
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-text-secondary">
                  {record.action}
                </td>
                <td className="py-3">
                  <span className={`badge ${tone.classes}`}>
                    {ResultIcon ? <ResultIcon size={13} aria-hidden="true" /> : null}
                    {record.result}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}