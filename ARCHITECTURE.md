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

SQLite is the local prototype database. It has separate `users`, `documents`, and
`audit_logs` tables. Documents store protected text, encrypted-fragment metadata,
and the encrypted document-key envelope; they never store the original document,
the plaintext document key, or the master key.

Passwords are salted and derived using `cryptography`'s Scrypt implementation.
SecureDoc stores the derived value and its parameters, never the password itself.
This avoids relying on optional password-hashing features in a particular Python
build.

The current policy is intentionally small: both authenticated roles may create a
protected document, but only `ADMIN` may decrypt it. `USER` decryption attempts
are denied and recorded. Audit records contain timestamp, user ID, document ID,
action, and result; they must never contain plaintext, passwords, API keys, card
numbers, or keys.

`app.services.security_service` provides the application-level functions:

- `register_user(...)` and `authenticate_user(...)`
- `create_document(...)`
- `decrypt_document_as_admin(...)`

FastAPI will call these services in the next milestone rather than duplicating
their encryption, authorization, or persistence logic.

## API layer

FastAPI is a thin authenticated transport layer in `app.api.main`. It exposes
registration/login, scan preview, protected document creation/list/retrieval,
ADMIN-only decryption, and ADMIN-only audit retrieval. Login issues a signed,
30-minute Bearer token. The API signing secret is separate from the encryption
master key and must be at least 32 bytes.

Public registration creates only `USER` accounts. The first `ADMIN` is created by
the local `python -m app.bootstrap_admin` command, preventing an attacker from
making themselves an administrator through a public endpoint.

## Why placeholders instead of replacement offsets

Original offsets identify exactly what was encrypted in the source. But a
placeholder usually has a different length from the original value, so offsets no
longer point to the same characters afterwards. Reconstruction therefore locates
unique placeholders; original offsets stay in metadata for traceability and
validation.

## Important limitations

- Regex is intentionally conservative and cannot identify every password or API
  key. Confidence scores are rules-based heuristics, not probabilities.
- Email addresses are in scope because requested, though some deployments may
  classify them as personal rather than secret data.
- A caller must enforce authentication and authorization before it calls
  `decrypt_document`. RBAC and audit logging are later milestones.
