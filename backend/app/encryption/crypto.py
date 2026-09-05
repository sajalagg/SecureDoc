"""Small, auditable AES-256-GCM wrapper built on the cryptography library."""

import base64
import os
from dataclasses import dataclass

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

KEY_BYTES = 32
NONCE_BYTES = 12
TAG_BYTES = 16


class DecryptionError(Exception):
    """Raised when AES-GCM authentication fails or encrypted input is invalid."""


@dataclass(frozen=True)
class EncryptionResult:
    """Binary output of one AES-256-GCM operation."""

    ciphertext: bytes
    nonce: bytes
    auth_tag: bytes


def generate_key() -> bytes:
    """Generate a cryptographically random 256-bit AES key."""
    return AESGCM.generate_key(bit_length=256)


def encode_key(key: bytes) -> str:
    """Encode a 32-byte key for an environment variable; never log the result."""
    _validate_key(key)
    return base64.urlsafe_b64encode(key).decode("ascii")


def decode_key(encoded_key: str) -> bytes:
    """Decode and validate a Base64-encoded AES-256 key from configuration."""
    try:
        key = base64.urlsafe_b64decode(encoded_key.encode("ascii"))
    except Exception as error:
        raise ValueError("Document key must be valid URL-safe Base64.") from error
    _validate_key(key)
    return key


def _validate_key(key: bytes) -> None:
    """Reject anything other than a 32-byte AES-256 key."""
    if not isinstance(key, bytes) or len(key) != KEY_BYTES:
        raise ValueError("AES-256-GCM requires exactly a 32-byte key.")


def encrypt(plaintext: bytes, key: bytes, associated_data: bytes) -> EncryptionResult:
    """Encrypt bytes with AES-256-GCM and a fresh, random 96-bit nonce.

    Associated data is authenticated but not encrypted.  SecureDoc uses it to
    bind a fragment to its document ID, fragment ID, and detected type.
    """
    _validate_key(key)
    nonce = os.urandom(NONCE_BYTES)
    encrypted_with_tag = AESGCM(key).encrypt(nonce, plaintext, associated_data)
    return EncryptionResult(encrypted_with_tag[:-TAG_BYTES], nonce, encrypted_with_tag[-TAG_BYTES:])


def decrypt(ciphertext: bytes, key: bytes, nonce: bytes, auth_tag: bytes, associated_data: bytes) -> bytes:
    """Verify and decrypt an AES-GCM fragment, or raise ``DecryptionError``."""
    _validate_key(key)
    if len(nonce) != NONCE_BYTES or len(auth_tag) != TAG_BYTES:
        raise DecryptionError("Encrypted fragment has an invalid nonce or authentication tag.")
    try:
        return AESGCM(key).decrypt(nonce, ciphertext + auth_tag, associated_data)
    except InvalidTag as error:
        raise DecryptionError("Encrypted fragment failed authentication.") from error

