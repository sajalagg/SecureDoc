"""Local master-key configuration and authenticated document-key wrapping."""

import base64
import os

from app.documents.models import WrappedDocumentKey
from app.encryption.crypto import decode_key, decrypt, encrypt, generate_key

MASTER_KEY_ENVIRONMENT_VARIABLE = "SECUREDOC_MASTER_KEY_BASE64"


def load_master_key() -> bytes:
    """Load the Base64 AES-256 master key from configuration, or fail explicitly."""
    encoded_key = os.environ.get(MASTER_KEY_ENVIRONMENT_VARIABLE)
    if not encoded_key:
        raise RuntimeError(f"{MASTER_KEY_ENVIRONMENT_VARIABLE} is required to access stored documents.")
    return decode_key(encoded_key)


def generate_document_key() -> bytes:
    """Generate a cryptographically random AES-256 key for one document."""
    return generate_key()


def _wrapping_associated_data(document_id: str, key_version: int) -> bytes:
    """Bind a key envelope to one document ID and envelope version."""
    return f"securedoc-key-envelope-v1|{document_id}|{key_version}".encode("utf-8")


def wrap_document_key(document_key: bytes, master_key: bytes, document_id: str, key_version: int = 1) -> WrappedDocumentKey:
    """Encrypt a document key with the master key using AES-256-GCM."""
    result = encrypt(document_key, master_key, _wrapping_associated_data(document_id, key_version))
    return WrappedDocumentKey(
        base64.b64encode(result.ciphertext).decode("ascii"),
        base64.b64encode(result.nonce).decode("ascii"),
        base64.b64encode(result.auth_tag).decode("ascii"),
        key_version=key_version,
    )


def unwrap_document_key(envelope: WrappedDocumentKey, master_key: bytes, document_id: str) -> bytes:
    """Authenticate and recover a document key from a stored encrypted envelope."""
    if envelope.algorithm != "AES-256-GCM":
        raise ValueError("Unsupported document-key envelope algorithm.")
    return decrypt(
        base64.b64decode(envelope.ciphertext_b64), master_key,
        base64.b64decode(envelope.nonce_b64), base64.b64decode(envelope.auth_tag_b64),
        _wrapping_associated_data(document_id, envelope.key_version),
    )
