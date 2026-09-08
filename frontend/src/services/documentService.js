// Real document service integrating with FastAPI backend endpoints:
// GET /documents, GET /documents/{id}, POST /documents/scan,
// POST /documents, POST /documents/upload, POST /documents/{id}/decrypt,
// and GET /documents/{id}/audit.

import { apiRequest } from "./apiClient";
import { validateUploadFile } from "../lib/upload";

// Adds frontend presentation helpers on top of backend API document response shape.
function present(document) {
  if (!document) return null;
  const fragments = document.metadata?.encrypted_spans ?? [];
  const source =
    document.metadata?.source_filename ??
    document.source_filename ??
    "document.txt";
  const extension = source.includes(".")
    ? source.split(".").pop().toUpperCase()
    : "TXT";
  const id = document.document_id;
  const sensitiveTypes = [...new Set(fragments.map((fragment) => fragment.type))];

  return {
    ...document,
    id,
    document_id: id,
    name:
      document.name ||
      source.replace(/\.[^.]+$/, "") ||
      `Document ${id.slice(0, 8)}`,
    sourceFilename: source,
    source_filename: source,
    fileType: extension,
    sensitiveFieldCount: fragments.length,
    sensitiveTypes,
    status: fragments.length > 0 ? "protected" : "clean",
    createdAt: document.createdAt || new Date().toISOString().slice(0, 10),
    owner: document.owner || "Current User",
    maskedPreview: (document.masked_text ?? document.text ?? "")
      .split("\n")
      .filter(Boolean)
      .slice(0, 2)
      .join("\n"),
  };
}

export async function getDocuments() {
  const documents = await apiRequest("/documents");
  return (documents || []).map(present);
}

export async function getDocument(documentId) {
  try {
    const document = await apiRequest(`/documents/${encodeURIComponent(documentId)}`);
    return present(document);
  } catch (error) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

// Preview detection metadata without persisting anything.
// Mirrors POST /documents/scan; sensitive values are never included.
export async function scanText(text) {
  const content = String(text ?? "");
  if (!content.trim()) {
    return { detections: [] };
  }
  return await apiRequest("/documents/scan", {
    method: "POST",
    body: { text: content },
  });
}

// POST /documents: scans and stores a protected document in SQLite.
export async function createDocument({ text, document_id } = {}) {
  const content = String(text ?? "");
  if (!content.trim()) {
    throw new Error("Document text is required.");
  }
  const payload = { text: content };
  if (document_id?.trim()) {
    payload.document_id = document_id.trim();
  }
  const document = await apiRequest("/documents", {
    method: "POST",
    body: payload,
  });
  return present(document);
}

// POST /documents/upload: uploads .txt, .docx, or .pdf with multipart/form-data.
export async function uploadDocument(file, document_id) {
  const validation = validateUploadFile(file);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const formData = new FormData();
  formData.append("file", file);
  if (document_id?.trim()) {
    formData.append("document_id", document_id.trim());
  }

  const document = await apiRequest("/documents/upload", {
    method: "POST",
    body: formData,
  });
  return present(document);
}

// POST /documents/{id}/decrypt: ADMIN-only decrypted plaintext retrieval.
export async function decryptDocument(documentId) {
  return await apiRequest(`/documents/${encodeURIComponent(documentId)}/decrypt`, {
    method: "POST",
  });
}

// DELETE /documents/{id}: ADMIN-only document deletion.
export async function deleteDocument(documentId) {
  return await apiRequest(`/documents/${encodeURIComponent(documentId)}`, {
    method: "DELETE",
  });
}

// GET /documents/{id}/audit: ADMIN-only audit records retrieval.
export async function getAudit(documentId) {
  return await apiRequest(`/documents/${encodeURIComponent(documentId)}/audit`);
}