"""Typed data structures shared by the SecureDoc core.

These models deliberately keep sensitive values out of ``to_dict`` methods.  The
plaintext value is available only while the protection pipeline is running.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List


class SensitiveType(str, Enum):
    """Categories currently recognised by the rule-based detector."""

    PASSWORD = "PASSWORD"
    API_KEY = "API_KEY"
    CREDIT_CARD = "CREDIT_CARD"
    EMAIL = "EMAIL"


@dataclass(frozen=True)
class Detection:
    """One sensitive value found at an exact half-open text span.

    ``start`` is inclusive and ``end`` is exclusive, so
    ``text[start:end] == value``.  ``confidence_score`` is an explainable
    heuristic, not a calibrated probability.
    """

    sensitive_type: SensitiveType
    start: int
    end: int
    value: str
    confidence_score: float
    rule_name: str

    def to_safe_dict(self) -> Dict[str, object]:
        """Return metadata safe to expose in logs or ordinary API responses."""
        return {
            "type": self.sensitive_type.value,
            "start": self.start,
            "end": self.end,
            "confidence_score": self.confidence_score,
            "rule_name": self.rule_name,
        }


@dataclass(frozen=True)
class EncryptedFragment:
    """Encryption metadata for one placeholder in protected document text.

    Base64 strings make the binary encryption values safe to store as JSON later.
    The original span is retained for traceability; restoration uses the unique
    placeholder because replacing text changes subsequent character positions.
    """

    fragment_id: str
    placeholder: str
    sensitive_type: SensitiveType
    original_start: int
    original_end: int
    ciphertext_b64: str
    nonce_b64: str
    auth_tag_b64: str

    def to_dict(self) -> Dict[str, object]:
        """Return serializable metadata without revealing plaintext or a key."""
        return {
            "id": self.fragment_id,
            "placeholder": self.placeholder,
            "type": self.sensitive_type.value,
            "original_start": self.original_start,
            "original_end": self.original_end,
            "ciphertext": self.ciphertext_b64,
            "nonce": self.nonce_b64,
            "auth_tag": self.auth_tag_b64,
        }


@dataclass(frozen=True)
class ProtectedDocument:
    """Protected text and the metadata required to reconstruct it."""

    document_id: str
    protected_text: str
    encrypted_fragments: List[EncryptedFragment] = field(default_factory=list)

    def metadata(self) -> Dict[str, object]:
        """Return serializable metadata; encryption keys are never included."""
        return {
            "document_id": self.document_id,
            "version": 1,
            "encrypted_spans": [fragment.to_dict() for fragment in self.encrypted_fragments],
        }

