export default function SensitiveTypeBadge({ type, className = "" }) {
  return (
    <span
      className={`badge shrink-0 border-primary/30 bg-primary/10 font-mono text-primary ${className}`}
    >
      {type}
    </span>
  );
}