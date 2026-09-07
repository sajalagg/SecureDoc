# SecureDoc

Backend-only college project for selectively encrypting sensitive fragments in a
document while preserving normal text.

## Milestone: run locally

Create an isolated environment and install the declared packages:

```bash
# macOS/Linux:
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
python -m pytest -v

# Windows PowerShell:
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
python -m pytest -v
```

For the master-key workflow, generate a local value using the command in
`.env.example`, copy it to an ignored `.env` file, and expose it to your shell or
future application configuration as `SECUREDOC_MASTER_KEY_BASE64`. Do not commit
that value.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the architecture, security decisions, public
functions, and specifications.

## Run the API locally

Set `SECUREDOC_MASTER_KEY_BASE64` and a 32+ character `SECUREDOC_AUTH_SECRET`
from `.env.example` in your environment, then bootstrap the initial administrator:

```bash
# macOS/Linux:
PYTHONPATH=backend python -m app.bootstrap_admin
PYTHONPATH=backend uvicorn app.api.main:app --reload

# Windows PowerShell:
$env:PYTHONPATH="backend"
python -m app.bootstrap_admin
uvicorn app.api.main:app --reload
```

Open `http://127.0.0.1:8000/docs` to use FastAPI's interactive Swagger UI.

## Document Uploads (TXT, DOCX, PDF)

After authorizing in `/docs`, use `POST /documents/upload`. Provide a file (`.txt`, `.docx`, or `.pdf`) and an optional `document_id`.
- `.txt`: Valid UTF-8 plain text (up to 1 MB).
- `.docx`: Microsoft Word documents with text extracted from paragraphs and tables (up to 10 MB).
- `.pdf`: Standard unencrypted PDF documents with text extracted across pages (up to 10 MB). Scanned or image-only PDFs require OCR preprocessing before upload.

Uploaded documents are selectively encrypted, stored, and audited through the exact same pipeline as pasted plain text.
