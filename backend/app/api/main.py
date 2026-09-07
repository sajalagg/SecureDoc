"""FastAPI application factory with thin, authenticated route handlers."""

import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from app.auth.auth import AuthorizationError, Role, User
from app.auth.tokens import TokenError, create_access_token, read_access_token
from app.documents.adapters import DocumentFormatError, TextDocumentAdapter, read_document_file
from app.services.document_service import redact_document, scan_document
from app.services.security_service import (
    authenticate_user, create_document, decrypt_document_as_admin,
    get_audit_for_document_as_admin, get_document_for_user, get_masked_document_for_user,
    list_documents_for_user, register_user,
)
from app.storage.repository import SQLiteRepository


def _load_env_if_present() -> None:
    """Load default configuration from .env if present in root or parent directories."""
    for candidate in (Path(".env"), Path(__file__).resolve().parent.parent.parent.parent / ".env"):
        if candidate.is_file():
            for line in candidate.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ.setdefault(key.strip(), val.strip())
            break


_load_env_if_present()


class RegisterRequest(BaseModel):
    """Public registration input. Public callers may create USER accounts only."""

    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=256)


class LoginRequest(RegisterRequest):
    """Credentials accepted by the login route."""


class TokenResponse(BaseModel):
    """A short-lived bearer token response."""

    access_token: str
    token_type: str = "bearer"


class DocumentCreateRequest(BaseModel):
    """Plain text submitted for selective protection."""

    text: str = Field(min_length=1)
    document_id: Optional[str] = Field(default=None, min_length=1, max_length=128)


class ScanRequest(BaseModel):
    """Plain text supplied for detection preview without database persistence."""

    text: str = Field(min_length=1)


def _document_response(document, user: Optional[User] = None) -> Dict[str, Any]:
    """Return protected data and metadata; masked text is provided for safe USER reading."""
    masked = redact_document(document)
    return {
        "document_id": document.document_id,
        "protected_text": document.protected_text,
        "masked_text": masked,
        "text": masked if (user and user.role == Role.USER) else document.protected_text,
        "metadata": document.metadata(),
    }


def create_app(database_path: Optional[Path] = None) -> FastAPI:
    """Build the API with a chosen SQLite location, useful for tests and deployment."""
    repository = SQLiteRepository(database_path or Path(os.environ.get("SECUREDOC_DATABASE_PATH", "securedoc.db")))
    app = FastAPI(title="SecureDoc API", version="0.1.0")
    # Exposed for controlled application setup and integration tests, not routes.
    app.state.repository = repository
    bearer_scheme = HTTPBearer(auto_error=False)

    def current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> User:
        """Verify Bearer authentication and reload the user from SQLite."""
        if credentials is None:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Bearer authentication is required.")
        try:
            user_id = read_access_token(credentials.credentials)
        except TokenError:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired access token.")
        user = repository.get_user_by_id(user_id)
        if user is None:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User no longer exists.")
        return user

    @app.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
    def register(request: RegisterRequest):
        """Register a USER and immediately return a signed bearer token."""
        try:
            user = register_user(repository, request.username, request.password, Role.USER)
        except ValueError as error:
            raise HTTPException(status.HTTP_409_CONFLICT, str(error))
        return TokenResponse(access_token=create_access_token(user))

    @app.post("/auth/login", response_model=TokenResponse)
    def login(request: LoginRequest):
        """Authenticate credentials and issue a short-lived bearer token."""
        user = authenticate_user(repository, request.username, request.password)
        if user is None:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid username or password.")
        return TokenResponse(access_token=create_access_token(user))

    @app.post("/documents/scan")
    def scan(request: ScanRequest, user: User = Depends(current_user)):
        """Preview detection metadata without storing submitted text or plaintext values."""
        return {"detections": [detection.to_safe_dict() for detection in scan_document(request.text)]}

    @app.post("/documents", status_code=status.HTTP_201_CREATED)
    def protect(request: DocumentCreateRequest, user: User = Depends(current_user)):
        """Protect and store a new document owned by the authenticated user."""
        document_id = request.document_id or str(uuid4())
        try:
            document = create_document(repository, user, document_id, request.text)
        except ValueError as error:
            raise HTTPException(status.HTTP_409_CONFLICT, str(error))
        return _document_response(document)

    @app.post("/documents/upload", status_code=status.HTTP_201_CREATED)
    async def upload_and_protect(
        file: UploadFile = File(...),
        document_id: Optional[str] = Form(default=None),
        user: User = Depends(current_user),
    ):
        """Validate an uploaded document (.txt, .docx, .pdf), selectively protect it, and store."""
        filename = file.filename or "uploaded.txt"
        try:
            text = read_document_file(filename, await file.read())
        except DocumentFormatError as error:
            raise HTTPException(status_code=422, detail=str(error))
        try:
            document = create_document(repository, user, document_id or str(uuid4()), text, filename)
        except ValueError as error:
            raise HTTPException(status.HTTP_409_CONFLICT, str(error))
        return _document_response(document, user)

    @app.get("/documents")
    def list_documents(user: User = Depends(current_user)):
        """List documents visible to the current user without decrypting them."""
        return [_document_response(document, user) for document in list_documents_for_user(repository, user)]

    @app.get("/documents/{document_id}")
    def get_document(document_id: str, user: User = Depends(current_user)):
        """Retrieve document metadata and masked/protected text for authorized callers."""
        try:
            return _document_response(get_document_for_user(repository, user, document_id), user)
        except KeyError:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Document was not found.")
        except AuthorizationError as error:
            raise HTTPException(status.HTTP_403_FORBIDDEN, str(error))

    @app.get("/documents/{document_id}/redacted")
    def get_redacted(document_id: str, user: User = Depends(current_user)):
        """Retrieve document text with sensitive values masked/redacted for USER viewing."""
        try:
            return {"document_id": document_id, "text": get_masked_document_for_user(repository, user, document_id)}
        except KeyError:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Document was not found.")
        except AuthorizationError as error:
            raise HTTPException(status.HTTP_403_FORBIDDEN, str(error))

    @app.post("/documents/{document_id}/decrypt")
    def decrypt(document_id: str, user: User = Depends(current_user)):
        """Decrypt a document only after ADMIN role authorization succeeds."""
        try:
            return {"document_id": document_id, "text": decrypt_document_as_admin(repository, user, document_id)}
        except KeyError:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Document was not found.")
        except AuthorizationError as error:
            raise HTTPException(status.HTTP_403_FORBIDDEN, str(error))

    @app.get("/documents/{document_id}/audit")
    def audit(document_id: str, user: User = Depends(current_user)):
        """Return safe audit records for a document to ADMIN users only."""
        try:
            records = get_audit_for_document_as_admin(repository, user, document_id)
        except AuthorizationError as error:
            raise HTTPException(status.HTTP_403_FORBIDDEN, str(error))
        return {"records": [record.__dict__ for record in records]}

    return app


app = create_app()
