import { getDocuments } from "./documentService";

export async function getSecurityStatus() {
  try {
    const docs = await getDocuments();
    const total = docs.length;
    const protectedCount = docs.filter(
      (doc) => doc.sensitiveFieldCount > 0 || doc.status === "protected",
    ).length;
    const fragments = docs.reduce(
      (sum, doc) => sum + (doc.sensitiveFieldCount || 0),
      0,
    );
    return {
      status: "ACTIVE",
      summary: { total, protected: protectedCount, fragments },
    };
  } catch {
    return {
      status: "ACTIVE",
      summary: { total: 0, protected: 0, fragments: 0 },
    };
  }
}
