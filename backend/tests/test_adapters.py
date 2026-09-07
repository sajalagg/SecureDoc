import io
import pytest
from fastapi.testclient import TestClient

import docx
import pypdf
from app.api.main import create_app
from app.auth.auth import Role
from app.auth.tokens import AUTH_SECRET_ENVIRONMENT_VARIABLE, create_access_token
from app.documents.adapters import (
    DocxDocumentAdapter,
    DocumentFormatError,
    MAX_DOCX_FILE_BYTES,
    MAX_PDF_FILE_BYTES,
    PdfDocumentAdapter,
    get_adapter_for_filename,
    read_document_file,
)
from app.encryption.crypto import encode_key, generate_key
from app.encryption.key_manager import MASTER_KEY_ENVIRONMENT_VARIABLE
from app.services.security_service import register_user


def _make_docx_bytes(paragraphs=None, tables=None) -> bytes:
    doc = docx.Document()
    if paragraphs:
        for p in paragraphs:
            doc.add_paragraph(p)
    if tables:
        for table_data in tables:
            t = doc.add_table(rows=len(table_data), cols=len(table_data[0]))
            for r_idx, row in enumerate(table_data):
                for c_idx, val in enumerate(row):
                    t.cell(r_idx, c_idx).text = val
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def _make_pdf_bytes_with_text(text: str) -> bytes:
    # Build a compliant minimal PDF containing a text stream
    stream_content = f"BT\n/F1 12 Tf\n20 700 Td\n({text}) Tj\nET\n".encode("latin1")
    stream_len = len(stream_content)
    pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
        b"4 0 obj\n<< /Length " + str(stream_len).encode("ascii") + b" >>\nstream\n"
        + stream_content +
        b"endstream\nendobj\n"
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
        b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n"
        b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n500\n%%EOF"
    )
    return pdf


def test_docx_adapter_reads_paragraphs_and_tables():
    content = _make_docx_bytes(
        paragraphs=["Project Title", "Password: SecretDocxPassword123"],
        tables=[[["Field", "Value"], ["api_key", "sk_live_1234567890abcdefghij"]]],
    )
    text = DocxDocumentAdapter.read("test.docx", content)
    assert "Password: SecretDocxPassword123" in text
    assert "sk_live_1234567890abcdefghij" in text


def test_docx_adapter_write_and_roundtrip():
    original = "Line 1: Hello World\nLine 2: Password: MyPassword123"
    docx_bytes = DocxDocumentAdapter.write(original)
    extracted = DocxDocumentAdapter.read("written.docx", docx_bytes)
    assert "Line 1: Hello World" in extracted
    assert "Password: MyPassword123" in extracted


def test_docx_adapter_error_handling():
    with pytest.raises(DocumentFormatError, match="Only .docx"):
        DocxDocumentAdapter.read("file.txt", b"dummy")
    with pytest.raises(DocumentFormatError, match="at most"):
        DocxDocumentAdapter.read("file.docx", b"a" * (MAX_DOCX_FILE_BYTES + 1))
    with pytest.raises(DocumentFormatError, match="corrupted"):
        DocxDocumentAdapter.read("corrupt.docx", b"not a zip file at all")
    with pytest.raises(DocumentFormatError, match="no extractable text"):
        DocxDocumentAdapter.read("empty.docx", _make_docx_bytes(paragraphs=["   "]))


def test_pdf_adapter_reads_text():
    pdf_bytes = _make_pdf_bytes_with_text("Password: SecretPdf123")
    extracted = PdfDocumentAdapter.read("doc.pdf", pdf_bytes)
    assert "Password: SecretPdf123" in extracted


def test_pdf_adapter_rejects_wrong_extension_and_oversized():
    with pytest.raises(DocumentFormatError, match="Only .pdf"):
        PdfDocumentAdapter.read("doc.docx", b"data")
    with pytest.raises(DocumentFormatError, match="at most"):
        PdfDocumentAdapter.read("doc.pdf", b"data" * (MAX_PDF_FILE_BYTES + 1))


def test_pdf_adapter_handles_corrupted_pdf():
    with pytest.raises(DocumentFormatError, match="corrupted"):
        PdfDocumentAdapter.read("bad.pdf", b"%PDF-invalid bytes without structure")


def test_pdf_adapter_rejects_encrypted_pdf():
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=100, height=100)
    writer.encrypt("supersecret")
    buf = io.BytesIO()
    writer.write(buf)
    with pytest.raises(DocumentFormatError, match="Encrypted or password-protected"):
        PdfDocumentAdapter.read("locked.pdf", buf.getvalue())


def test_pdf_adapter_handles_scanned_or_empty_pdf():
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=100, height=100)
    buf = io.BytesIO()
    writer.write(buf)
    with pytest.raises(DocumentFormatError, match="Scanned or image-only"):
        PdfDocumentAdapter.read("scanned.pdf", buf.getvalue())


def test_adapter_registry_dispatch():
    assert get_adapter_for_filename("notes.txt") is not None
    assert get_adapter_for_filename("report.DOCX") is DocxDocumentAdapter
    assert get_adapter_for_filename("paper.Pdf") is PdfDocumentAdapter
    with pytest.raises(DocumentFormatError, match="Unsupported file format"):
        get_adapter_for_filename("script.sh")

    # read_document_file dispatching
    txt_content = b"Password: PassInTxt123\n"
    assert "Password: PassInTxt123" in read_document_file("a.txt", txt_content)


def test_api_upload_docx_and_pdf(tmp_path, monkeypatch):
    monkeypatch.setenv(MASTER_KEY_ENVIRONMENT_VARIABLE, encode_key(generate_key()))
    monkeypatch.setenv(AUTH_SECRET_ENVIRONMENT_VARIABLE, "a-valid-signing-secret-with-32b!")
    app = create_app(tmp_path / "upload_test.db")
    client = TestClient(app)

    token = client.post("/auth/register", json={"username": "uploader", "password": "UserPass123"}).json()["access_token"]
    user_headers = {"Authorization": f"Bearer {token}"}

    admin = register_user(app.state.repository, "admin_up", "AdminPass123", Role.ADMIN)
    admin_headers = {"Authorization": f"Bearer {create_access_token(admin)}"}

    # 1. Upload DOCX
    docx_data = _make_docx_bytes(paragraphs=["Server: internal-srv", "Password: DocxSecretPassword99"])
    docx_res = client.post(
        "/documents/upload",
        headers=user_headers,
        data={"document_id": "uploaded-docx"},
        files={"file": ("report.docx", docx_data, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert docx_res.status_code == 201
    assert "DocxSecretPassword99" not in str(docx_res.json())
    assert docx_res.json()["metadata"]["source_filename"] == "report.docx"

    # Admin decrypts DOCX
    dec_docx = client.post("/documents/uploaded-docx/decrypt", headers=admin_headers)
    assert dec_docx.status_code == 200
    assert "DocxSecretPassword99" in dec_docx.json()["text"]

    # 2. Upload PDF
    pdf_data = _make_pdf_bytes_with_text("Password: PdfSecretPassword88")
    pdf_res = client.post(
        "/documents/upload",
        headers=user_headers,
        data={"document_id": "uploaded-pdf"},
        files={"file": ("document.pdf", pdf_data, "application/pdf")},
    )
    assert pdf_res.status_code == 201
    assert "PdfSecretPassword88" not in str(pdf_res.json())
    assert pdf_res.json()["metadata"]["source_filename"] == "document.pdf"

    # Admin decrypts PDF
    dec_pdf = client.post("/documents/uploaded-pdf/decrypt", headers=admin_headers)
    assert dec_pdf.status_code == 200
    assert "PdfSecretPassword88" in dec_pdf.json()["text"]

    # 3. Reject unsupported upload
    unsupported_res = client.post(
        "/documents/upload",
        headers=user_headers,
        files={"file": ("image.png", b"\x89PNG\r\n\x1a\n", "image/png")},
    )
    assert unsupported_res.status_code == 422
    assert "Unsupported file format" in unsupported_res.json()["detail"]
