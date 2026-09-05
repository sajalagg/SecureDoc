"""Password hashing and the deliberately small authorization policy."""

import base64
import os
from dataclasses import dataclass
from enum import Enum

from cryptography.exceptions import InvalidKey
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt


class Role(str, Enum):
    """Roles available in the prototype."""

    ADMIN = "ADMIN"
    USER = "USER"


class AuthorizationError(PermissionError):
    """Raised when an authenticated user lacks permission for an action."""


@dataclass(frozen=True)
class User:
    """Safe user identity returned after registration or authentication."""

    user_id: int
    username: str
    role: Role


def hash_password(password: str) -> str:
    """Hash a password with salted scrypt; never store or log the password itself."""
    if len(password) < 8:
        raise ValueError("Passwords must contain at least 8 characters.")
    salt = os.urandom(16)
    derived_key = Scrypt(salt=salt, length=32, n=2**14, r=8, p=1).derive(password.encode("utf-8"))
    return "scrypt$16384$8$1${}${}".format(
        base64.b64encode(salt).decode("ascii"), base64.b64encode(derived_key).decode("ascii")
    )


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify a password against the stored scrypt format using constant-time comparison."""
    try:
        algorithm, n, r, p, encoded_salt, encoded_expected = stored_hash.split("$")
        if algorithm != "scrypt":
            return False
        expected = base64.b64decode(encoded_expected)
        verifier = Scrypt(salt=base64.b64decode(encoded_salt), length=len(expected), n=int(n), r=int(r), p=int(p))
        verifier.verify(password.encode("utf-8"), expected)
        return True
    except (ValueError, TypeError, UnicodeError, InvalidKey):
        return False


def require_admin(user: User) -> None:
    """Allow decrypt operations only for an authenticated ADMIN user."""
    if user.role is not Role.ADMIN:
        raise AuthorizationError("Only ADMIN users may decrypt sensitive document content.")
