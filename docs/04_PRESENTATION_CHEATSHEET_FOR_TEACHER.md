# 04 — Presentation & Viva Cheatsheet for Teacher/Evaluator

Use this document to prepare for your project demonstration, viva, or teacher presentation. It contains word-for-word speaking scripts, expected teacher questions, and high-scoring technical answers.

---

## 1. The 60-Second Elevator Pitch (What to Say First)

> *"Good morning/afternoon, Professor.*
>
> *Today I'm presenting **SecureDoc**, a secure document processing system with **Selective Field-Level Protection**.*
>
> *Traditional encryption forces an all-or-nothing trade-off: if you encrypt an entire file, it becomes an unreadable binary blob that cannot be previewed, indexed, or routed. But if you permanently redact secrets, they are destroyed forever.*
>
> *SecureDoc solves this problem. It uses pattern recognition to detect sensitive fragments—like database passwords, API tokens, payment cards, and emails. It encrypts **only those fragments** using **AES-256-GCM authenticated envelope encryption**, while leaving the rest of the document readable.*
>
> *Standard users only see safe, masked versions like `[REDACTED:PASSWORD]`, while an authorized Administrator can decrypt the cryptographic envelope and reconstruct the original text in memory, with every access recorded in an immutable audit trail."*

---

## 2. Live Demo Script (Step-by-Step Walkthrough)

Open your browser at `http://127.0.0.1:5173` and follow this 5-step demonstration:

### Step 1: Real-Time Detection
1. Log in as **`alice`** (`AlicePass123!`, `USER` role).
2. Go to **Scan text** (`/documents/scan`).
3. Paste sample text containing passwords, API keys, or emails.
4. Click **Scan**:
   - **Explain to Teacher**: *"The text is sent to our pattern detector. It discovers passwords, Stripe keys, and RFC-compliant emails with confidence scores and character offsets. Plaintext secrets are never stored or logged."*

### Step 2: Document Protection (Envelope Encryption)
1. Go to **New document** (`/documents/new`) or **Upload document** (`/documents/upload` - supporting `.txt`, `.docx`, `.pdf`).
2. Click **Protect & create**.
3. Point out the resulting view:
   - **Explain to Teacher**: *"The document is stored in SQLite. Only the sensitive fragments are encrypted using a fresh 256-bit AES key, and that key is wrapped by the Master Key. Notice that as user Alice, I only see `[REDACTED:PASSWORD]`. The sensitive data is completely inaccessible to standard users."*

### Step 3: RBAC Boundary Demonstration
1. Show that Alice has no "Decrypt" button.
2. If Alice tries to call `POST /documents/{id}/decrypt` directly via the API, the backend returns **HTTP 403 Forbidden**.
   - **Explain to Teacher**: *"The security boundary is strictly enforced in the Python service layer, not just by hiding UI buttons."*

### Step 4: Admin Decryption & In-Memory Reconstruction
1. Sign out and sign in as **`admin`** (`AdminPass123!`, `ADMIN` role).
2. Open the document created by Alice.
3. Show the **Protected representation** with `[SECUREDOC:<uuid>]` placeholders and the key envelope details.
4. Click **Decrypt document**:
   - The original plaintext appears instantly in an emerald card.
   - **Explain to Teacher**: *"The backend verified my ADMIN token, loaded the Master Key, unwrapped the document's key envelope, verified the 128-bit authentication tag, and reconstructed the plaintext in memory. The decrypted text is never saved back to storage."*

### Step 5: Audit Trail & Admin Document Deletion
1. Click **View audit trail**:
   - Show the recorded entries: `DOCUMENT_CREATED`, `ACCESS_DENIED`, `DOCUMENT_DECRYPTED`.
   - **Explain to Teacher**: *"Zero secrets appear in this log. It only contains timestamps, user IDs, actions, and outcomes."*
2. Click **Delete document**:
   - Confirm the deletion.
   - Show that the document is removed from SQLite, but the audit trail preserves the record of deletion for legal compliance.

---

## 3. Tough Questions from Teachers & High-Scoring Answers

### Q1: *"Why did you choose AES-256-GCM instead of AES-CBC or RSA?"*
**Answer**:
> *"AES-GCM is an **Authenticated Encryption with Associated Data (AEAD)** cipher. Unlike AES-CBC, which requires a separate HMAC to guarantee integrity, AES-GCM generates a 128-bit authentication tag natively. If an attacker tampers with even a single bit of the ciphertext in SQLite, decryption fails immediately with an `InvalidTag` exception.*
>
> *We chose symmetric AES over asymmetric RSA because symmetric encryption is thousands of times faster, has no payload size limits, and is the industry standard for document payload encryption."*

---

### Q2: *"What is Envelope Encryption, and why didn't you just use one master key for all documents?"*
**Answer**:
> *"If you use a single master key to encrypt all documents directly, compromising that key compromises the entire company's history. Furthermore, key rotation would require re-encrypting terabytes of document data.*
>
> *With **Envelope Encryption**, every single document gets its own unique 256-bit **Data Encryption Key (DEK)**. The DEK encrypts the document fragments. Then, our **Master Key (Key Encryption Key / KEK)** encrypts only the DEK.
>
> *Additionally, we bind the document ID and version as **Associated Authenticated Data (AAD)** during DEK wrapping (`securedoc-key-envelope-v1|<doc_id>|<version>`). This makes it mathematically impossible for an attacker to take a valid key envelope from Document A and transplant it into Document B."*

---

### Q3: *"What happens if an attacker has direct access to the SQLite database file?"*
**Answer**:
> *"Even with full root access to the SQLite `.db` file:
> 1. **No secrets can be decrypted**: The Master Key is stored in an external environment variable, not in the database.
> 2. **No passwords can be cracked**: User passwords are not stored in plaintext or fast hashes like MD5; they are hashed with **salted Scrypt** (`scrypt$16384$8$1`), which is computationally memory-hard against GPU brute-forcing.
> 3. **Tampering is detected**: Modifying any ciphertext or nonce in SQLite causes AES-GCM authentication tag verification to fail immediately upon access."*

---

### Q4: *"How do you handle overlapping sensitive patterns during detection?"*
**Answer**:
> *"In [`detector.py`](backend/app/detector/detector.py), we implemented deterministic span resolution. When multiple regex patterns match overlapping text ranges (e.g. an API key inside a generic password match), our `_remove_overlaps` algorithm sorts candidates by span length first (longest match wins), and breaks ties by heuristic confidence score and position. This guarantees zero duplicate placeholders or mangled spans."*

---

### Q5: *"How do you validate Credit Cards to prevent false positives?"*
**Answer**:
> *"We do not just rely on matching 16 digits. In [`patterns.py`](backend/app/detector/patterns.py), our `luhn_checksum` function strips delimiters, checks length, excludes obvious false positives (such as sequences with all identical digits like `0000...` or zero prefixes), and calculates the modular-10 Luhn checksum. Only candidates that satisfy Luhn are classified as `CREDIT_CARD`."*

---

### Q6: *"Why did you keep audit logs when a document is deleted?"*
**Answer**:
> *"In security and compliance frameworks (such as SOC2, ISO 27001, and HIPAA), audit trails must be **append-only and immutable**. When a document is deleted, we remove the document and its encryption keys from the database, but we record a `DOCUMENT_DELETED` event in the audit log. This proves when and by whom the document was removed without retaining any of its sensitive content."*

---

### Q7: *"How is your codebase structured?"*
**Answer**:
> *"We followed **Clean Architecture principles**:
> - **API Layer (`main.py`)**: Thin controllers handling HTTP status codes, CORS, and Pydantic schemas.
> - **Service Layer (`services/`)**: Enforces business rules and RBAC permissions.
> - **Domain Engines (`detector/`, `encryption/`, `documents/`)**: Pure, testable logic for regex detection, AES-256-GCM, and file parsing.
> - **Repository Layer (`storage/`)**: Thread-safe SQLite access with parameterized queries that prevent SQL injection.
>
> *We have **46 unit and integration tests** passing with 100% test coverage across all security edge cases."*

---

## 4. Key Numbers to Remember

- **AES-256-GCM**: 256-bit keys, 96-bit random nonces (`os.urandom(12)`), 128-bit authentication tags.
- **Scrypt Parameters**: `n=16384`, `r=8`, `p=1`, 16-byte random salt.
- **File Upload Limits**: `.txt` (1 MB), `.docx` (10 MB), `.pdf` (10 MB).
- **Test Suite**: 46 automated Pytest tests, 0 failures.
- **Ports**: Backend on `8000`, Frontend on `5173`.
