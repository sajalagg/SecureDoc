// Phase 1-3 mock data.
//
// These structures intentionally mirror the concepts used by the FastAPI
// backend (users/roles, document response shape, sensitive-field types,
// masking) so the service layer can later be swapped for real API calls
// without rewriting the UI.
//
// Document response shape mirrors the backend:
//   { document_id, protected_text, masked_text, metadata }
// with `text` (role-dependent) selected by the UI. Fields such as `name`,
// `status`, and `owner` are frontend-only presentation data.
//
// SECURITY: no real secrets and no real cryptographic material are stored
// here. Ciphertext/nonce/auth-tag fields in mock metadata use obvious
// sentinel strings and are never rendered. Sensitive content appears only as
// typed masks ([REDACTED:TYPE]) or placeholders ([SECUREDOC:<fragment-id>]).

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

const SENTINEL_CIPHERTEXT = "MOCK-CIPHERTEXT-OMITTED";
const SENTINEL_NONCE = "MOCK-NONCE-OMITTED";
const SENTINEL_AUTH_TAG = "MOCK-AUTH-TAG-OMITTED";

export const mockDocuments = [
  {
    document_id: "7c2f9a1e-4b6d-4c3a-8e5f-1a2b3c4d5e6f",
    name: "Confidential Operations Report",
    source_filename: "confidential-operations-report.docx",
    owner: "maria.santos",
    createdAt: "2026-09-05",
    status: "protected",
    protected_text: `Owner: Operations Team
Contact: [SECUREDOC:9d1f2e3a-4b5c-4d6e-8f70-1234567890ab]
Database Password: [SECUREDOC:5c7e8f90-1a2b-3c4d-5e6f-7890abcdef12]
Stripe Key: [SECUREDOC:a1b2c3d4-e5f6-4789-9abc-def012345678]
Card: [SECUREDOC:ff12aabb-ccdd-4eef-9a98-776655443322]
Status: Active`,
    masked_text: `Owner: Operations Team
Contact: [REDACTED:EMAIL]
Database Password: [REDACTED:PASSWORD]
Stripe Key: [REDACTED:API_KEY]
Card: [REDACTED:CREDIT_CARD]
Status: Active`,
    metadata: {
      document_id: "7c2f9a1e-4b6d-4c3a-8e5f-1a2b3c4d5e6f",
      version: 1,
      encrypted_spans: [
        {
          id: "9d1f2e3a-4b5c-4d6e-8f70-1234567890ab",
          placeholder: "[SECUREDOC:9d1f2e3a-4b5c-4d6e-8f70-1234567890ab]",
          type: "EMAIL",
          original_start: 24,
          original_end: 46,
          ciphertext: SENTINEL_CIPHERTEXT,
          nonce: SENTINEL_NONCE,
          auth_tag: SENTINEL_AUTH_TAG,
        },
        {
          id: "5c7e8f90-1a2b-3c4d-5e6f-7890abcdef12",
          placeholder: "[SECUREDOC:5c7e8f90-1a2b-3c4d-5e6f-7890abcdef12]",
          type: "PASSWORD",
          original_start: 68,
          original_end: 90,
          ciphertext: SENTINEL_CIPHERTEXT,
          nonce: SENTINEL_NONCE,
          auth_tag: SENTINEL_AUTH_TAG,
        },
        {
          id: "a1b2c3d4-e5f6-4789-9abc-def012345678",
          placeholder: "[SECUREDOC:a1b2c3d4-e5f6-4789-9abc-def012345678]",
          type: "API_KEY",
          original_start: 104,
          original_end: 130,
          ciphertext: SENTINEL_CIPHERTEXT,
          nonce: SENTINEL_NONCE,
          auth_tag: SENTINEL_AUTH_TAG,
        },
        {
          id: "ff12aabb-ccdd-4eef-9a98-776655443322",
          placeholder: "[SECUREDOC:ff12aabb-ccdd-4eef-9a98-776655443322]",
          type: "CREDIT_CARD",
          original_start: 138,
          original_end: 158,
          ciphertext: SENTINEL_CIPHERTEXT,
          nonce: SENTINEL_NONCE,
          auth_tag: SENTINEL_AUTH_TAG,
        },
      ],
      key_envelope: {
        algorithm: "AES-256-GCM",
        key_version: 1,
        ciphertext: "MOCK-KEY-ENVELOPE-OMITTED",
        nonce: "MOCK-KEY-NONCE-OMITTED",
        auth_tag: "MOCK-KEY-AUTH-TAG-OMITTED",
      },
      source_filename: "confidential-operations-report.docx",
    },
  },
  {
    document_id: "91a4c7d2-8f3e-4b1a-9c6d-2e4f5a6b7c8d",
    name: "Server Configuration",
    source_filename: "servers.env",
    owner: "david.oyama",
    createdAt: "2026-09-04",
    status: "protected",
    protected_text: `server=api.internal
db_password=[SECUREDOC:12ab34cd-56ef-4789-9abc-def012345678]
client_api_key=[SECUREDOC:ab12cd34-ef56-4789-9abc-def012345678]`,
    masked_text: `server=api.internal
db_password=[REDACTED:PASSWORD]
client_api_key=[REDACTED:API_KEY]`,
    metadata: {
      document_id: "91a4c7d2-8f3e-4b1a-9c6d-2e4f5a6b7c8d",
      version: 1,
      encrypted_spans: [
        {
          id: "12ab34cd-56ef-4789-9abc-def012345678",
          placeholder: "[SECUREDOC:12ab34cd-56ef-4789-9abc-def012345678]",
          type: "PASSWORD",
          original_start: 20,
          original_end: 42,
          ciphertext: SENTINEL_CIPHERTEXT,
          nonce: SENTINEL_NONCE,
          auth_tag: SENTINEL_AUTH_TAG,
        },
        {
          id: "ab12cd34-ef56-4789-9abc-def012345678",
          placeholder: "[SECUREDOC:ab12cd34-ef56-4789-9abc-def012345678]",
          type: "API_KEY",
          original_start: 58,
          original_end: 80,
          ciphertext: SENTINEL_CIPHERTEXT,
          nonce: SENTINEL_NONCE,
          auth_tag: SENTINEL_AUTH_TAG,
        },
      ],
      key_envelope: {
        algorithm: "AES-256-GCM",
        key_version: 1,
        ciphertext: "MOCK-KEY-ENVELOPE-OMITTED",
        nonce: "MOCK-KEY-NONCE-OMITTED",
        auth_tag: "MOCK-KEY-AUTH-TAG-OMITTED",
      },
      source_filename: "servers.env",
    },
  },
  {
    document_id: "3e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b",
    name: "Financial Report Q3",
    source_filename: "financial-report-q3-2026.pdf",
    owner: "priya.sharma",
    createdAt: "2026-08-30",
    status: "protected",
    protected_text: `Expense cards: [SECUREDOC:12345678-90ab-cdef-1234-567890abcdef]
Reporting contact: [SECUREDOC:abcdef12-3456-4789-9abc-def012345678]
Prepared by Finance`,
    masked_text: `Expense cards: [REDACTED:CREDIT_CARD]
Reporting contact: [REDACTED:EMAIL]
Prepared by Finance`,
    metadata: {
      document_id: "3e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b",
      version: 1,
      encrypted_spans: [
        {
          id: "12345678-90ab-cdef-1234-567890abcdef",
          placeholder: "[SECUREDOC:12345678-90ab-cdef-1234-567890abcdef]",
          type: "CREDIT_CARD",
          original_start: 18,
          original_end: 40,
          ciphertext: SENTINEL_CIPHERTEXT,
          nonce: SENTINEL_NONCE,
          auth_tag: SENTINEL_AUTH_TAG,
        },
        {
          id: "abcdef12-3456-4789-9abc-def012345678",
          placeholder: "[SECUREDOC:abcdef12-3456-4789-9abc-def012345678]",
          type: "EMAIL",
          original_start: 62,
          original_end: 86,
          ciphertext: SENTINEL_CIPHERTEXT,
          nonce: SENTINEL_NONCE,
          auth_tag: SENTINEL_AUTH_TAG,
        },
      ],
      key_envelope: {
        algorithm: "AES-256-GCM",
        key_version: 1,
        ciphertext: "MOCK-KEY-ENVELOPE-OMITTED",
        nonce: "MOCK-KEY-NONCE-OMITTED",
        auth_tag: "MOCK-KEY-AUTH-TAG-OMITTED",
      },
      source_filename: "financial-report-q3-2026.pdf",
    },
  },
  {
    document_id: "b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e",
    name: "Team Meeting Notes",
    source_filename: "team-meeting-notes-2026-09-06.txt",
    owner: "david.oyama",
    createdAt: "2026-09-06",
    status: "pending",
    protected_text: `Agenda: Q3 planning
Decision: release moves to Friday
Action: Priya to draft vendor summary`,
    masked_text: `Agenda: Q3 planning
Decision: release moves to Friday
Action: Priya to draft vendor summary`,
    metadata: {
      document_id: "b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e",
      version: 1,
      encrypted_spans: [],
      key_envelope: {
        algorithm: "AES-256-GCM",
        key_version: 1,
        ciphertext: "MOCK-KEY-ENVELOPE-OMITTED",
        nonce: "MOCK-KEY-NONCE-OMITTED",
        auth_tag: "MOCK-KEY-AUTH-TAG-OMITTED",
      },
      source_filename: "team-meeting-notes-2026-09-06.txt",
    },
  },
  {
    document_id: "f0e1d2c3-b4a5-6978-8765-4321fedcba98",
    name: "Vendor Contracts 2026",
    source_filename: "vendor-contracts-2026.pdf",
    owner: "jonah.weber",
    createdAt: "2026-09-02",
    status: "pending",
    note: "Awaiting protection run.",
    protected_text: `Vendor contracts for FY 2026 are pending signature review.`,
    masked_text: `Vendor contracts for FY 2026 are pending signature review.`,
    metadata: {
      document_id: "f0e1d2c3-b4a5-6978-8765-4321fedcba98",
      version: 1,
      encrypted_spans: [],
      key_envelope: {
        algorithm: "AES-256-GCM",
        key_version: 1,
        ciphertext: "MOCK-KEY-ENVELOPE-OMITTED",
        nonce: "MOCK-KEY-NONCE-OMITTED",
        auth_tag: "MOCK-KEY-AUTH-TAG-OMITTED",
      },
      source_filename: "vendor-contracts-2026.pdf",
    },
  },
  {
    document_id: "5a6b7c8d-9e0f-1a2b-3c4d-5e6f7a8b9c0d",
    name: "Client Onboarding Checklist",
    source_filename: "client-onboarding-checklist.docx",
    owner: "priya.sharma",
    createdAt: "2026-08-28",
    status: "needs-attention",
    note: "One low-confidence value needs review before protection.",
    protected_text: `Checklist item 1: collect client contact [SECUREDOC:0a1b2c3d-4e5f-4a6b-7c8d-9e0f1a2b3c4d]
Remaining items pending verification.`,
    masked_text: `Checklist item 1: collect client contact [REDACTED:EMAIL]
Remaining items pending verification.`,
    metadata: {
      document_id: "5a6b7c8d-9e0f-1a2b-3c4d-5e6f7a8b9c0d",
      version: 1,
      encrypted_spans: [
        {
          id: "0a1b2c3d-4e5f-4a6b-7c8d-9e0f1a2b3c4d",
          placeholder: "[SECUREDOC:0a1b2c3d-4e5f-4a6b-7c8d-9e0f1a2b3c4d]",
          type: "EMAIL",
          original_start: 34,
          original_end: 58,
          ciphertext: SENTINEL_CIPHERTEXT,
          nonce: SENTINEL_NONCE,
          auth_tag: SENTINEL_AUTH_TAG,
        },
      ],
      key_envelope: {
        algorithm: "AES-256-GCM",
        key_version: 1,
        ciphertext: "MOCK-KEY-ENVELOPE-OMITTED",
        nonce: "MOCK-KEY-NONCE-OMITTED",
        auth_tag: "MOCK-KEY-AUTH-TAG-OMITTED",
      },
      source_filename: "client-onboarding-checklist.docx",
    },
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

// Safe mock audit records mirroring the backend AuditRecord shape
// { timestamp, user_id, document_id, action, result }. Events and outcomes
// only — no content, no secrets. New records are appended in memory by
// documentService during the session.
export const mockAuditRecords = [
  {
    timestamp: "2026-09-05T09:12:00Z",
    user_id: 1,
    document_id: "7c2f9a1e-4b6d-4c3a-8e5f-1a2b3c4d5e6f",
    action: "DOCUMENT_CREATED",
    result: "SUCCESS",
  },
  {
    timestamp: "2026-09-05T09:14:00Z",
    user_id: 1,
    document_id: "7c2f9a1e-4b6d-4c3a-8e5f-1a2b3c4d5e6f",
    action: "DOCUMENT_ACCESSED",
    result: "SUCCESS",
  },
  {
    timestamp: "2026-09-06T14:03:00Z",
    user_id: 3,
    document_id: "7c2f9a1e-4b6d-4c3a-8e5f-1a2b3c4d5e6f",
    action: "ACCESS_DENIED",
    result: "DENIED",
  },
  {
    timestamp: "2026-09-07T10:45:00Z",
    user_id: 5,
    document_id: "7c2f9a1e-4b6d-4c3a-8e5f-1a2b3c4d5e6f",
    action: "DOCUMENT_ACCESSED",
    result: "SUCCESS",
  },
  {
    timestamp: "2026-09-04T11:20:00Z",
    user_id: 2,
    document_id: "91a4c7d2-8f3e-4b1a-9c6d-2e4f5a6b7c8d",
    action: "DOCUMENT_CREATED",
    result: "SUCCESS",
  },
  {
    timestamp: "2026-09-04T11:25:00Z",
    user_id: 2,
    document_id: "91a4c7d2-8f3e-4b1a-9c6d-2e4f5a6b7c8d",
    action: "DOCUMENT_ACCESSED",
    result: "SUCCESS",
  },
];