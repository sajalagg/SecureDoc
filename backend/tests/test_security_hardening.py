import base64
import os
import pytest
from fastapi.testclient import TestClient

from app.api.main import create_app
from app.auth.auth import hash_password, verify_password
from app.auth.tokens import AUTH_SECRET_ENVIRONMENT_VARIABLE, create_access_token, read_access_token, TokenError
from app.documents.models import EncryptedFragment, ProtectedDocument, WrappedDocumentKey
from app.documents.reconstruction import reconstruct_text
from app.encryption.crypto import (
    DecryptionError,
    decode_key,
    decrypt,
    encode_key,
    encrypt,
    generate_key,
)
from app.encryption.key_manager import (
    MASTER_KEY_ENVIRONMENT_VARIABLE,
    generate_document_key,
    unwrap_document_key,
    wrap_document_key,
)
from app.services.document_service import protect_document


def test_crypto_tampering_coverage():
    key = generate_key()
    data = b"confidential payload"
    aad = b"associated-auth-data"

    res = encrypt(data, key, aad)

    # 1. Tampered ciphertext
    bad_ct = bytearray(res.ciphertext)
    bad_ct[0] ^= 0xFF
    with pytest.raises(DecryptionError):
        decrypt(bytes(bad_ct), key, res.nonce, res.auth_tag, aad)

    # 2. Tampered auth tag
    bad_tag = bytearray(res.auth_tag)
    bad_tag[0] ^= 0xFF
    with pytest.raises(DecryptionError):
        decrypt(res.ciphertext, key, res.nonce, bytes(bad_tag), aad)

    # 3. Tampered nonce
    bad_nonce = bytearray(res.nonce)
    bad_nonce[0] ^= 0xFF
    with pytest.raises(DecryptionError):
        decrypt(res.ciphertext, key, bytes(bad_nonce), res.auth_tag, aad)

    # 4. Wrong key
    wrong_key = generate_key()
    with pytest.raises(DecryptionError):
        decrypt(res.ciphertext, wrong_key, res.nonce, res.auth_tag, aad)

    # 5. Mismatched associated data
    with pytest.raises(DecryptionError):
        decrypt(res.ciphertext, key, res.nonce, res.auth_tag, b"different-context")

    # 6. Invalid key length
    with pytest.raises(ValueError, match="32-byte key"):
        decrypt(res.ciphertext, b"short", res.nonce, res.auth_tag, aad)
    with pytest.raises(ValueError, match="32-byte key"):
        encrypt(data, b"short", aad)

    # 7. Invalid nonce or tag lengths
    with pytest.raises(DecryptionError, match="invalid nonce or authentication tag"):
        decrypt(res.ciphertext, key, b"badnonce", res.auth_tag, aad)
    with pytest.raises(DecryptionError, match="invalid nonce or authentication tag"):
        decrypt(res.ciphertext, key, res.nonce, b"badtag", aad)


def test_key_wrapping_tampering_and_mismatched_doc_id():
    master_key = generate_key()
    doc_key = generate_document_key()

    envelope = wrap_document_key(doc_key, master_key, "doc-orig")
    recovered = unwrap_document_key(envelope, master_key, "doc-orig")
    assert recovered == doc_key

    # Attempting to unwrap with a different doc_id must fail (AAD binding)
    with pytest.raises(DecryptionError):
        unwrap_document_key(envelope, master_key, "doc-stolen")

    # Tampered envelope ciphertext
    tampered_env = WrappedDocumentKey(
        ciphertext_b64=envelope.ciphertext_b64[:-4] + "AAAA",
        nonce_b64=envelope.nonce_b64,
        auth_tag_b64=envelope.auth_tag_b64,
    )
    with pytest.raises(DecryptionError):
        unwrap_document_key(tampered_env, master_key, "doc-orig")


def test_password_hashing_security():
    # Min length check
    with pytest.raises(ValueError, match="at least 8 characters"):
        hash_password("short")

    pw = "SuperSecurePassword123!"
    h1 = hash_password(pw)
    h2 = hash_password(pw)
    # Salts must be random, so hashes must differ
    assert h1 != h2
    assert verify_password(pw, h1)
    assert verify_password(pw, h2)
    assert not verify_password("WrongPassword123!", h1)

    # Corrupted / invalid hash formats fail safely
    assert not verify_password(pw, "invalid-hash-string")
    assert not verify_password(pw, "md5$123$456$salt$hash")
    assert not verify_password(pw, "scrypt$invalid$format$")


def test_reconstruction_integrity_errors():
    key = generate_key()
    doc = protect_document("Password: MySecret123\n", "doc-integ", key)
    assert len(doc.encrypted_fragments) == 1
    placeholder = doc.encrypted_fragments[0].placeholder

    # 1. Missing placeholder in protected text
    tampered_text = doc.protected_text.replace(placeholder, "REMOVED")
    bad_doc = ProtectedDocument(doc.document_id, tampered_text, doc.encrypted_fragments)
    with pytest.raises(ValueError, match="exactly one expected placeholder"):
        reconstruct_text(bad_doc, key)

    # 2. Duplicate placeholder in protected text
    duplicated_text = doc.protected_text + placeholder
    bad_doc2 = ProtectedDocument(doc.document_id, duplicated_text, doc.encrypted_fragments)
    with pytest.raises(ValueError, match="exactly one expected placeholder"):
        reconstruct_text(bad_doc2, key)


def test_api_malformed_inputs_and_auth_errors(tmp_path, monkeypatch):
    monkeypatch.setenv(MASTER_KEY_ENVIRONMENT_VARIABLE, encode_key(generate_key()))
    monkeypatch.setenv(AUTH_SECRET_ENVIRONMENT_VARIABLE, "32-bytes-long-secret-key-testing!")
    app = create_app(tmp_path / "hardening_api.db")
    client = TestClient(app)

    # 1. Registration with invalid password
    res = client.post("/auth/register", json={"username": "user1", "password": "123"})
    assert res.status_code == 422

    # 2. Empty document create
    reg = client.post("/auth/register", json={"username": "valid_user", "password": "ValidPassword123!"})
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    empty_res = client.post("/documents", headers=headers, json={"text": ""})
    assert empty_res.status_code == 422

    # 3. Invalid JWT token
    assert client.get("/documents", headers={"Authorization": "Bearer not-a-jwt"}).status_code == 401
    assert client.get("/documents", headers={"Authorization": "Bearer "}).status_code == 401

    # 4. Access non-existent document
    assert client.get("/documents/non-existent", headers=headers).status_code == 404
    assert client.get("/documents/non-existent/redacted", headers=headers).status_code == 404
