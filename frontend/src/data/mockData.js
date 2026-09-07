// Phase 1 mock data.
//
// These structures intentionally mirror the concepts used by the FastAPI
// backend (users/roles, documents, sensitive-field types, masking) so the
// service layer can later be swapped for real API calls without rewriting the
// UI. Fields such as `status` are frontend-only UI concepts for this phase.
//
// SECURITY: no real secrets are stored here. Sensitive content is represented
// only with typed masks such as [REDACTED:PASSWORD] or placeholders such as
// [SECUREDOC:<fragment-id>].

// Demo accounts for the mock authentication layer. Credentials live in
// src/services/authService.js and are demo-only values.
export const mockUsers = [
  { id: 1, username: "maria.santos", role: "ADMIN" },
  { id: 2, username: "david.oyama", role: "USER" },
  { id: 3, username: "priya.sharma", role: "USER" },
  { id: 4, username: "jonah.weber", role: "USER" },
  { id: 5, username: "alex.chen", role: "USER" },
];

// Default demo identity for the mock data layer; the authenticated user is
// resolved through the session in src/services/authService.js.
export const mockUser = mockUsers[4];

export const mockDocuments = [
  {
    id: "7c2f9a1e-4b6d-4c3a-8e5f-1a2b3c4d5e6f",
    name: "Confidential Operations Report",
    sourceFilename: "confidential-operations-report.docx",
    fileType: "DOCX",
    owner: "maria.santos",
    createdAt: "2026-09-05",
    status: "protected",
    sensitiveFieldCount: 4,
    sensitiveTypes: ["PASSWORD", "API_KEY", "CREDIT_CARD", "EMAIL"],
    maskedPreview:
      "Owner: Operations Team\nContact: [REDACTED:EMAIL]\nDatabase Password: [REDACTED:PASSWORD]\nStripe Key: [REDACTED:API_KEY]\nCard: [REDACTED:CREDIT_CARD]",
  },
  {
    id: "91a4c7d2-8f3e-4b1a-9c6d-2e4f5a6b7c8d",
    name: "Server Configuration",
    sourceFilename: "servers.env",
    fileType: "TXT",
    owner: "david.oyama",
    createdAt: "2026-09-04",
    status: "protected",
    sensitiveFieldCount: 3,
    sensitiveTypes: ["PASSWORD", "API_KEY"],
    maskedPreview:
      "db_password=[REDACTED:PASSWORD]\nclient_api_key=[REDACTED:API_KEY]",
  },
  {
    id: "3e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b",
    name: "Financial Report Q3",
    sourceFilename: "financial-report-q3-2026.pdf",
    fileType: "PDF",
    owner: "priya.sharma",
    createdAt: "2026-08-30",
    status: "protected",
    sensitiveFieldCount: 2,
    sensitiveTypes: ["CREDIT_CARD", "EMAIL"],
    maskedPreview:
      "Expense cards: [REDACTED:CREDIT_CARD]\nReporting contact: [REDACTED:EMAIL]",
  },
  {
    id: "b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e",
    name: "Team Meeting Notes",
    sourceFilename: "team-meeting-notes-2026-09-06.txt",
    fileType: "TXT",
    owner: "david.oyama",
    createdAt: "2026-09-06",
    status: "pending",
    sensitiveFieldCount: 0,
    sensitiveTypes: [],
    maskedPreview: "",
  },
  {
    id: "f0e1d2c3-b4a5-6978-8765-4321fedcba98",
    name: "Vendor Contracts 2026",
    sourceFilename: "vendor-contracts-2026.pdf",
    fileType: "PDF",
    owner: "jonah.weber",
    createdAt: "2026-09-02",
    status: "pending",
    sensitiveFieldCount: 0,
    sensitiveTypes: [],
    maskedPreview: "",
    note: "Awaiting protection run.",
  },
  {
    id: "5a6b7c8d-9e0f-1a2b-3c4d-5e6f7a8b9c0d",
    name: "Client Onboarding Checklist",
    sourceFilename: "client-onboarding-checklist.docx",
    fileType: "DOCX",
    owner: "priya.sharma",
    createdAt: "2026-08-28",
    status: "needs-attention",
    sensitiveFieldCount: 1,
    sensitiveTypes: ["EMAIL"],
    maskedPreview: "Client contact: [REDACTED:EMAIL]",
    note: "One low-confidence value needs review before protection.",
  },
];

export const mockSecurityStatus = {
  protectionActive: true,
  selectiveEncryption: true,
  algorithm: "AES-256-GCM",
  perDocumentKeys: true,
  accessControlled: true,
  detectionTypes: ["PASSWORD", "API_KEY", "CREDIT_CARD", "EMAIL"],
};
