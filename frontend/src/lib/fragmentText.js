// Splits document text into plain and protected segments so the UI can render
// protected fragments distinctly.
//
// mode "masked":    [REDACTED:TYPE] markers (USER view)
// mode "protected": [SECUREDOC:<fragment-id>] placeholders (ADMIN view)

const MASKED_PATTERN = /\[REDACTED:([A-Z_]+)\]/g;
const PROTECTED_PATTERN = /\[SECUREDOC:([^\]]+)\]/g;

export function splitProtectedText(text, mode) {
  const pattern = mode === "protected" ? PROTECTED_PATTERN : MASKED_PATTERN;
  const segments = [];
  let lastIndex = 0;
  let match;
  pattern.lastIndex = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }
    segments.push({
      type: mode === "protected" ? "encrypted" : "redacted",
      text: match[0],
      value: match[1],
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: "text", text: text.slice(lastIndex) });
  }
  return segments;
}