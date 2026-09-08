import pytest
from fastapi.testclient import TestClient

from app.api.main import create_app
from app.audit.logger import AuditAction
from app.auth.auth import AuthorizationError, Role
from app.auth.tokens import AUTH_SECRET_ENVIRONMENT_VARIABLE, create_access_token
from app.documents.models import EncryptedFragment, ProtectedDocument
from app.encryption.crypto import DecryptionError, encode_key, generate_key
from app.encryption.key_manager import MASTER_KEY_ENVIRONMENT_VARIABLE
from app.services.security_service import (
    create_document,
    decrypt_document_as_admin,
    get_audit_for_document_as_admin,
    get_document_for_user,
    get_masked_document_for_user,
    register_user,
)
from app.storage.repository import SQLiteRepository


def test_rbac_user_masked_access_and_admin_decryption(tmp_path, monkeypatch):
    master_key = generate_key()
    monkeypatch.setenv(MASTER_KEY_ENVIRONMENT_VARIABLE, encode_key(master_key))
    repository = SQLiteRepository(tmp_path / "rbac.db")

    admin = register_user(repository, "admin_user", "AdminPass123", Role.ADMIN)
    user = register_user(repository, "standard_user", "StandardPass123", Role.USER)

    original_text = (
        "Server: api.internal\n"
        "Password: SecretPass123!\n"
        "api_key: sk_live_1234567890abcdefghij\n"
        "contact: security@example.com\n"
    )
    doc = create_document(repository, user, "doc-rbac-1", original_text)

    # USER accesses document -> receives masked values
    user_doc = get_document_for_user(repository, user, "doc-rbac-1")
    assert user_doc.document_id == "doc-rbac-1"
    masked_text = get_masked_document_for_user(repository, user, "doc-rbac-1")
    assert "SecretPass123!" not in masked_text
    assert "sk_live_1234567890abcdefghij" not in masked_text
    assert "security@example.com" not in masked_text
    assert "[REDACTED:PASSWORD]" in masked_text
    assert "[REDACTED:API_KEY]" in masked_text
    assert "[REDACTED:EMAIL]" in masked_text
    assert "Server: api.internal" in masked_text

    # USER attempts decryption -> fails safely with AuthorizationError
    with pytest.raises(AuthorizationError):
        decrypt_document_as_admin(repository, user, "doc-rbac-1")

    # ADMIN can decrypt and reconstruct original text
    reconstructed = decrypt_document_as_admin(repository, admin, "doc-rbac-1")
    assert reconstructed == original_text

    # Verify audit trail
    audit_records = get_audit_for_document_as_admin(repository, admin, "doc-rbac-1")
    actions = [r.action for r in audit_records]
    assert AuditAction.DOCUMENT_CREATED.value in actions
    assert AuditAction.DOCUMENT_ACCESSED.value in actions
    assert AuditAction.ACCESS_DENIED.value in actions
    assert AuditAction.DOCUMENT_DECRYPTED.value in actions

    # No secrets in audit records
    for r in audit_records:
        assert "SecretPass123!" not in str(r)
        assert "sk_live_" not in str(r)

    repository.close()


def test_unauthorized_user_cannot_access_other_users_document(tmp_path, monkeypatch):
    master_key = generate_key()
    monkeypatch.setenv(MASTER_KEY_ENVIRONMENT_VARIABLE, encode_key(master_key))
    repository = SQLiteRepository(tmp_path / "rbac_isolation.db")

    alice = register_user(repository, "alice", "AlicePass123", Role.USER)
    bob = register_user(repository, "bob", "BobPass12345", Role.USER)

    create_document(repository, alice, "alice-doc", "Password: AliceSecret123\n")

    # Bob cannot access Alice's document
    with pytest.raises(AuthorizationError):
        get_document_for_user(repository, bob, "alice-doc")

    # Audit records ACCESS_DENIED for Bob
    admin = register_user(repository, "admin2", "AdminPass123", Role.ADMIN)
    records = get_audit_for_document_as_admin(repository, admin, "alice-doc")
    denied_events = [r for r in records if r.action == AuditAction.ACCESS_DENIED.value]
    assert len(denied_events) >= 1
    assert denied_events[0].user_id == bob.user_id

    # Non-admin cannot view audit records
    with pytest.raises(AuthorizationError):
        get_audit_for_document_as_admin(repository, bob, "alice-doc")

    repository.close()


def test_tampered_ciphertext_fails_decryption_and_logs_audit(tmp_path, monkeypatch):
    master_key = generate_key()
    monkeypatch.setenv(MASTER_KEY_ENVIRONMENT_VARIABLE, encode_key(master_key))
    repository = SQLiteRepository(tmp_path / "tamper.db")

    admin = register_user(repository, "admin_t", "AdminPass123", Role.ADMIN)
    doc = create_document(repository, admin, "tampered-doc", "Password: SecretPass123\n")

    # Tamper with the fragment ciphertext in SQLite
    frag = doc.encrypted_fragments[0]
    tampered_frag = EncryptedFragment(
        frag.fragment_id, frag.placeholder, frag.sensitive_type,
        frag.original_start, frag.original_end,
        frag.ciphertext_b64[:-4] + "AAAA",
        frag.nonce_b64, frag.auth_tag_b64,
    )
    tampered_doc = ProtectedDocument(
        doc.document_id, doc.protected_text, [tampered_frag],
        doc.wrapped_document_key, doc.source_filename,
    )
    # Save tampered document directly
    repository.connection.execute(
        "UPDATE documents SET metadata_json = ? WHERE id = ?",
        (__import__("json").dumps(tampered_doc.metadata()), "tampered-doc"),
    )
    repository.connection.commit()

    with pytest.raises(DecryptionError):
        decrypt_document_as_admin(repository, admin, "tampered-doc")

    records = get_audit_for_document_as_admin(repository, admin, "tampered-doc")
    decryption_events = [r for r in records if r.action == AuditAction.DOCUMENT_DECRYPTED.value]
    assert any(r.result == "FAILED" for r in decryption_events)

    repository.close()


def test_api_rbac_endpoints(tmp_path, monkeypatch):
    monkeypatch.setenv(MASTER_KEY_ENVIRONMENT_VARIABLE, encode_key(generate_key()))
    monkeypatch.setenv(AUTH_SECRET_ENVIRONMENT_VARIABLE, "signing-secret-with-32-chars-long!")
    app = create_app(tmp_path / "api_rbac.db")
    client = TestClient(app)

    reg_user = client.post("/auth/register", json={"username": "alice_u", "password": "UserPass123"}).json()
    user_headers = {"Authorization": f"Bearer {reg_user['access_token']}"}

    # User creates document
    create_res = client.post(
        "/documents",
        headers=user_headers,
        json={"document_id": "api-rbac-doc", "text": "Password: AliceSecret123\n"},
    )
    assert create_res.status_code == 201
    assert "AliceSecret123" not in str(create_res.json())

    # User fetches document -> text is masked
    doc_res = client.get("/documents/api-rbac-doc", headers=user_headers)
    assert doc_res.status_code == 200
    assert "[REDACTED:PASSWORD]" in doc_res.json()["masked_text"]
    assert doc_res.json()["text"] == doc_res.json()["masked_text"]

    # User fetches redacted endpoint
    redacted_res = client.get("/documents/api-rbac-doc/redacted", headers=user_headers)
    assert redacted_res.status_code == 200
    assert "[REDACTED:PASSWORD]" in redacted_res.json()["text"]

    # User cannot decrypt
    decrypt_res = client.post("/documents/api-rbac-doc/decrypt", headers=user_headers)
    assert decrypt_res.status_code == 403

    # User cannot view audit
    audit_res = client.get("/documents/api-rbac-doc/audit", headers=user_headers)
    assert audit_res.status_code == 403

    # Admin bootstrap & access
    admin = register_user(app.state.repository, "admin_api", "AdminPass123", Role.ADMIN)
    admin_headers = {"Authorization": f"Bearer {create_access_token(admin)}"}

    # Admin can decrypt
    admin_dec = client.post("/documents/api-rbac-doc/decrypt", headers=admin_headers)
    assert admin_dec.status_code == 200
    assert admin_dec.json()["text"] == "Password: AliceSecret123\n"

    # Admin can view audit
    admin_audit = client.get("/documents/api-rbac-doc/audit", headers=admin_headers)
    assert admin_audit.status_code == 200
    assert len(admin_audit.json()["records"]) >= 3

    # User cannot delete document
    user_del = client.delete("/documents/api-rbac-doc", headers=user_headers)
    assert user_del.status_code == 403

    # Admin deletes document
    admin_del = client.delete("/documents/api-rbac-doc", headers=admin_headers)
    assert admin_del.status_code == 200
    assert admin_del.json() == {"document_id": "api-rbac-doc", "deleted": True}

    # Document is now gone
    assert client.get("/documents/api-rbac-doc", headers=admin_headers).status_code == 404

    # Audit records are preserved and record DOCUMENT_DELETED
    post_delete_audit = client.get("/documents/api-rbac-doc/audit", headers=admin_headers)
    assert post_delete_audit.status_code == 200
    actions = [r["action"] for r in post_delete_audit.json()["records"]]
    assert "DOCUMENT_DELETED" in actions
