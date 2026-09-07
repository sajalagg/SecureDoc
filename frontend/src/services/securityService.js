import { mockDocuments, mockSecurityStatus } from "../data/mockData";
import { delay } from "../lib/async";

// Phase 1: returns mock data derived from the mock document set.
export async function getSecurityStatus() {
  await delay(200);
  const total = mockDocuments.length;
  const protectedCount = mockDocuments.filter(
    (document) => document.status === "protected",
  ).length;
  const fragments = mockDocuments.reduce(
    (sum, document) => sum + document.sensitiveFieldCount,
    0,
  );
  return {
    ...mockSecurityStatus,
    summary: { total, protected: protectedCount, fragments },
  };
}
