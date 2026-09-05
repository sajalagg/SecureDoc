import pytest

from app.encryption.crypto import DecryptionError, encode_key, generate_key
from app.encryption.key_manager import MASTER_KEY_ENVIRONMENT_VARIABLE, generate_document_key, load_master_key, unwrap_document_key, wrap_document_key
from app.services.document_service import decrypt_document_with_master_key, protect_document_with_master_key


def test_document_key_round_trip_and_cross_document_protection():
    master_key = generate_key()
    document_key = generate_document_key()
    envelope = wrap_document_key(document_key, master_key, "document-1")
    assert unwrap_document_key(envelope, master_key, "document-1") == document_key
    with pytest.raises(DecryptionError):
        unwrap_document_key(envelope, master_key, "document-2")


def test_master_key_must_be_explicitly_configured(monkeypatch):
    monkeypatch.delenv(MASTER_KEY_ENVIRONMENT_VARIABLE, raising=False)
    with pytest.raises(RuntimeError, match=MASTER_KEY_ENVIRONMENT_VARIABLE):
        load_master_key()


def test_service_stores_only_encrypted_document_key_metadata(monkeypatch):
    master_key = generate_key()
    monkeypatch.setenv(MASTER_KEY_ENVIRONMENT_VARIABLE, encode_key(master_key))
    original = "Password: MyPassword123\n"
    protected = protect_document_with_master_key(original, "document-service")
    assert "key_envelope" in protected.metadata()
    assert encode_key(master_key) not in str(protected.metadata())
    assert "MyPassword123" not in str(protected.metadata())
    assert decrypt_document_with_master_key(protected) == original
