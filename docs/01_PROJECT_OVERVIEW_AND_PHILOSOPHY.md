# 01 — Project Overview & Core Philosophy

## 1. The Core Problem SecureDoc Solves

In modern organizations, sensitive documents (server configurations, financial records, API integrations, employee logs) present a security paradox:

1. **The Flaw of Full-Disk or Full-File Encryption**:
   - If an entire document is encrypted (e.g. standard PGP or BitLocker), it becomes an opaque binary blob.
   - Nobody can preview the document, index it, search its metadata, verify its structure, or route it through approval pipelines without decrypting the entire file first.
   - Decrypting the whole file exposes every secret inside it to anyone who needs to read even one line.

2. **The Flaw of Permanent Redaction**:
   - Blacking out text or deleting characters is destructive.
   - Once redacted, the original secret (API key, connection password, card number) is permanently gone and cannot be used by authorized operational systems.

### The SecureDoc Solution: Selective Field-Level Protection

SecureDoc bridges this gap:
- It **automatically scans** incoming documents (.txt, .docx, .pdf) for sensitive patterns (passwords, API tokens, payment cards, emails).
- It **replaces each sensitive span** with a safe, unique placeholder: `[SECUREDOC:<uuid>]`.
- It **encrypts only the sensitive fragments** using authenticated symmetric encryption (**AES-256-GCM**).
- Non-sensitive text remains **100% human-readable**, searchable, and usable by regular users (`USER` role).
- An authorized administrator (`ADMIN` role) can decrypt the cryptographic envelope and reconstruct the original text in memory at any time.

---

## 2. Core Architectural & Coding Philosophies

### Principle 1: Strict Layered Separation (Clean Architecture)
```text
HTTP Request (Client)
        ↓
FastAPI Routes (`backend/app/api/main.py`)  ← Thin routing & schema validation
        ↓
Service Layer (`backend/app/services/`)     ← Business rules & authorization
        ↓
Domain Engines:
  - Detection (`backend/app/detector/`)      ← Regex & Luhn validation
  - Cryptography (`backend/app/encryption/`)  ← AES-256-GCM & key management
  - Document Adapters (`backend/app/documents/`) ← TXT, DOCX, PDF parsing
        ↓
Persistence (`backend/app/storage/`)       ← SQLite data access & safe audit logs
```
*Why this matters to evaluators*:
No database queries, no cryptography math, and no file-format parsing logic ever live inside API route handlers. Route handlers merely validate inputs, call the service layer, and return typed responses.

---

### Principle 2: Cryptographic Rigor (Zero Custom Cryptography)
- **Standard AEAD**: SecureDoc strictly uses **AES-256-GCM** (Galois/Counter Mode) via the audited `cryptography` Python library.
- **Random Nonces**: Every encrypted fragment and wrapped key receives a cryptographically fresh 96-bit random nonce (`os.urandom(12)`). A nonce is **never reused** with the same key.
- **Integrity & Authenticity**: A 128-bit authentication tag is verified on every decryption. If an attacker tampers with even a single bit in the SQLite database, the decryption fails immediately with `InvalidTag` / `DecryptionError`.

---

### Principle 3: Envelope Encryption & Key Hierarchy
Storing a static master key in the database alongside data is a fatal security error. SecureDoc uses a 2-tier key hierarchy:
1. **Master Key (Key Encryption Key / KEK)**:
   - A 256-bit key provided via environment variable (`SECUREDOC_MASTER_KEY_BASE64`).
   - Never stored in SQLite or source code.
2. **Document Key (Data Encryption Key / DEK)**:
   - A unique 256-bit key generated for each document (`generate_key()`).
   - Used to encrypt all sensitive fragments in that specific document.
   - Wrapped (encrypted) with the Master Key using AES-256-GCM and stored alongside the document metadata.
   - **Associated Authenticated Data (AAD)**: When wrapping the document key, the document ID and version are bound via AAD (`securedoc-key-envelope-v1|<doc_id>|<version>`). This cryptographically prevents an attacker from swapping key envelopes between documents.

---

### Principle 4: Role-Based Access Control (RBAC) at the Service Layer
SecureDoc enforces two distinct user roles:
- **`USER`**: Can register, upload/create documents, and view documents in **Masked View** (`[REDACTED:PASSWORD]`, `[REDACTED:API_KEY]`). Regular users **never have access to cryptographic keys** and cannot decrypt fragments.
- **`ADMIN`**: Can view all documents, inspect key envelopes, decrypt documents into original plaintext, view the immutable audit trail, and permanently delete records.

*Crucial Security Detail*: The security boundary is **enforced in the backend Python service layer**, not in the frontend React UI. Hiding a button on the client side is UX; checking `require_admin(user)` in Python is security.

---

### Principle 5: Zero Secrets in Logs & Zero Plaintext in Storage
- The SQLite database only contains ciphertext, nonces, authentication tags, and placeholders. Plaintext secrets never touch the disk.
- Audit logs record:
  - `timestamp`: When the event occurred (ISO 8601).
  - `user_id`: Who performed the action.
  - `document_id`: Which document was targeted.
  - `action`: What happened (`DOCUMENT_CREATED`, `DOCUMENT_DECRYPTED`, `ACCESS_DENIED`, `DOCUMENT_DELETED`).
  - `result`: Outcome (`SUCCESS`, `DENIED`, `FAILED`).
- Plaintext secrets, passwords, and master keys are **strictly excluded from all log records**.
