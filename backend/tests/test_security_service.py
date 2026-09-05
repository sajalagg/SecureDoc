import pytest

from app.audit.logger import AuditAction
from app.auth.auth import AuthorizationError, Role
from app.encryption.crypto import encode_key, generate_key
from app.encryption.key_manager import MASTER_KEY_ENVIRONMENT_VARIABLE
from app.services.security_service import authenticate_user, create_document, decrypt_document_as_admin, register_user
from app.storage.repository import SQLiteRepository


def test_password_hash_login_roles_and_safe_audit_log(tmp_path, monkeypatch):
    monkeypatch.setenv(MASTER_KEY_ENVIRONMENT_VARIABLE, encode_key(generate_key()))
    repository = SQLiteRepository(tmp_path / "securedoc.db")
    admin = register_user(repository, "admin", "AdminPass123", Role.ADMIN)
    user = register_user(repository, "student", "StudentPass123", Role.USER)
    assert authenticate_user(repository, "admin", "wrong-password") is None
    assert authenticate_user(repository, "admin", "AdminPass123") == admin
    create_document(repository, user, "document-1", "Password: MyPassword123\n")
    with pytest.raises(AuthorizationError):
        decrypt_document_as_admin(repository, user, "document-1")
    assert decrypt_document_as_admin(repository, admin, "document-1") == "Password: MyPassword123\n"
    audit_text = str(repository.get_audit_records("document-1"))
    assert AuditAction.ACCESS_DENIED.value in audit_text
    assert "MyPassword123" not in audit_text
    assert "StudentPass123" not in audit_text
    repository.close()


def test_sqlite_stores_only_protected_document_data(tmp_path, monkeypatch):
    monkeypatch.setenv(MASTER_KEY_ENVIRONMENT_VARIABLE, encode_key(generate_key()))
    repository = SQLiteRepository(tmp_path / "securedoc.db")
    user = register_user(repository, "owner", "OwnerPass123", Role.USER)
    create_document(repository, user, "document-2", "Password: secret-value\n")
    stored = repository.get_document("document-2")
    assert "secret-value" not in stored.document.protected_text
    assert "secret-value" not in str(stored.document.metadata())
    repository.close()
