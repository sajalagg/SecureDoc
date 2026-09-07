import { mockDocuments } from "../data/mockData";
import { delay } from "../lib/async";

// Phase 1: returns mock data. Later replaced by calls to the FastAPI backend
// (GET /documents, GET /documents/{id}).
export async function getDocuments() {
  await delay(200);
  return [...mockDocuments];
}

export async function getDocument(documentId) {
  await delay(120);
  return mockDocuments.find((document) => document.id === documentId) ?? null;
}
