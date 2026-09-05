"""SQLite persistence for users, protected documents, and safe audit events."""

import json
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Union

from app.audit.logger import AuditAction
from app.auth.auth import Role, User
from app.documents.models import ProtectedDocument


@dataclass(frozen=True)
class StoredDocument:
    """A protected document plus its owner, as read from the repository."""

    owner_user_id: int
    document: ProtectedDocument


@dataclass(frozen=True)
class AuditRecord:
    """A safe audit record; never add plaintext or key fields to this model."""

    timestamp: str
    user_id: Optional[int]
    document_id: Optional[str]
    action: str
    result: str


class SQLiteRepository:
    """Small SQLite data-access layer that keeps SQL out of security services."""

    def __init__(self, database_path: Union[str, Path]):
        """Open a cross-platform SQLite database and ensure its schema exists."""
        self.connection = sqlite3.connect(str(Path(database_path)))
        self.connection.row_factory = sqlite3.Row
        self.connection.execute("PRAGMA foreign_keys = ON")
        self._create_schema()

    def close(self) -> None:
        """Close the underlying SQLite connection."""
        self.connection.close()

    def _create_schema(self) -> None:
        """Create the prototype tables if they do not already exist."""
        self.connection.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('ADMIN', 'USER')),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                owner_user_id INTEGER NOT NULL REFERENCES users(id),
                protected_text TEXT NOT NULL,
                metadata_json TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER REFERENCES users(id),
                document_id TEXT,
                action TEXT NOT NULL,
                result TEXT NOT NULL
            );
        """)
        self.connection.commit()

    def create_user(self, username: str, password_hash: str, role: Role) -> User:
        """Store a new user with an already-derived password hash."""
        try:
            cursor = self.connection.execute("INSERT INTO users(username, password_hash, role) VALUES (?, ?, ?)", (username, password_hash, role.value))
            self.connection.commit()
        except sqlite3.IntegrityError as error:
            raise ValueError("Username already exists.") from error
        return User(cursor.lastrowid, username, role)

    def get_user_with_hash(self, username: str):
        """Return the safe user and stored hash for authentication, or ``None``."""
        row = self.connection.execute("SELECT id, username, password_hash, role FROM users WHERE username = ?", (username,)).fetchone()
        if row is None:
            return None
        return User(row["id"], row["username"], Role(row["role"])), row["password_hash"]

    def save_document(self, document: ProtectedDocument, owner_user_id: int) -> None:
        """Store protected text and metadata only; plaintext never reaches this method."""
        self.connection.execute("INSERT INTO documents(id, owner_user_id, protected_text, metadata_json) VALUES (?, ?, ?, ?)", (document.document_id, owner_user_id, document.protected_text, json.dumps(document.metadata())))
        self.connection.commit()

    def get_document(self, document_id: str) -> Optional[StoredDocument]:
        """Load a protected document and reconstruct its typed metadata model."""
        row = self.connection.execute("SELECT owner_user_id, protected_text, metadata_json FROM documents WHERE id = ?", (document_id,)).fetchone()
        if row is None:
            return None
        return StoredDocument(row["owner_user_id"], ProtectedDocument.from_storage(document_id, row["protected_text"], json.loads(row["metadata_json"])))

    def log_event(self, action: AuditAction, result: str, user_id: Optional[int] = None, document_id: Optional[str] = None) -> None:
        """Persist a security event using IDs and outcomes only, never secret values."""
        self.connection.execute("INSERT INTO audit_logs(user_id, document_id, action, result) VALUES (?, ?, ?, ?)", (user_id, document_id, action.value, result))
        self.connection.commit()

    def get_audit_records(self, document_id: Optional[str] = None) -> List[AuditRecord]:
        """Return audit records for review, optionally limited to one document."""
        query = "SELECT timestamp, user_id, document_id, action, result FROM audit_logs"
        parameters = () if document_id is None else (document_id,)
        if document_id is not None:
            query += " WHERE document_id = ?"
        rows = self.connection.execute(query + " ORDER BY id", parameters).fetchall()
        return [AuditRecord(row["timestamp"], row["user_id"], row["document_id"], row["action"], row["result"]) for row in rows]
