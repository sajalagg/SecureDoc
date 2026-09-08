import { useState } from "react";
import { LoaderCircle, ScanSearch, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import ErrorAlert from "../components/ErrorAlert";
import SensitiveTypeBadge from "../components/SensitiveTypeBadge";
import { scanText } from "../services/documentService";

function buildHighlightedSegments(text, detections) {
  if (!detections || detections.length === 0) {
    return [{ type: "text", text }];
  }
  const segments = [];
  let lastIndex = 0;
  for (const detection of detections) {
    if (detection.start > lastIndex) {
      segments.push({ type: "text", text: text.slice(lastIndex, detection.start) });
    }
    segments.push({
      type: "detection",
      text: text.slice(detection.start, detection.end),
    });
    lastIndex = detection.end;
  }
  if (lastIndex < text.length) {
    segments.push({ type: "text", text: text.slice(lastIndex) });
  }
  return segments;
}

export default function ScanPage() {
  const [text, setText] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleScan = async () => {
    if (scanning || !text.trim()) return;
    setError(null);
    setScanning(true);
    try {
      const response = await scanText(text);
      setResult(response);
    } catch {
      setError("Scan failed. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const handleClear = () => {
    setText("");
    setResult(null);
    setError(null);
  };

  const detections = result?.detections ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Detection preview"
        title="Scan text"
        description="Preview sensitive-field detection metadata without storing anything."
      />

      <div className="mt-6">
        <section className="card p-5 sm:p-6" aria-labelledby="scan-editor-heading">
          <label htmlFor="scan-text" className="field-label block">
            Text to scan
          </label>
          <textarea
            id="scan-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste text to scan, e.g. Server: prod&#10;Password: MySecretPassword123&#10;API Key: ak_live_51M0abc..."
            className="input mt-1.5 min-h-44 resize-y font-mono"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-text-secondary">
              Scanned in real-time by backend pattern detectors (API keys, passwords, emails, tokens). Plaintext is never stored.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleClear}
                disabled={!text && !result}
                className="btn btn-secondary"
              >
                <Trash2 size={15} aria-hidden="true" />
                Clear
              </button>
              <button
                type="button"
                onClick={handleScan}
                disabled={scanning || !text.trim()}
                className="btn btn-primary"
              >
                {scanning ? (
                  <>
                    <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
                    Scanning…
                  </>
                ) : (
                  <>
                    <ScanSearch size={15} aria-hidden="true" />
                    Scan
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-6">
            <ErrorAlert>{error}</ErrorAlert>
          </div>
        ) : null}

        {scanning ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-text-secondary">
            <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
            Scanning text…
          </div>
        ) : result && detections.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No sensitive fields detected"
              description="The text contains no recognized sensitive values."
            />
          </div>
        ) : result ? (
          <>
            <section className="card mt-6 p-5 sm:p-6" aria-labelledby="detection-results-heading">
              <div className="flex flex-wrap items-center gap-2">
                <p className="tech-label">Detection result</p>
                <span className="badge border-border bg-white/5 font-mono text-text-secondary">
                  {detections.length}
                </span>
              </div>
              <ul className="mt-4 space-y-2">
                {detections.map((detection, index) => (
                  <li
                    key={`${detection.type}-${detection.start}-${index}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-white/[0.02] px-4 py-3"
                  >
                    <SensitiveTypeBadge type={detection.type} />
                    <span className="text-sm text-zinc-200">
                      {Math.round(detection.confidence_score * 100)}% confidence
                    </span>
                    <span className="font-mono text-xs text-text-secondary">
                      {detection.rule_name}
                    </span>
                    <span className="ml-auto font-mono text-xs text-text-secondary">
                      chars {detection.start}–{detection.end}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card mt-6 p-5 sm:p-6" aria-labelledby="scan-preview-heading">
              <p className="tech-label">Scan preview</p>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                Highlighted spans mark detected fields. Detected values are never shown
                separately or stored.
              </p>
              <div className="mt-3 whitespace-pre-wrap rounded-xl border border-border bg-background p-4 font-mono text-[13px] leading-6 text-zinc-200">
                {buildHighlightedSegments(text, detections).map((segment, index) =>
                  segment.type === "detection" ? (
                    <span
                      key={index}
                      className="rounded bg-amber-500/15 px-0.5 text-amber-300"
                    >
                      {segment.text}
                    </span>
                  ) : (
                    <span key={index}>{segment.text}</span>
                  ),
                )}
              </div>
            </section>
          </>
        ) : (
          <div className="mt-6">
            <EmptyState
              icon={ScanSearch}
              title="Ready to scan"
              description="Enter demo text above and run a scan to preview detection metadata."
            />
          </div>
        )}
      </div>
    </>
  );
}