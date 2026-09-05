import pytest

from app.documents.models import EncryptedFragment, ProtectedDocument
from app.encryption.crypto import DecryptionError, generate_key
from app.services.document_service import decrypt_document, protect_document


def test_protection_changes_only_sensitive_values_and_reconstructs_exactly():
    text = """Server: production-01
Username: admin
Password: MyPassword123
Status: Active
email: admin@example.com
"""
    key = generate_key()
    protected = protect_document(text, "doc-001", key)
    assert "production-01" in protected.protected_text
    assert "MyPassword123" not in protected.protected_text
    assert "admin@example.com" not in protected.protected_text
    assert protected.protected_text.count("[SECUREDOC:") == 2
    assert decrypt_document(protected, key) == text


def test_repeated_identical_values_each_restore_in_own_position():
    text = "password: repeat123\npassword: repeat123\n"
    key = generate_key()
    protected = protect_document(text, "doc-repeat", key)
    assert len(protected.encrypted_fragments) == 2
    assert decrypt_document(protected, key) == text


def test_modified_metadata_or_wrong_key_causes_authenticated_failure():
    protected = protect_document("password: secret123\n", "doc-tamper", generate_key())
    key = generate_key()
    with pytest.raises(DecryptionError):
        decrypt_document(protected, key)
    real_key = generate_key()
    protected = protect_document("password: secret123\n", "doc-tamper", real_key)
    fragment = protected.encrypted_fragments[0]
    tampered = EncryptedFragment(
        fragment.fragment_id, fragment.placeholder, fragment.sensitive_type,
        fragment.original_start, fragment.original_end, fragment.ciphertext_b64,
        fragment.nonce_b64, fragment.auth_tag_b64[:-2] + "AA",
    )
    with pytest.raises(DecryptionError):
        decrypt_document(ProtectedDocument(protected.document_id, protected.protected_text, [tampered]), real_key)

