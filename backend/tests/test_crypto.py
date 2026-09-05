import pytest

from app.encryption.crypto import DecryptionError, decrypt, encrypt, generate_key


def test_aes_gcm_round_trip_and_unique_nonces():
    key = generate_key()
    first = encrypt(b"secret", key, b"document-a")
    second = encrypt(b"secret", key, b"document-a")
    assert first.nonce != second.nonce
    assert decrypt(first.ciphertext, key, first.nonce, first.auth_tag, b"document-a") == b"secret"


def test_wrong_key_and_tampering_fail_safely():
    encrypted = encrypt(b"secret", generate_key(), b"context")
    with pytest.raises(DecryptionError):
        decrypt(encrypted.ciphertext, generate_key(), encrypted.nonce, encrypted.auth_tag, b"context")
    changed_ciphertext = encrypted.ciphertext[:-1] + bytes([encrypted.ciphertext[-1] ^ 1])
    with pytest.raises(DecryptionError):
        decrypt(changed_ciphertext, generate_key(), encrypted.nonce, encrypted.auth_tag, b"context")

