"""Signed, expiring bearer tokens for the FastAPI layer."""

import os
from datetime import datetime, timedelta, timezone

import jwt

from app.auth.auth import Role, User

AUTH_SECRET_ENVIRONMENT_VARIABLE = "SECUREDOC_AUTH_SECRET"
TOKEN_ALGORITHM = "HS256"
TOKEN_LIFETIME_MINUTES = 30


class TokenError(ValueError):
    """Raised when a bearer token is missing, expired, malformed, or invalid."""


def _load_auth_secret() -> str:
    """Read the token-signing secret from configuration; never silently create one."""
    secret = os.environ.get(AUTH_SECRET_ENVIRONMENT_VARIABLE)
    if not secret:
        raise RuntimeError(f"{AUTH_SECRET_ENVIRONMENT_VARIABLE} is required for API authentication.")
    if len(secret.encode("utf-8")) < 32:
        raise RuntimeError(f"{AUTH_SECRET_ENVIRONMENT_VARIABLE} must be at least 32 bytes long.")
    return secret


def create_access_token(user: User) -> str:
    """Create a signed bearer token that expires after the configured short lifetime."""
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_LIFETIME_MINUTES)
    payload = {"sub": str(user.user_id), "role": user.role.value, "exp": expires_at}
    return jwt.encode(payload, _load_auth_secret(), algorithm=TOKEN_ALGORITHM)


def read_access_token(token: str) -> int:
    """Verify a bearer token and return its authenticated user ID."""
    try:
        payload = jwt.decode(token, _load_auth_secret(), algorithms=[TOKEN_ALGORITHM])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, TypeError, ValueError) as error:
        raise TokenError("Invalid or expired access token.") from error
