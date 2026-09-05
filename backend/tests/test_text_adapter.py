import pytest

from app.documents.adapters import DocumentFormatError, MAX_TEXT_FILE_BYTES, TextDocumentAdapter


def test_txt_adapter_preserves_utf8_text_exactly():
    original = "Title: résumé\nPassword: Secret123\n"
    assert TextDocumentAdapter.read("notes.TXT", TextDocumentAdapter.write(original)) == original


def test_txt_adapter_rejects_wrong_extension_oversized_and_invalid_utf8():
    with pytest.raises(DocumentFormatError, match="Only .txt"):
        TextDocumentAdapter.read("notes.pdf", b"not a PDF")
    with pytest.raises(DocumentFormatError, match="at most"):
        TextDocumentAdapter.read("large.txt", b"a" * (MAX_TEXT_FILE_BYTES + 1))
    with pytest.raises(DocumentFormatError, match="UTF-8"):
        TextDocumentAdapter.read("bad.txt", b"\xff\xfe")
