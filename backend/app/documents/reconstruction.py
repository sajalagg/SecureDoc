"""Authenticated reconstruction of selectively protected text."""

import base64

from app.documents.models import Detection, ProtectedDocument
from app.documents.protector import fragment_associated_data
from app.encryption.crypto import decrypt


def reconstruct_text(protected_document: ProtectedDocument, key: bytes) -> str:
    """Verify and replace every protected placeholder with its original value.

    Any changed ciphertext, tag, nonce, fragment type, document ID, or incorrect
    key causes ``DecryptionError``.  Missing or duplicated placeholders are also
    rejected, because silently returning a partial document would be unsafe.
    """
    reconstructed = protected_document.protected_text
    for fragment in protected_document.encrypted_fragments:
        if reconstructed.count(fragment.placeholder) != 1:
            raise ValueError("Protected text does not contain exactly one expected placeholder.")
        detection = Detection(
            fragment.sensitive_type,
            fragment.original_start,
            fragment.original_end,
            "",  # Only type is needed to reproduce authenticated associated data.
            0.0,
            "metadata",
        )
        plaintext = decrypt(
            base64.b64decode(fragment.ciphertext_b64),
            key,
            base64.b64decode(fragment.nonce_b64),
            base64.b64decode(fragment.auth_tag_b64),
            fragment_associated_data(protected_document.document_id, fragment.fragment_id, detection),
        ).decode("utf-8")
        reconstructed = reconstructed.replace(fragment.placeholder, plaintext, 1)
    return reconstructed


def redact_text(protected_document: ProtectedDocument, mask_format: str = "[REDACTED:{type}]") -> str:
    """Replace each protected placeholder with a safe masked/redacted label.

    Does not decrypt or require any encryption keys. Safe to expose to USER role.
    """
    redacted = protected_document.protected_text
    for fragment in protected_document.encrypted_fragments:
        replacement = mask_format.format(type=fragment.sensitive_type.value)
        redacted = redacted.replace(fragment.placeholder, replacement)
    return redacted

