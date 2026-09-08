import { mockAuditRecords, mockDocuments } from "../data/mockData";
import { getSession } from "./authService";
import { delay } from "../lib/async";
import { createId } from "../lib/id";
import { validateUploadFile } from "../lib/upload";

// Mock document service.
//
// Phase 3: everything here is mock behavior that mirrors the FastAPI backend
// contract (GET /documents, GET /documents/{id}, POST /documents/scan,
// POST /documents). No network requests, no real encryption: detection and
// "protection" are simulated with demo-only marker values and safe
// placeholders. Later phases replace the internals with real API calls.
//
// Created documents live in a session-scoped store until the page reloads.

const mockStore = [...mockDocuments];

// Session-scoped mock audit log. Events mirror backend AuditAction names and
// record IDs/outcomes only — never content or secrets.
const mockAuditLog = [...mockAuditRecords];

function recordAudit(documentId, userId, action, result) {
  mockAuditLog.push({
    timestamp: new Date().toISOString(),
    user_id: userId ?? null,
    document_id: documentId,
    action,
    result,
  });
}

// Demo-only detection rules. Only clearly synthetic values are recognized so
// nothing here can be mistaken for a real credential.
const MOCK_DETECTION_PATTERNS = [
  {
    regex: /\bDEMO_ONLY_PASSWORD\b/g,
    type: "PASSWORD",
    confidence_score: 0.99,
    rule_name: "explicit_password_field",
  },
  {
    regex: /\bDEMO_ONLY_API_KEY\b/g,
    type: "API_KEY",
    confidence_score: 0.95,
    rule_name: "explicit_api_key_field",
  },
  {
    regex: /\bDEMO_ONLY_CARD\b/g,
    type: "CREDIT_CARD",
    confidence_score: 0.98,
    rule_name: "luhn_valid_card",
  },
  {
    regex: /\bDEMO_ONLY_TOKEN\b/g,
    type: "API_KEY",
    confidence_score: 0.92,
    rule_name: "bearer_token",
  },
  {
    regex: /demo@example\.invalid\b/g,
    type: "EMAIL",
    confidence_score: 0.85,
    rule_name: "email_syntax",
  },
  {
    regex: /password:\s*(\S+)/gi,
    type: "PASSWORD",
    confidence_score: 0.99,
    rule_name: "explicit_password_field",
    valueGroup: 1,
  },
  {
    regex: /(?:api[_-]?key|token):\s*(\S+)/gi,
    type: "API_KEY",
    confidence_score: 0.95,
    rule_name: "explicit_api_key_field",
    valueGroup: 1,
  },
  {
    regex: /email:\s*(\S+)/gi,
    type: "EMAIL",
    confidence_score: 0.85,
    rule_name: "email_syntax",
    valueGroup: 1,
  },
];

function scan(text) {
  const candidates = [];
  for (const pattern of MOCK_DETECTION_PATTERNS) {
    pattern.regex.lastIndex = 0;
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      const groupIndex = pattern.valueGroup ?? 0;
      const value = match[groupIndex];
      if (!value) continue;
      const start = match.index + match[0].indexOf(value);
      candidates.push({
        type: pattern.type,
        start,
        end: start + value.length,
        value,
        confidence_score: pattern.confidence_score,
        rule_name: pattern.rule_name,
      });
    }
  }
  // Deterministic overlap resolution: longest span wins, then earliest start.
  const ordered = [...candidates].sort(
    (a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start,
  );
  const accepted = [];
  for (const candidate of ordered) {
    const overlaps = accepted.some(
      (chosen) => candidate.start < chosen.end && chosen.start < candidate.end,
    );
    if (!overlaps) accepted.push(candidate);
  }
  return accepted.sort((a, b) => a.start - b.start);
}

// Adds frontend-only presentation fields on top of the mock/API document
// shape. Kept inside the service boundary so pages never touch mock data
// directly.
function present(document) {
  const fragments = document.metadata?.encrypted_spans ?? [];
  const source = document.source_filename ?? "";
  const extension = source.includes(".")
    ? source.split(".").pop().toUpperCase()
    : "TXT";
  return {
    ...document,
    id: document.document_id,
    fileType: extension,
    sensitiveFieldCount: fragments.length,
    sensitiveTypes: [...new Set(fragments.map((fragment) => fragment.type))],
    maskedPreview: (document.masked_text ?? "")
      .split("\n")
      .filter(Boolean)
      .slice(0, 2)
      .join("\n"),
  };
}

const SENTINEL_CIPHERTEXT = "MOCK-CIPHERTEXT-OMITTED";
const SENTINEL_NONCE = "MOCK-NONCE-OMITTED";
const SENTINEL_AUTH_TAG = "MOCK-AUTH-TAG-OMITTED";

export async function getDocuments() {
  await delay(200);
  return mockStore.map(present);
}

export async function getDocument(documentId) {
  await delay(120);
  const document = mockStore.find(
    (candidate) => candidate.document_id === documentId,
  );
  return document ? present(document) : null;
}

// Preview detection metadata without persisting anything. Mirrors
// POST /documents/scan; sensitive values are never included in the result.
export async function scanText(text) {
  await delay(450);
  const content = String(text ?? "");
  if (!content.trim()) {
    return { detections: [] };
  }
  const detections = scan(content).map(
    ({ type, start, end, confidence_score, rule_name }) => ({
      type,
      start,
      end,
      confidence_score,
      rule_name,
    }),
  );
  return { detections };
}

// Simulates POST /documents: scans the submitted text and returns a
// protected document. No real encryption happens — values are replaced with
// safe placeholders, and the plaintext is never stored.
export async function createDocument({ text, document_id } = {}) {
  await delay(600);
  const content = String(text ?? "");
  if (!content.trim()) {
    throw new Error("Document text is required.");
  }

  const detections = scan(content);
  const id = document_id?.trim() || createId();
  const fragments = detections.map((detection) => {
    const fragmentId = createId();
    return {
      id: fragmentId,
      placeholder: `[SECUREDOC:${fragmentId}]`,
      type: detection.type,
      original_start: detection.start,
      original_end: detection.end,
      ciphertext: SENTINEL_CIPHERTEXT,
      nonce: SENTINEL_NONCE,
      auth_tag: SENTINEL_AUTH_TAG,
    };
  });

  let protectedText = content;
  let maskedText = content;
  for (let index = detections.length - 1; index >= 0; index -= 1) {
    const detection = detections[index];
    const fragment = fragments[index];
    protectedText =
      protectedText.slice(0, detection.start) +
      fragment.placeholder +
      protectedText.slice(detection.end);
    maskedText =
      maskedText.slice(0, detection.start) +
      `[REDACTED:${detection.type}]` +
      maskedText.slice(detection.end);
  }

  const currentUser = getSession()?.user ?? null;
  const document = {
    document_id: id,
    name: `Protected document ${id.slice(0, 8)}`,
    source_filename: "clipboard.txt",
    owner: currentUser?.username ?? "unknown",
    createdAt: new Date().toISOString().slice(0, 10),
    status: fragments.length > 0 ? "protected" : "pending",
    note: fragments.length === 0 ? "No sensitive fields detected." : undefined,
    protected_text: protectedText,
    masked_text: maskedText,
    metadata: {
      document_id: id,
      version: 1,
      encrypted_spans: fragments,
      key_envelope: {
        algorithm: "AES-256-GCM",
        key_version: 1,
        ciphertext: "MOCK-KEY-ENVELOPE-OMITTED",
        nonce: "MOCK-KEY-NONCE-OMITTED",
        auth_tag: "MOCK-KEY-AUTH-TAG-OMITTED",
      },
      source_filename: "clipboard.txt",
    },
  };

  mockStore.unshift(document);
  return present(document);
}

// Simulates POST /documents/upload. Validates extension and size like the
// backend adapters, then creates a protected document derived safely from the
// filename. The selected file's contents are never read or exposed.
export async function uploadDocument(file, document_id) {
  await delay(900);
  const validation = validateUploadFile(file);
  if (!validation.ok) {
    throw new Error(validation.error);
  }
  const id = document_id?.trim() || createId();
  const currentUser = getSession()?.user ?? null;
  const fragmentIds = [createId(), createId()];
  const document = {
    document_id: id,
    name: String(file.name).replace(/\.[^.]+$/, "") || `Uploaded document ${id.slice(0, 8)}`,
    source_filename: file.name,
    owner: currentUser?.username ?? "unknown",
    createdAt: new Date().toISOString().slice(0, 10),
    status: "protected",
    protected_text: `Source: ${file.name}
Protection prepared for this document.
Sensitive field: [SECUREDOC:${fragmentIds[0]}]
Contact: [SECUREDOC:${fragmentIds[1]}]`,
    masked_text: `Source: ${file.name}
Protection prepared for this document.
Sensitive field: [REDACTED:PASSWORD]
Contact: [REDACTED:EMAIL]`,
    metadata: {
      document_id: id,
      version: 1,
      encrypted_spans: [
        {
          id: fragmentIds[0],
          placeholder: `[SECUREDOC:${fragmentIds[0]}]`,
          type: "PASSWORD",
          original_start: 40,
          original_end: 62,
          ciphertext: SENTINEL_CIPHERTEXT,
          nonce: SENTINEL_NONCE,
          auth_tag: SENTINEL_AUTH_TAG,
        },
        {
          id: fragmentIds[1],
          placeholder: `[SECUREDOC:${fragmentIds[1]}]`,
          type: "EMAIL",
          original_start: 70,
          original_end: 92,
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
      source_filename: file.name,
    },
  };
  mockStore.unshift(document);
  return present(document);
}

// Synthetic demo values used to reconstruct protected fragments for ADMIN
// decrypt demonstrations. Clearly non-production content.
const DEMO_PLAINTEXT_VALUES = {
  PASSWORD: "DEMO_ONLY_PASSWORD",
  API_KEY: "DEMO_ONLY_API_KEY",
  CREDIT_CARD: "DEMO_ONLY_CARD",
  EMAIL: "demo@example.invalid",
};

// Simulates POST /documents/{id}/decrypt. Enforces the ADMIN role boundary in
// the service layer (the UI hiding the button is not the security boundary).
export async function decryptDocument(documentId) {
  await delay(700);
  const session = getSession();
  const user = session?.user ?? null;

  if (!user) {
    throw new Error("Authentication required.");
  }
  if (user.role !== "ADMIN") {
    recordAudit(documentId, user.id, "ACCESS_DENIED", "DENIED");
    throw new Error("Only ADMIN users may decrypt document content.");
  }

  const document = mockStore.find(
    (candidate) => candidate.document_id === documentId,
  );
  if (!document) {
    recordAudit(documentId, user.id, "DOCUMENT_ACCESSED", "NOT_FOUND");
    throw new Error("Document was not found.");
  }

  recordAudit(documentId, user.id, "DOCUMENT_DECRYPTED", "SUCCESS");

  let text = document.protected_text;
  for (const fragment of document.metadata?.encrypted_spans ?? []) {
    const demoValue =
      DEMO_PLAINTEXT_VALUES[fragment.type] ?? "DEMO_ONLY_SECRET_VALUE";
    text = text.replace(fragment.placeholder, demoValue);
  }
  return { document_id: documentId, text };
}

// Simulates GET /documents/{id}/audit. ADMIN only; returns safe audit records.
export async function getAudit(documentId) {
  await delay(400);
  const session = getSession();
  const user = session?.user ?? null;

  if (!user) {
    throw new Error("Authentication required.");
  }
  if (user.role !== "ADMIN") {
    throw new Error("Only ADMIN users may view audit trails.");
  }
  if (!mockStore.some((candidate) => candidate.document_id === documentId)) {
    throw new Error("Document was not found.");
  }

  const records = mockAuditLog.filter(
    (record) => record.document_id === documentId,
  );
  return { records };
}