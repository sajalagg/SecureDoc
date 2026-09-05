"""The small, UI-agnostic public entry point for Milestone 1."""

from dataclasses import replace

from app.detector.detector import detect_sensitive_data
from app.documents.models import ProtectedDocument
from app.documents.protector import protect_text
from app.documents.reconstruction import reconstruct_text
from app.encryption.key_manager import generate_document_key, load_master_key, unwrap_document_key, wrap_document_key


def scan_document(text: str):
    """Return exact sensitive-data detections for plain text.

    Callers that display detections should use ``Detection.to_safe_dict()`` so a
    preview does not accidentally reveal the sensitive value.
    """
    return detect_sensitive_data(text)


def protect_document(text: str, document_id: str, key: bytes) -> ProtectedDocument:
    """Scan then selectively encrypt a plain-text document using a document key."""
    return protect_text(text, document_id, scan_document(text), key)


def decrypt_document(protected_document: ProtectedDocument, key: bytes) -> str:
    """Reconstruct a protected document after AES-GCM verification succeeds."""
    return reconstruct_text(protected_document, key)


def protect_document_with_master_key(text: str, document_id: str, source_filename: str = None) -> ProtectedDocument:
    """Create a per-document key, protect text, and store only its encrypted envelope."""
    master_key = load_master_key()
    document_key = generate_document_key()
    protected = protect_document(text, document_id, document_key)
    return replace(protected, wrapped_document_key=wrap_document_key(document_key, master_key, document_id), source_filename=source_filename)


def decrypt_document_with_master_key(protected_document: ProtectedDocument) -> str:
    """Unwrap the document key then verify and reconstruct the protected document.

    A future authorization layer must approve the user before this function runs.
    """
    if protected_document.wrapped_document_key is None:
        raise ValueError("Protected document does not contain a wrapped document key.")
    document_key = unwrap_document_key(protected_document.wrapped_document_key, load_master_key(), protected_document.document_id)
    return decrypt_document(protected_document, document_key)
