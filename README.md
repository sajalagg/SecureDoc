# SecureDoc 🛡️

**Selective Field-Level Protection with Authenticated AES-256-GCM Envelope Encryption**

A modern full-stack document processing application designed to solve the security paradox of sensitive data handling: protecting secrets without locking out operational collaboration.

---

## 📌 Problem Statement & Core Philosophy

Traditional approaches to document security suffer from two major flaws:
1. **The Flaw of Full-File Encryption (e.g., standard PGP / BitLocker)**:
   Encrypting an entire file turns it into an opaque binary blob. Nobody can preview, index, search, or route the document without decrypting everything first, exposing every secret in the file to anyone who needs to read even one line.
2. **The Flaw of Permanent Redaction**:
   Blacking out text is destructive. The original credentials, account numbers, or API keys are permanently lost and cannot be recovered for authorized downstream operations.

### The SecureDoc Solution
SecureDoc introduces **Selective Field-Level Protection**:
- **Scans** incoming documents (`.txt`, `.docx`, `.pdf`) in real-time for sensitive entities (passwords, API tokens, payment cards, emails).
- **Replaces** each detected sensitive span with a unique placeholder: `[SECUREDOC:<uuid>]`.
- **Encrypts** only the sensitive fragments using **AES-256-GCM authenticated envelope encryption**.
- Non-sensitive text remains **100% human-readable and searchable**.
- Standard users (`USER` role) view safe, masked representations (`[REDACTED:PASSWORD]`).
- Administrators (`ADMIN` role) can unwrap the cryptographic envelope and reconstruct the original plaintext in memory, with every operation recorded in an immutable audit trail.

---

## ✨ Key Features

- **Multi-Format Ingestion**: Supports `.txt` (up to 1 MB), Microsoft Word `.docx` (up to 10 MB), and `.pdf` (up to 10 MB) documents.
- **Real-Time Detection Engine**:
  - Labeled passwords & connection strings (`password: ...`, `client_secret=...`).
  - Labeled credential pairs (`username: ... password: ...`).
  - Structured API tokens (Stripe `sk_live_`, GitHub `ghp_`, Slack `xoxb-`, AWS `AKIA`).
  - Luhn-validated payment card numbers (with false-positive suppression).
  - RFC 5322 compliant email addresses.
  - Deterministic overlap resolution (longest span wins).
- **Cryptographic Rigor (AES-256-GCM AEAD)**:
  - Strict authenticated symmetric encryption using Python's audited `cryptography` library.
  - Cryptographically fresh 96-bit random nonces (`os.urandom(12)`) per fragment.
  - 128-bit authentication tags verify integrity and prevent tampering.
- **Envelope Encryption & Key Hierarchy**:
  - Unique per-document 256-bit **Data Encryption Keys (DEK)**.
  - DEKs are encrypted (wrapped) with a 256-bit **Master Key (KEK)** from environment variables.
  - Document ID and version bound via **Associated Authenticated Data (AAD)** to prevent envelope swapping attacks.
- **Role-Based Access Control (RBAC)**:
  - Enforced strictly in the backend service layer.
  - `USER`: Register, create, upload, and view masked documents (`[REDACTED:...]`).
  - `ADMIN`: Inspect envelopes, decrypt to plaintext in memory, manage/delete documents, and review audit logs.
- **Immutable Audit Logging**:
  - Tracks `timestamp`, `user_id`, `document_id`, `action`, and `result`.
  - Zero plaintext secrets, keys, or passwords ever reach log files.
  - Audit trails are preserved even when a document is permanently deleted.
- **Full-Stack Experience**: Modern responsive interface built with React 19, Vite 8, and Tailwind CSS v4.

---

## 🏗️ Architecture & Data Flow

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React 19)                           │
│  - LoginPage.jsx       - DocumentsPage.jsx      - DocumentDetailPage.jsx│
│  - NewDocumentPage.jsx - UploadDocumentPage.jsx - SecurityPage.jsx      │
│  - ScanPage.jsx        - AuditPage.jsx          - DeleteConfirmDialog   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP (REST JSON / FormData + JWT Bearer)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       BACKEND API LAYER (FastAPI)                       │
│  `backend/app/api/main.py`                                              │
│  - Route handlers, Pydantic schemas & CORS middleware                   │
│  - JWT Bearer authentication dependency (`current_user`)                │
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

## 💻 Tech Stack

- **Backend**: Python 3.9+, FastAPI, Uvicorn, Pydantic v2, Pytest, `cryptography`, `python-docx`, `pypdf`.
- **Frontend**: React 19, Vite 8, Tailwind CSS v4, React Router v7, Lucide Icons.
- **Database**: SQLite3 with thread-safe locking and foreign key enforcement.
- **Auth**: Salted Scrypt password hashing (`scrypt$16384$8$1`), HMAC-SHA256 JWT tokens.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9 or newer
- Node.js v20+ and npm

### 1. Backend Setup

```bash
# 1. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# 3. Configure environment variables
# Copy .env.example or create .env:
cat << 'EOF' > .env
SECUREDOC_MASTER_KEY_BASE64=Oxcy4ECV1qjXv08bz6nsuVKsIjfSACU_DmaxUiRv9n4=
SECUREDOC_AUTH_SECRET=Bbx2QefbEHZn1k2-DninIcYjVH1TMR0GnwSiWCfnBZQ
SECUREDOC_DATABASE_PATH=securedoc.db
EOF

# 4. Start the FastAPI backend server
PYTHONPATH=backend uvicorn app.api.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend will be live at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

In a new terminal:
```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev -- --port 5173
```
Open **`http://127.0.0.1:5173`** in your browser.

---

## 🔑 Default Accounts (Click to Auto-Fill on Login)

| Username | Password | Role | Permissions |
| :--- | :--- | :--- | :--- |
| **`alice`** | `AlicePass123!` | `USER` | Upload/create documents, view masked text (`[REDACTED:...]`). |
| **`admin`** | `AdminPass123!` | `ADMIN` | View all documents, decrypt to plaintext, view audit trail, delete documents. |

---

## 📡 REST API Reference

| Method | Path | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Any | Register a new standard USER account. |
| `POST` | `/auth/login` | Public | Any | Authenticate and obtain JWT bearer token. |
| `GET` | `/auth/me` | Bearer | Any | Return profile and role of authenticated caller. |
| `POST` | `/documents/scan` | Bearer | Any | Preview detection metadata without saving. |
| `POST` | `/documents` | Bearer | Any | Protect and store plaintext content. |
| `POST` | `/documents/upload` | Bearer | Any | Upload and protect `.txt`, `.docx`, or `.pdf`. |
| `GET` | `/documents` | Bearer | Any | List accessible documents (own for USER, all for ADMIN). |
| `GET` | `/documents/{id}` | Bearer | Any | Fetch document (masked for USER, protected for ADMIN). |
| `POST` | `/documents/{id}/decrypt` | Bearer | **ADMIN** | Decrypt protected fragments into plaintext. |
| `GET` | `/documents/{id}/audit` | Bearer | **ADMIN** | Retrieve safe immutable audit trail. |
| `DELETE`| `/documents/{id}` | Bearer | **ADMIN** | Permanently remove document and key envelope. |

---

## 🔒 Security Specifications

- **Cipher**: AES-256-GCM (Authenticated Encryption with Associated Data).
- **Key Sizes**: 256-bit (32 bytes) Master Key and Document Keys.
- **Nonces**: 96-bit (12 bytes) cryptographically random (`os.urandom(12)`), never reused.
- **Integrity Tag**: 128-bit (16 bytes) GCM authentication tag.
- **Password Hash**: Scrypt with $N=16384$, $r=8$, $p=1$, and 16-byte random salt.
- **Tamper Protection**: Modifying any ciphertext, nonce, or envelope in storage causes immediate authentication tag verification failure (`422 Unprocessable Entity`).
- **Audit Logging**: Immutable, append-only records containing IDs and outcomes only. Plaintext secrets and cryptographic keys are strictly barred from all logs.

---

## 📄 License

This project was developed for academic, educational, and demonstration purposes.
