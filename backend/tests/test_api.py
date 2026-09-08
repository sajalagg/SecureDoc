from fastapi.testclient import TestClient

from app.auth.auth import Role
from app.auth.tokens import AUTH_SECRET_ENVIRONMENT_VARIABLE
from app.encryption.crypto import encode_key, generate_key
from app.encryption.key_manager import MASTER_KEY_ENVIRONMENT_VARIABLE
from app.api.main import create_app
from app.services.security_service import register_user


def test_api_registration_scan_protection_and_admin_only_decryption(tmp_path, monkeypatch):
    monkeypatch.setenv(MASTER_KEY_ENVIRONMENT_VARIABLE, encode_key(generate_key()))
    monkeypatch.setenv(AUTH_SECRET_ENVIRONMENT_VARIABLE, "test-only-signing-secret-with-32-bytes")
    application = create_app(tmp_path / "api.db")
    client = TestClient(application)
    registration = client.post("/auth/register", json={"username": "student", "password": "StudentPass123"})
    assert registration.status_code == 201
    assert registration.json()["user"]["username"] == "student"
    assert registration.json()["user"]["role"] == "USER"
    student_headers = {"Authorization": f"Bearer {registration.json()['access_token']}"}
    me_resp = client.get("/auth/me", headers=student_headers)
    assert me_resp.status_code == 200
    assert me_resp.json() == {"id": registration.json()["user"]["id"], "username": "student", "role": "USER"}
    scan = client.post("/documents/scan", headers=student_headers, json={"text": "Password: MyPassword123"})
    assert scan.status_code == 200
    assert scan.json()["detections"][0]["type"] == "PASSWORD"
    assert "MyPassword123" not in str(scan.json())
    protected = client.post("/documents", headers=student_headers, json={"document_id": "api-doc", "text": "Password: MyPassword123"})
    assert protected.status_code == 201
    assert "MyPassword123" not in str(protected.json())
    assert client.post("/documents/api-doc/decrypt", headers=student_headers).status_code == 403

    # Admin bootstrap is an internal deployment action; public registration cannot choose ADMIN.
    admin = register_user(application.state.repository, "admin", "AdminPass123", Role.ADMIN)
    from app.auth.tokens import create_access_token
    admin_headers = {"Authorization": f"Bearer {create_access_token(admin)}"}
    decrypted = client.post("/documents/api-doc/decrypt", headers=admin_headers)
    assert decrypted.status_code == 200
    assert decrypted.json()["text"] == "Password: MyPassword123"
    audit = client.get("/documents/api-doc/audit", headers=admin_headers)
    assert audit.status_code == 200
    assert "MyPassword123" not in str(audit.json())
    assert client.get("/documents", headers=student_headers).status_code == 200


def test_api_rejects_missing_or_invalid_bearer_token(tmp_path, monkeypatch):
    monkeypatch.setenv(MASTER_KEY_ENVIRONMENT_VARIABLE, encode_key(generate_key()))
    monkeypatch.setenv(AUTH_SECRET_ENVIRONMENT_VARIABLE, "test-only-signing-secret-with-32-bytes")
    client = TestClient(create_app(tmp_path / "api.db"))
    assert client.get("/documents").status_code == 401
    assert client.get("/documents", headers={"Authorization": "Bearer invalid"}).status_code == 401


def test_api_uploads_and_protects_a_utf8_txt_file(tmp_path, monkeypatch):
    monkeypatch.setenv(MASTER_KEY_ENVIRONMENT_VARIABLE, encode_key(generate_key()))
    monkeypatch.setenv(AUTH_SECRET_ENVIRONMENT_VARIABLE, "test-only-signing-secret-with-32-bytes")
    client = TestClient(create_app(tmp_path / "api.db"))
    token = client.post("/auth/register", json={"username": "fileuser", "password": "FileUserPass123"}).json()["access_token"]
    response = client.post(
        "/documents/upload",
        headers={"Authorization": f"Bearer {token}"},
        data={"document_id": "file-doc"},
        files={"file": ("secrets.txt", b"Server: prod\nPassword: FilePassword123\n", "text/plain")},
    )
    assert response.status_code == 201
    assert "FilePassword123" not in str(response.json())
    assert response.json()["metadata"]["source_filename"] == "secrets.txt"
