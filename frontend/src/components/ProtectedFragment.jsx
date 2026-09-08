// Visual treatment for one protected fragment inside document content.
// kind "redacted" (USER view): the value is hidden behind a typed mask.
// kind "encrypted" (ADMIN view): a SecureDoc placeholder marks encrypted data.
export default function ProtectedFragment({ kind, label }) {
  const classes =
    kind === "encrypted"
      ? "rounded border border-blue-500/30 bg-blue-500/10 px-1 font-mono text-[13px] text-blue-300"
      : "rounded border border-rose-500/40 bg-rose-500/10 px-1 font-mono text-[13px] text-rose-300";
  return <span className={classes}>{label}</span>;
}