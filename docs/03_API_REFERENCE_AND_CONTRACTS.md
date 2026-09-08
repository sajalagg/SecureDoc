# 03 — API Reference & Data Contracts

All endpoints are hosted by FastAPI at `http://127.0.0.1:8000`. Interactive OpenAPI documentation is accessible at `http://127.0.0.1:8000/docs`.

---

## Authentication & Identity

### 1. `POST /auth/register`
Creates a new standard user account (`Role.USER`). Public callers cannot self-assign `Role.ADMIN`.
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "username": "alice",
    "password": "AlicePass123!"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "user": {
      "id": 5,
      "username": "alice",
      "role": "USER"
    }
  }
  ```
- **Errors**: `409 Conflict` if username already exists.

---

### 2. `POST /auth/login`
Authenticates existing credentials and returns a short-lived bearer token.
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "AdminPass123!"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "user": {
      "id": 4,
      "username": "admin",
      "role": "ADMIN"
    }
  }
  ```
- **Errors**: `401 Unauthorized` for invalid username or password.

---

### 3. `GET /auth/me`
Returns the identity and role of the current bearer token.
- **Auth**: Bearer Token (`USER` or `ADMIN`)
- **Headers**: `Authorization: Bearer <access_token>`
- **Response** (`200 OK`):
  ```json
  {
    "id": 4,
    "username": "admin",
    "role": "ADMIN"
  }
  ```
- **Errors**: `401 Unauthorized` if token is invalid or expired.

---

## Document Operations

### 4. `POST /documents/scan`
Previews pattern detection on submitted text without saving anything to disk.
- **Auth**: Bearer Token (`USER` or `ADMIN`)
- **Request Body**:
  ```json
  {
    "text": "Server: prod\nPassword: MyPassword123\nAPI Key: sk_live_abcdef123"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "detections": [
      {
        "type": "PASSWORD",
        "start": 23,
        "end": 36,
        "confidence_score": 0.95,
        "rule_name": "labeled_password_generic"
      },
      {
        "type": "API_KEY",
        "start": 46,
        "end": 62,
        "confidence_score": 0.99,
        "rule_name": "stripe_api_key"
      }
    ]
  }
  ```
*Note: The plaintext values are omitted from the response dictionary to prevent credential echoes in network monitors.*

---

### 5. `POST /documents`
Applies selective field-level AES-256-GCM envelope protection and persists the document.
- **Auth**: Bearer Token (`USER` or `ADMIN`)
- **Request Body**:
  ```json
  {
    "document_id": "optional-custom-id",
    "text": "Server: prod-db\nPassword: MySecretPassword123"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "document_id": "optional-custom-id",
    "protected_text": "Server: prod-db\nPassword: [SECUREDOC:b4f2...]",
    "masked_text": "Server: prod-db\nPassword: [REDACTED:PASSWORD]",
    "text": "Server: prod-db\nPassword: [REDACTED:PASSWORD]",
    "metadata": {
      "document_id": "optional-custom-id",
      "version": 1,
      "encrypted_spans": [
        {
          "id": "b4f2...",
          "placeholder": "[SECUREDOC:b4f2...]",
          "type": "PASSWORD",
          "original_start": 26,
          "original_end": 45,
          "ciphertext": "069EtXuZvwYSMe3Wu3/c",
          "nonce": "P4BLEDRmAIh7PBWw",
          "auth_tag": "Rr31Ev7ZQwr9UcQ65CsKWQ=="
        }
      ],
      "key_envelope": {
        "algorithm": "AES-256-GCM",
        "key_version": 1,
        "ciphertext": "NsqwEq4ZWEJlzwqHzreDV6COiZbNziOJQr0Wp4YMjyE=",
        "nonce": "cTrDWoN1MxvDleS2",
        "auth_tag": "A6Wechn1b8CnKNwivq50yw=="
      },
      "source_filename": "uploaded.txt"
    }
  }
  ```

---

### 6. `POST /documents/upload`
Uploads a document file (.txt, .docx, .pdf), extracts its text, applies selective protection, and stores it.
- **Auth**: Bearer Token (`USER` or `ADMIN`)
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: Binary file data (.txt ≤ 1 MB, .docx ≤ 10 MB, .pdf ≤ 10 MB)
  - `document_id`: Optional custom string
- **Response** (`201 Created`): Same schema as `POST /documents`.
- **Errors**: `422 Unprocessable Entity` if file format is invalid, corrupted, or scanned/image-only.

---

### 7. `GET /documents`
Lists documents visible to the current caller without decrypting anything.
- **Auth**: Bearer Token (`USER` or `ADMIN`)
- **Visibility**:
  - `USER`: Returns only documents owned by the caller.
  - `ADMIN`: Returns all documents across the system.
- **Response** (`200 OK`): Array of document summary objects.

---

### 8. `GET /documents/{document_id}`
Retrieves a specific document.
- **Auth**: Bearer Token (`USER` or `ADMIN`)
- **Visibility**:
  - `USER`: If owner, returns masked text (`[REDACTED:PASSWORD]`). If not owner, returns `403 Forbidden`.
  - `ADMIN`: Returns document metadata with protected representation (`[SECUREDOC:...]`).
- **Errors**: `404 Not Found`, `403 Forbidden`.

---

### 9. `POST /documents/{document_id}/decrypt`
ADMIN-only endpoint. Unwraps the cryptographic envelope using the master key and decrypts sensitive fragments into plaintext.
- **Auth**: Bearer Token (**`ADMIN` role strictly required**)
- **Response** (`200 OK`):
  ```json
  {
    "document_id": "demo-1",
    "text": "Server: production-01\nPassword: DemoPassword123!\nStatus: Active"
  }
  ```
- **Errors**:
  - `403 Forbidden`: Caller does not have `ADMIN` role.
  - `404 Not Found`: Document does not exist.
  - `422 Unprocessable Entity`: Authentication tag verification failed (tampered data or wrong key).

---

### 10. `GET /documents/{document_id}/audit`
ADMIN-only endpoint. Returns safe audit event trail for a document.
- **Auth**: Bearer Token (**`ADMIN` role strictly required**)
- **Response** (`200 OK`):
  ```json
  {
    "records": [
      {
        "timestamp": "2026-09-08 16:47:49",
        "user_id": 5,
        "document_id": "demo-1",
        "action": "DOCUMENT_CREATED",
        "result": "SUCCESS"
      },
      {
        "timestamp": "2026-09-08 16:47:49",
        "user_id": 4,
        "document_id": "demo-1",
        "action": "DOCUMENT_DECRYPTED",
        "result": "SUCCESS"
      }
    ]
  }
  ```
- **Errors**: `403 Forbidden` for non-admin callers.

---

### 11. `DELETE /documents/{document_id}`
ADMIN-only endpoint. Permanently deletes a document and its key envelope from storage. Audit logs are retained for compliance.
- **Auth**: Bearer Token (**`ADMIN` role strictly required**)
- **Response** (`200 OK`):
  ```json
  {
    "document_id": "demo-1",
    "deleted": true
  }
  ```
- **Errors**: `403 Forbidden`, `404 Not Found`.
