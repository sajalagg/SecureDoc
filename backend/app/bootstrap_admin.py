"""Local-only command to create the first SecureDoc ADMIN account."""

import getpass
import os
import sys
from pathlib import Path

# Ensure backend root is in sys.path when script is run directly
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.auth.auth import Role
from app.services.security_service import register_user
from app.storage.repository import SQLiteRepository


def main() -> None:
    """Prompt for administrator credentials without echoing the password to a terminal."""
    username = input("Admin username: ").strip()
    password = getpass.getpass("Admin password: ")
    repository = SQLiteRepository(Path(os.environ.get("SECUREDOC_DATABASE_PATH", "securedoc.db")))
    try:
        user = register_user(repository, username, password, Role.ADMIN)
        print(f"Created ADMIN user '{user.username}' (ID {user.user_id}).")
    finally:
        repository.close()


if __name__ == "__main__":
    main()
