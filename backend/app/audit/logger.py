"""Definitions for audit events; persistence lives in the repository layer."""

from enum import Enum


class AuditAction(str, Enum):
    """Events that are safe and useful to record without storing secrets."""

    REGISTER_SUCCESS = "REGISTER_SUCCESS"
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILURE = "LOGIN_FAILURE"
    DOCUMENT_CREATED = "DOCUMENT_CREATED"
    DOCUMENT_ACCESSED = "DOCUMENT_ACCESSED"
    DOCUMENT_DECRYPTED = "DOCUMENT_DECRYPTED"
    DOCUMENT_DELETED = "DOCUMENT_DELETED"
    ACCESS_DENIED = "ACCESS_DENIED"
