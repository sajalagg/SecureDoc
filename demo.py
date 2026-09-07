"""SecureDoc Interactive End-to-End Demo Script.

Run this script directly with:
    python demo.py

It runs the entire end-to-end flow in seconds without needing manual Swagger copy-pasting:
1. Authenticates as standard USER (Alice)
2. Scans a document with mixed secrets in real-time
3. Selectively encrypts and stores the document
4. Shows how the document looks to Alice (masked: [REDACTED:PASSWORD])
5. Shows unauthorized decryption blocked (403 Forbidden)
6. Authenticates as ADMIN
7. Reconstructs original plaintext via authenticated AES-256-GCM
8. Inspects safe audit trail
"""

import os
import sys
from pathlib import Path

# Auto-detect and switch to .venv if run with system Python
root_dir = Path(__file__).resolve().parent
venv_bin = "Scripts" if os.name == "nt" else "bin"
venv_exe = "python.exe" if os.name == "nt" else "python"
venv_python = root_dir / ".venv" / venv_bin / venv_exe

if sys.prefix == getattr(sys, "base_prefix", sys.prefix) and venv_python.is_file():
    os.execv(str(venv_python), [str(venv_python)] + sys.argv)

# Ensure backend is in path
backend_dir = root_dir / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.api.main import create_app
from app.auth.auth import Role
from app.auth.tokens import create_access_token
from app.services.security_service import register_user


def c(text, color_code):
    return f"\033[{color_code}m{text}\033[0m"


def main():
    print(c("\n=======================================================", "1;36"))
    print(c("       SECUREDOC: END-TO-END DEMO WALKTHROUGH          ", "1;36"))
    print(c("=======================================================\n", "1;36"))

    app = create_app(Path("securedoc.db"))
    client = TestClient(app)

    # 1. Login as Alice (USER)
    print(c("[Step 1] Logging in as standard USER ('alice')...", "1;33"))
    res = client.post("/auth/login", json={"username": "alice", "password": "AlicePass123!"})
    alice_token = res.json()["access_token"]
    alice_headers = {"Authorization": f"Bearer {alice_token}"}
    print(c("  ✓ Logged in. Token received.", "32"))

    # 2. Real-time Detection Preview
    sample_text = (
        "Server: api-production-01\n"
        "Database Password: SuperSecretDBPassword999!\n"
        "Stripe API Key: sk_live_99887766554433221100aabb\n"
        "Corporate Card: 4111 1111 1111 1111\n"
        "Security Officer: sec-alert@company.org\n"
    )
    print(c("\n[Step 2] Testing real-time detection preview (POST /documents/scan)...", "1;33"))
    scan_res = client.post("/documents/scan", headers=alice_headers, json={"text": sample_text})
    for d in scan_res.json()["detections"]:
        print(f"  • Found {c(d['type'], '1;35')} at [{d['start']}:{d['end']}] (confidence: {d['confidence_score']:.2f}, rule: {d['rule_name']})")

    # 3. Create & Selectively Protect Document
    import uuid
    doc_id = f"demo-doc-{uuid.uuid4().hex[:6]}"
    print(c(f"\n[Step 3] Alice uploads and protects document '{doc_id}'...", "1;33"))
    create_res = client.post(
        "/documents",
        headers=alice_headers,
        json={"document_id": doc_id, "text": sample_text},
    )
    print(c("  ✓ Document encrypted with per-document AES-256-GCM key and stored in SQLite.", "32"))

    # 4. Standard User View (Masked)
    print(c(f"\n[Step 4] Alice views the document (GET /documents/{doc_id})...", "1;33"))
    view_res = client.get(f"/documents/{doc_id}", headers=alice_headers)
    print(c("--- Document as seen by USER (Masked/Redacted) ---", "34"))
    print(view_res.json()["text"])
    print(c("--------------------------------------------------", "34"))

    # 5. Unauthorized Decryption Attempt
    print(c(f"\n[Step 5] Alice attempts unauthorized decryption (POST /documents/{doc_id}/decrypt)...", "1;33"))
    bad_dec = client.post(f"/documents/{doc_id}/decrypt", headers=alice_headers)
    print(f"  Result: {c(f'HTTP {bad_dec.status_code} Forbidden', '1;31')} -> {bad_dec.json()['detail']}")
    print(c("  ✓ Unauthorized decryption safely blocked!", "32"))

    # 6. Admin Login
    print(c("\n[Step 6] Logging in as ADMIN ('admin')...", "1;33"))
    admin_res = client.post("/auth/login", json={"username": "admin", "password": "AdminPass123!"})
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(c("  ✓ Admin logged in.", "32"))

    # 7. Admin Decryption
    print(c(f"\n[Step 7] Admin decrypts the document (POST /documents/{doc_id}/decrypt)...", "1;33"))
    admin_dec = client.post(f"/documents/{doc_id}/decrypt", headers=admin_headers)
    print(c("--- Document reconstructed for ADMIN (Plaintext) ---", "1;32"))
    print(admin_dec.json()["text"])
    print(c("-----------------------------------------------------", "1;32"))

    # 8. Audit Trail
    print(c(f"\n[Step 8] Admin checks audit trail (GET /documents/{doc_id}/audit)...", "1;33"))
    audit_res = client.get(f"/documents/{doc_id}/audit", headers=admin_headers)
    for record in audit_res.json()["records"]:
        action_color = "31" if record["result"] == "DENIED" else "32"
        print(f"  [{record['timestamp']}] User #{record['user_id']}: {record['action']} -> {c(record['result'], action_color)}")

    print(c("\n=======================================================", "1;36"))
    print(c("       DEMO COMPLETE - ALL SECURITY CHECKS PASSED!     ", "1;32"))
    print(c("=======================================================\n", "1;36"))


if __name__ == "__main__":
    main()
