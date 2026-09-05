"""File-format adapters that convert files to and from SecureDoc's normalized text."""

from pathlib import Path

MAX_TEXT_FILE_BYTES = 1_000_000


class DocumentFormatError(ValueError):
    """Raised when an uploaded file is not a safe, supported UTF-8 text document."""


class TextDocumentAdapter:
    """Adapter for UTF-8 `.txt` files; DOCX/PDF adapters can follow this interface later."""

    supported_extension = ".txt"

    @classmethod
    def read(cls, filename: str, content: bytes) -> str:
        """Validate and decode an uploaded UTF-8 text file without altering its contents."""
        if Path(filename).suffix.lower() != cls.supported_extension:
            raise DocumentFormatError("Only .txt files are supported in this milestone.")
        if len(content) > MAX_TEXT_FILE_BYTES:
            raise DocumentFormatError(f"Text files must be at most {MAX_TEXT_FILE_BYTES:,} bytes.")
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError as error:
            raise DocumentFormatError("Text files must use UTF-8 encoding.") from error

    @classmethod
    def write(cls, text: str) -> bytes:
        """Encode reconstructed normalized text as UTF-8 for a future download endpoint."""
        return text.encode("utf-8")
