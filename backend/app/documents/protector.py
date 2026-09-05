"""Convert detected spans into protected text and encrypted fragment metadata."""

import base64
import uuid
from typing import Iterable

from app.documents.models import Detection, EncryptedFragment, ProtectedDocument
from app.encryption.crypto import encrypt


def fragment_associated_data(document_id: str, fragment_id: str, detection: Detection) -> bytes:
    """Create stable AES-GCM associated data for one encrypted fragment.

    This prevents a valid fragment from being silently moved to a different
    document, fragment identifier, or sensitive-data category.
    """
    return f"securedoc-v1|{document_id}|{fragment_id}|{detection.sensitive_type.value}".encode("utf-8")


def protect_text(text: str, document_id: str, detections: Iterable[Detection], key: bytes) -> ProtectedDocument:
    """Encrypt each non-overlapping detection and replace it with a placeholder.

    The function validates that every detection actually corresponds to the
    supplied text.  This catches stale offsets before any protected result is
    produced.  It preserves every unencrypted character exactly.
    """
    sorted_detections = sorted(detections, key=lambda detection: detection.start)
    previous_end = 0
    protected_parts = []
    fragments = []
    for detection in sorted_detections:
        if detection.start < previous_end:
            raise ValueError("Detections must not overlap before protection.")
        if detection.start < 0 or detection.end > len(text) or text[detection.start:detection.end] != detection.value:
            raise ValueError("Detection span does not match the source text.")

        fragment_id = str(uuid.uuid4())
        placeholder = f"[SECUREDOC:{fragment_id}]"
        result = encrypt(
            detection.value.encode("utf-8"),
            key,
            fragment_associated_data(document_id, fragment_id, detection),
        )
        protected_parts.append(text[previous_end:detection.start])
        protected_parts.append(placeholder)
        fragments.append(
            EncryptedFragment(
                fragment_id=fragment_id,
                placeholder=placeholder,
                sensitive_type=detection.sensitive_type,
                original_start=detection.start,
                original_end=detection.end,
                ciphertext_b64=base64.b64encode(result.ciphertext).decode("ascii"),
                nonce_b64=base64.b64encode(result.nonce).decode("ascii"),
                auth_tag_b64=base64.b64encode(result.auth_tag).decode("ascii"),
            )
        )
        previous_end = detection.end
    protected_parts.append(text[previous_end:])
    return ProtectedDocument(document_id, "".join(protected_parts), fragments)

