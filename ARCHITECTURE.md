# SecureDoc architecture — Milestone 3

## Goal

SecureDoc selectively protects sensitive values in normalized plain text. It does
not encrypt the whole document. This milestone has no UI, database, users, or API
server; those are later layers around this tested core.

## Pipeline

```text
master key → wraps a random document key → encrypted key envelope
                  ↓
plain text → detector → exact spans → protector → protected text + metadata
                  ↓
document key → AES-256-GCM fragment encryption → reconstruction → original text
```

`app.services.document_service` is the friendly entry point:

- `scan_document(text)` finds detections.
- `protect_document(text, document_id, key)` scans and replaces only detected
  values with `[SECUREDOC:<uuid>]` placeholders.
- `decrypt_document(protected_document, key)` verifies every fragment and restores
  the original text. It remains useful for lower-level tests.
- `protect_document_with_master_key(text, document_id)` is the preferred stored-
  document operation: it creates, uses, and wraps a per-document key.
- `decrypt_document_with_master_key(protected_document)` unwraps that key and
  reconstructs the document. A future authorization layer will guard this call.

## Cryptographic decision

Each document receives a random 32-byte AES-256 key. Every fragment gets a fresh
random 96-bit nonce and uses AES-GCM authenticated encryption from the established
`cryptography` library. The document key is then encrypted (wrapped) by a
separately configured 32-byte master key, also with AES-GCM. Associated data binds
fragments to their document ID, fragment ID, and category and binds a key envelope
to its document ID and version.

The master key is read from `SECUREDOC_MASTER_KEY_BASE64`; it is never generated
silently, stored in metadata, or committed to Git. The ignored `.env` file remains
acceptable only for a local prototype. Production systems should use a dedicated
key-management service.

## Authentication, authorization, and storage

SQLite is the cross-platform database. It has separate `users`, `documents`, and
`audit_logs` tables. Documents store protected text, encrypted-fragment metadata,
and the encrypted document-key envelope; they never store the original document,
the plaintext document key, or the master key.

Passwords are salted and derived using `cryptography`'s Scrypt implementation.
SecureDoc stores the derived value and its parameters, never the password itself.

The RBAC and disclosure policy enforces least-privilege access:
- **`USER` role:** Can create documents, view their own documents, and list documents. When viewing document content, sensitive placeholders are safely replaced with typed masks (e.g. `[REDACTED:PASSWORD]`, `[REDACTED:API_KEY]`) via `app.documents.reconstruction.redact_text` / `app.services.document_service.redact_document`. Non-admin users cannot access other users' documents.
- **`ADMIN` role:** Can view all documents, inspect the full encrypted metadata, decrypt/reconstruct original plaintext via `decrypt_document_as_admin`, and inspect audit trails via `get_audit_for_document_as_admin`.
- **Unauthorized decryption:** Attempts by non-administrators are denied with `AuthorizationError` (HTTP 403) and audited as `ACCESS_DENIED`.
- **Audit trail:** All critical lifecycle events are audited (`REGISTER_SUCCESS`, `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `DOCUMENT_CREATED`, `DOCUMENT_ACCESSED`, `DOCUMENT_DECRYPTED`, `ACCESS_DENIED`). Records store timestamps, user IDs, document IDs, actions, and outcomes only; plaintext, secrets, passwords, and keys are strictly excluded.

`app.services.security_service` provides the application-level functions:

- `register_user(...)` and `authenticate_user(...)`
- `create_document(...)`
- `decrypt_document_as_admin(...)`
- `get_document_for_user(...)` and `get_masked_document_for_user(...)`
- `list_documents_for_user(...)`
- `get_audit_for_document_as_admin(...)`

## API layer

FastAPI is a thin authenticated transport layer in `app.api.main`. It exposes
registration/login, scan preview, protected document creation/list/retrieval,
ADMIN-only decryption, and ADMIN-only audit retrieval. Login issues a signed,
30-minute Bearer token. The API signing secret is separate from the encryption
master key and must be at least 32 bytes.

Public registration creates only `USER` accounts. The first `ADMIN` is created by
the local `python -m app.bootstrap_admin` command, preventing an attacker from
making themselves an administrator through a public endpoint.

## Document adapters (TXT, DOCX, PDF)

`app.documents.adapters` provides pluggable boundaries between incoming file
formats and SecureDoc's normalized plain text engine:

```text
Upload (.txt, .docx, .pdf) → Adapter.read() → Extracted normalized text → SecureDoc Engine
```

The cryptographic core, detector, RBAC, and storage remain entirely unaware of the
file format.

- **`TextDocumentAdapter` (.txt):** Requires valid UTF-8 encoding; 1 MB upload limit.
- **`DocxDocumentAdapter` (.docx):** Extracts text across paragraphs and tables using `python-docx`; 10 MB limit. Corrupted packages and empty files are rejected with `DocumentFormatError`.
- **`PdfDocumentAdapter` (.pdf):** Extracts page text using `pypdf`; 10 MB limit. Rejects encrypted/password-protected PDFs safely.
  *Limitation:* Scanned or image-only PDFs do not have an embedded text layer and require OCR preprocessing prior to ingestion.
- **Unified Dispatcher:** `read_document_file(filename, content)` automatically routes to the appropriate adapter based on extension or rejects unsupported file extensions with a descriptive error.
- **API integration:** `POST /documents/upload` accepts `.txt`, `.docx`, and `.pdf` files, storing the source filename in metadata.

## Why placeholders instead of replacement offsets

Original offsets identify exactly what was encrypted in the source. But a
placeholder usually has a different length from the original value, so offsets no
longer point to the same characters afterwards. Reconstruction therefore locates
unique placeholders; original offsets stay in metadata for traceability and
validation.

## Detection design & heuristics

The detector employs transparent, deterministic rules without black-box models:
- **Explicit password fields & credential pairs (0.99):** Labeled password fields (including `password`, `passwd`, `pwd`, `client_secret`, `db_password`, supporting quoted/unquoted values and punctuation stripping) and correlated username/password pairs.
- **Payment cards (0.98):** Candidate digit sequences (13–19 digits, formatted or raw) validated using the Luhn checksum algorithm, with false-positive filtering for zero-prefixed, repetitive, or date strings.
- **Explicit API key fields (0.95):** Labeled API key, token, or secret assignments.
- **Bearer tokens (0.92):** Authorization bearer token patterns.
- **Structured prefix tokens (0.90):** High-specificity token prefixes (Stripe `sk_live_`/`sk_test_`, GitHub `ghp_`/`gho_` etc., GitLab `glpat-`, AWS Access Key IDs `AKIA`, and Slack `xoxb-`).
- **Email syntax (0.85):** RFC-compliant email matching requiring valid TLD domains and boundary protections.

Span overlap resolution (`_remove_overlaps`) deterministically prefers the longest span, breaking ties by confidence score, rule name, and position.

## Important limitations

- Regex is intentionally conservative and cannot identify arbitrary unlabelled secrets without structure. Confidence scores are rules-based heuristics, not calibrated probabilities.
- Email addresses are in scope as sensitive data per specification.
