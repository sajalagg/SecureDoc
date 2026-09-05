"""The small, UI-agnostic public entry point for Milestone 1."""

from app.detector.detector import detect_sensitive_data
from app.documents.models import ProtectedDocument
from app.documents.protector import protect_text
from app.documents.reconstruction import reconstruct_text


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

