"""Application use cases joining authentication, storage, audit, and crypto."""

from app.audit.logger import AuditAction
from app.auth.auth import AuthorizationError, Role, User, hash_password, require_admin, verify_password
from app.services.document_service import decrypt_document_with_master_key, protect_document_with_master_key
from app.storage.repository import SQLiteRepository


def register_user(repository: SQLiteRepository, username: str, password: str, role: Role = Role.USER) -> User:
    """Create a user with a salted password hash and record a safe audit event."""
    user = repository.create_user(username, hash_password(password), role)
    repository.log_event(AuditAction.REGISTER_SUCCESS, "SUCCESS", user.user_id)
    return user


def authenticate_user(repository: SQLiteRepository, username: str, password: str):
    """Authenticate credentials and record success/failure without logging passwords."""
    record = repository.get_user_with_hash(username)
    if record is None or not verify_password(password, record[1]):
        repository.log_event(AuditAction.LOGIN_FAILURE, "FAILURE")
        return None
    repository.log_event(AuditAction.LOGIN_SUCCESS, "SUCCESS", record[0].user_id)
    return record[0]


def create_document(repository: SQLiteRepository, user: User, document_id: str, text: str):
    """Protect and store a document owned by the authenticated user."""
    document = protect_document_with_master_key(text, document_id)
    repository.save_document(document, user.user_id)
    repository.log_event(AuditAction.DOCUMENT_CREATED, "SUCCESS", user.user_id, document_id)
    return document


def decrypt_document_as_admin(repository: SQLiteRepository, user: User, document_id: str) -> str:
    """Authorize an ADMIN, load a protected document, decrypt it, and audit access."""
    try:
        require_admin(user)
    except AuthorizationError:
        repository.log_event(AuditAction.ACCESS_DENIED, "DENIED", user.user_id, document_id)
        raise
    stored = repository.get_document(document_id)
    if stored is None:
        repository.log_event(AuditAction.DOCUMENT_ACCESSED, "NOT_FOUND", user.user_id, document_id)
        raise KeyError("Document was not found.")
    repository.log_event(AuditAction.DOCUMENT_ACCESSED, "SUCCESS", user.user_id, document_id)
    plaintext = decrypt_document_with_master_key(stored.document)
    repository.log_event(AuditAction.DOCUMENT_DECRYPTED, "SUCCESS", user.user_id, document_id)
    return plaintext
