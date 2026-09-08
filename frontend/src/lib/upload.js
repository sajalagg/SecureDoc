// Client-side upload validation matching the backend document adapters:
// TXT up to 1 MB (1,000,000 bytes), DOCX/PDF up to 10 MB (10,000,000 bytes).

export const UPLOAD_LIMITS = {
  TXT: { maxBytes: 1_000_000, label: "1 MB" },
  DOCX: { maxBytes: 10_000_000, label: "10 MB" },
  PDF: { maxBytes: 10_000_000, label: "10 MB" },
};

const SUPPORTED_EXTENSIONS = ["txt", "docx", "pdf"];

export function getFileExtension(filename) {
  const name = String(filename ?? "");
  if (!name.includes(".")) return "";
  return name.split(".").pop().toLowerCase();
}

export function validateUploadFile(file) {
  if (!file) {
    return { ok: false, error: "Select a file to upload." };
  }
  const extension = getFileExtension(file.name);
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    return {
      ok: false,
      error: "Unsupported file type. SecureDoc accepts TXT, DOCX, and PDF.",
    };
  }
  const limit = UPLOAD_LIMITS[extension.toUpperCase()];
  if (file.size > limit.maxBytes) {
    return {
      ok: false,
      error:
        extension === "txt"
          ? "TXT files must be 1 MB or smaller."
          : "DOCX and PDF files must be 10 MB or smaller.",
    };
  }
  return { ok: true, extension: extension.toUpperCase() };
}