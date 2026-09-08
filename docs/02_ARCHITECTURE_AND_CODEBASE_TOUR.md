# 02 — Architecture & Codebase Tour

This document provides a detailed tour of the entire SecureDoc codebase. Use this to trace how requests flow and understand every single module.

---

## 1. System Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React 19)                           │
│  - LoginPage.jsx       - DocumentsPage.jsx      - DocumentDetailPage.jsx│
│  - NewDocumentPage.jsx - UploadDocumentPage.jsx - SecurityPage.jsx      │
│  - ScanPage.jsx        - AuditPage.jsx          - Components / Dialogs  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP (REST JSON / FormData + JWT Bearer)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       BACKEND API LAYER (FastAPI)                       │
│  `backend/app/api/main.py`                                              │
│  - Route handlers & CORS configuration                                  │
│  - Pydantic request/response validation                                 │
│  - JWT Bearer token dependency (`current_user`)                         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                  │
│  `document_service.py`             │  `security_service.py`             │
│  - `scan_document()`               │  - `authenticate_user()`           │
│  - `protect_document()`            │  - `register_user()`               │
│  - `redact_document()`             │  - `create_document()`             │
│  - `decrypt_document_with_master()`│  - `decrypt_document_as_admin()`   │
│                                    │  - `delete_document_as_admin()`    │
│                                    │  - `get_audit_for_document_...()`  │
└──────────────────┬─────────────────┴─────────────────┬──────────────────┘
                   │                                   │
         ┌─────────┴─────────┐               ┌─────────┴─────────┐
         ▼                   ▼               ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ DETECTOR ENGINE │ │ CRYPTO & KEYS   │ │ FORMAT ADAPTERS │ │ STORAGE LAYER   │
│ `detector.py`   │ │ `crypto.py`     │ │ `adapters.py`   │ │ `repository.py` │
│ `patterns.py`   │ │ `key_manager.py`│ │ TXT, DOCX, PDF  │ │ SQLite3 DB      │
│ Regex + Luhn    │ │ AES-256-GCM     │ │ extraction      │ │ Audit Logs      │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 2. End-to-End Data Lifecycle

### A. Document Protection Lifecycle (Upload/Create)
```text
Plaintext ("Database Password: SuperSecret123!")
     │
     ▼
[1] Detection Stage (`scan_document`)
     - Regex pattern matches `SuperSecret123!` at chars [19:34]
     - Identified as type `PASSWORD`
     │
     ▼
[2] Key Generation (`generate_document_key`)
     - Fresh 256-bit AES DEK created for this document
     │
     ▼
[3] Envelope Encryption (`wrap_document_key`)
     - DEK encrypted with Master Key via AES-256-GCM + AAD
     │
     ▼
[4] Fragment Encryption (`protect_text`)
     - Fragment encrypted with DEK via AES-256-GCM
     - Replaced in text with: `[SECUREDOC:<fragment-uuid>]`
     │
     ▼
[5] Persistence (`save_document`)
     - Protected text + Metadata JSON (ciphertexts, nonces, tags, envelope)
     - Stored into SQLite `documents` table
     - Audit event logged: `DOCUMENT_CREATED`
```

### B. User Viewing vs. Admin Decryption
- **When Alice (`USER`) requests document**:
  1. `get_document_for_user` checks ownership.
  2. In-memory engine replaces `[SECUREDOC:<uuid>]` with `[REDACTED:PASSWORD]`.
  3. Plaintext is **never decrypted**. No keys are accessed.
- **When Admin (`ADMIN`) requests decryption**:
  1. `require_admin` verifies caller has `Role.ADMIN`.
  2. Document envelope unwrapped using Master Key.
  3. Each encrypted fragment is authenticated and decrypted using DEK.
  4. Original text reconstructed in-memory and returned to caller.
  5. Audit log records `DOCUMENT_DECRYPTED -> SUCCESS`.

---

## 3. Backend Module Breakdown

### `backend/app/api/main.py`
The FastAPI application factory (`create_app`) and HTTP route controllers:
- `app.add_middleware(CORSMiddleware)`: Enables browser requests from Vite dev server.
- `current_user`: FastAPI dependency checking Bearer token validity and looking up user in SQLite.
- Routes:
  - `POST /auth/register` & `POST /auth/login`: Issue HMAC-SHA256 JWT bearer tokens.
  - `GET /auth/me`: Returns user identity and role.
  - `POST /documents/scan`: Real-time detection preview without persisting anything.
  - `POST /documents`: Protects and persists pasted text.
  - `POST /documents/upload`: Multi-format multipart file upload (`.txt`, `.docx`, `.pdf`).
  - `GET /documents`: Lists documents accessible to the current role.
  - `GET /documents/{id}`: Returns document details (masked for user, protected for admin).
  - `POST /documents/{id}/decrypt`: Admin-only decryption. Returns HTTP 403 to users, HTTP 422 on bad tags.
  - `GET /documents/{id}/audit`: Admin-only audit log retrieval.
  - `DELETE /documents/{id}`: Admin-only document deletion.

### `backend/app/services/document_service.py`
High-level document processing:
- `scan_document(text)`: Scans text and returns structured detection objects.
- `protect_document(text, document_id, filename)`: Coordinates scanning, key generation, fragment encryption, and envelope wrapping.
- `redact_document(protected_document)`: Replaces placeholders with safe typed masks like `[REDACTED:PASSWORD]` without touching crypto keys.
- `decrypt_document_with_master_key(protected_document)`: Unwraps the DEK and reconstructs plaintext.

### `backend/app/services/security_service.py`
Authorization and audit orchestration:
- `authenticate_user()`: Validates credentials using salted Scrypt verification. Logs `LOGIN_SUCCESS` or `LOGIN_FAILURE`.
- `register_user()`: Hashes password with Scrypt and creates user record. Logs `REGISTER_SUCCESS`.
- `decrypt_document_as_admin()`: Enforces `require_admin`, handles decryption errors, and records `DOCUMENT_DECRYPTED`.
- `delete_document_as_admin()`: Enforces `require_admin`, deletes record from storage, and records `DOCUMENT_DELETED`.

### `backend/app/detector/detector.py` & `patterns.py`
Sensitive data discovery:
- `patterns.py`: Compiled regular expressions for:
  - Labeled passwords & credentials (`password: ...`, `client_secret=...`).
  - Labeled credential pairs (`username: ... password: ...`).
  - Structured API keys (Stripe `sk_live_`, GitHub `ghp_`, Slack `xoxb-`, AWS `AKIA`).
  - Strict Luhn-checksum-verified payment cards.
  - RFC 5322 email syntax.
- `detector.py`: Scans text, executes rules, and uses deterministic overlap resolution (longest span wins, breaking ties by confidence).

### `backend/app/encryption/crypto.py` & `key_manager.py`
Cryptographic engine:
- `encrypt(plaintext, key, associated_data)`: Generates fresh 12-byte nonce, executes `AESGCM(key).encrypt()`, and splits ciphertext and 16-byte auth tag.
- `decrypt(ciphertext, key, nonce, auth_tag, associated_data)`: Reconstructs payload and verifies auth tag with `AESGCM(key).decrypt()`. Raises `DecryptionError` if tag fails.
- `key_manager.py`: Implements envelope encryption (`wrap_document_key` and `unwrap_document_key`) with cryptographically bound AAD.

### `backend/app/documents/adapters.py`
Multi-format file adapters:
- `TextDocumentAdapter`: Handles UTF-8 encoded plain text up to 1 MB.
- `DocxDocumentAdapter`: Uses `python-docx` to extract text from Word documents up to 10 MB.
- `PdfDocumentAdapter`: Uses `pypdf` to extract text from PDF pages up to 10 MB.
- `read_document_file()`: Extension dispatcher directing `.txt`, `.docx`, and `.pdf` to their respective adapters.

### `backend/app/storage/repository.py`
Database access layer:
- SQLite3 with thread locks (`threading.RLock`) and `PRAGMA foreign_keys = ON`.
- Manages `users`, `documents`, and `audit_logs` tables.
- Audit records contain only non-sensitive audit metadata (`timestamp`, `user_id`, `document_id`, `action`, `result`).

---

## 4. Frontend Architecture Tour

### `frontend/src/services/`
- `apiClient.js`: Central HTTP fetch wrapper injecting Bearer token, formatting JSON/FormData, and parsing backend error details.
- `authService.js`: Manages login, registration, session persistence in localStorage, and `restoreSession()`.
- `documentService.js`: API client mapping 1:1 to FastAPI backend routes. Contains the `present(doc)` helper to enrich raw API data for React components.
- `securityService.js`: Computes real-time workspace security metrics from live documents.
- `userService.js`: Maps user IDs in audit trails to human-readable usernames.

### `frontend/src/pages/`
- `LoginPage.jsx`: Authentication screen with 1-click test account fill buttons (`alice` / `admin`).
- `DashboardPage.jsx`: Workspace metrics, active protection overview, and quick action cards.
- `DocumentsPage.jsx`: Workspace document list. Displays inline Admin delete icons, status badges, and dismissible feedback alerts.
- `DocumentDetailPage.jsx`: Full document view (masked for users, protected for admins) with memory decryption and Admin action drawer.
- `NewDocumentPage.jsx`: Paste text to selectively protect with demo quick-fill button.
- `UploadDocumentPage.jsx`: Drag-and-drop multi-format file upload with client-side extension/size validation.
- `ScanPage.jsx`: Real-time detection preview without persisting data.
- `AuditPage.jsx`: Immutable audit log table showing timestamps, user IDs, actions, and results.
- `SecurityPage.jsx`: Interactive trust model, cryptographic parameters, and RBAC matrix.
