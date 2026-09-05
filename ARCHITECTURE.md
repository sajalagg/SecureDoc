# SecureDoc architecture — Milestone 1

## Goal

SecureDoc selectively protects sensitive values in normalized plain text. It does
not encrypt the whole document. This milestone has no UI, database, users, or API
server; those are later layers around this tested core.

## Pipeline

```text
plain text → detector → exact Detection spans → protector → protected text + metadata
                                                                  ↓
document key → AES-256-GCM encryption                         reconstruction
                                                                  ↓
                                                            original plain text
```

`app.services.document_service` is the friendly entry point:

- `scan_document(text)` finds detections.
- `protect_document(text, document_id, key)` scans and replaces only detected
  values with `[SECUREDOC:<uuid>]` placeholders.
- `decrypt_document(protected_document, key)` verifies every fragment and restores
  the original text.

## Cryptographic decision

Each document is intended to have its own random 32-byte AES-256 key. Every
fragment receives a new random 96-bit nonce and uses AES-GCM authenticated
encryption from the established `cryptography` library. Associated data binds a
fragment to its document ID, fragment ID, and category. The key is deliberately
absent from `ProtectedDocument.metadata()`.

For this learning prototype, application configuration can supply the document key
from an ignored `.env` file. The next security milestone should introduce a random
per-document key encrypted (wrapped) by a configured master key. That is more
securely compartmentalised than one global encryption key, while being far simpler
than implementing an external key-management service now.

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

