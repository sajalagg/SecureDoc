# SecureDoc architecture — Milestone 2

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
