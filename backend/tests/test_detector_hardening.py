import pytest

from app.detector.detector import detect_sensitive_data, is_luhn_valid
from app.documents.models import Detection, SensitiveType
from app.documents.protector import protect_text
from app.documents.reconstruction import reconstruct_text
from app.encryption.crypto import generate_key


def test_password_quoted_and_unquoted_variants():
    text = (
        'password: "quoted#secret;with spaces"\n'
        "passwd: 'single-quoted-pass'\n"
        "pwd: unquoted_secret\n"
        "client_secret = my_client_secret_99\n"
        "db_password: pass.with.dots.\n"
    )
    detections = detect_sensitive_data(text)
    values = [d.value for d in detections]
    assert "quoted#secret;with spaces" in values
    assert "single-quoted-pass" in values
    assert "unquoted_secret" in values
    assert "my_client_secret_99" in values
    # Trailing dot should be stripped from unquoted value
    assert "pass.with.dots" in values
    assert all(d.sensitive_type == SensitiveType.PASSWORD for d in detections)
    assert all(text[d.start:d.end] == d.value for d in detections)


def test_credential_pair_detection():
    text = "username: alice, password: SecretAlicePassword123\nlogin='bob' & pwd='SecretBobPassword456'\n"
    detections = detect_sensitive_data(text)
    assert len(detections) == 2
    assert detections[0].value == "SecretAlicePassword123"
    assert detections[0].sensitive_type == SensitiveType.PASSWORD
    assert detections[1].value == "SecretBobPassword456"
    assert detections[1].sensitive_type == SensitiveType.PASSWORD
    assert all(text[d.start:d.end] == d.value for d in detections)


def test_structured_and_labeled_api_keys():
    text = (
        "stripe = sk_live_abcdef1234567890ABCDEF\n"
        "github: ghp_1234567890abcdefghijklmnopqrstuvwx\n"
        "gitlab: glpat-abcdefghijklmnopqrst1234\n"
        "aws: AKIAIOSFODNN7EXAMPLE\n"
        "slack = xoxb-1234567890-123456789012-abcdefghijklmnop\n"
        "auth: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0\n"
        "access_token: custom_token_abcdef1234567890\n"
    )
    detections = detect_sensitive_data(text)
    assert all(d.sensitive_type == SensitiveType.API_KEY for d in detections)
    rule_names = {d.rule_name for d in detections}
    assert "structured_sk_key" in rule_names
    assert "structured_github_token" in rule_names
    assert "structured_gitlab_token" in rule_names
    assert "structured_aws_key" in rule_names
    assert "structured_slack_token" in rule_names
    assert "bearer_token" in rule_names
    assert "explicit_api_key_field" in rule_names
    assert all(text[d.start:d.end] == d.value for d in detections)


def test_credit_card_luhn_and_false_positives():
    # Valid cards: Visa, Mastercard, Amex
    valid_visa = "4111 1111 1111 1111"
    valid_mc = "5500 0000 0000 0004"
    valid_amex = "3782-822463-10005"
    assert is_luhn_valid(valid_visa)
    assert is_luhn_valid(valid_mc)
    assert is_luhn_valid(valid_amex)

    # Invalid Luhn checks
    assert not is_luhn_valid("4111 1111 1111 1112")
    # All zeros
    assert not is_luhn_valid("0000 0000 0000 0000")
    # All ones
    assert not is_luhn_valid("1111 1111 1111 1111")
    # Starting with 0
    assert not is_luhn_valid("0123 4567 8901 2344")

    text = f"""
Card 1: {valid_visa}
Card 2: {valid_mc}
Card 3: {valid_amex}
False positive date: 2026-09-07
False positive phone: +1-800-555-0199
False positive zeroes: 0000-0000-0000-0000
False positive reference: 4111 1111 1111 1112
"""
    detections = detect_sensitive_data(text)
    assert len(detections) == 3
    assert all(d.sensitive_type == SensitiveType.CREDIT_CARD for d in detections)
    detected_values = [d.value for d in detections]
    assert valid_visa in detected_values
    assert valid_mc in detected_values
    assert valid_amex in detected_values


def test_email_edge_cases_and_false_positives():
    text = (
        "Contact me at user.name+tag@sub.domain.example.com. "
        "Also support@service.io, or info@company.org;\n"
        "False positive: user@localhost\n"
        "False positive: hello@123\n"
    )
    detections = detect_sensitive_data(text)
    emails = [d.value for d in detections if d.sensitive_type == SensitiveType.EMAIL]
    assert "user.name+tag@sub.domain.example.com" in emails
    assert "support@service.io" in emails
    assert "info@company.org" in emails
    for email in emails:
        assert not email.endswith(".")
        assert not email.endswith(";")
    assert "user@localhost" not in emails
    assert "hello@123" not in emails


def test_adjacent_and_overlapping_matches():
    # Overlapping: explicit API key field wraps a structured token
    text_overlap = "api_key: sk_live_1234567890abcdefghij"
    overlap_dets = detect_sensitive_data(text_overlap)
    assert len(overlap_dets) == 1
    assert overlap_dets[0].rule_name == "explicit_api_key_field"

    # Password containing an email
    text_pass_email = "password: user@example.com"
    pass_email_dets = detect_sensitive_data(text_pass_email)
    assert len(pass_email_dets) == 1
    assert pass_email_dets[0].sensitive_type == SensitiveType.PASSWORD

    # Adjacent matches: two secrets with no characters between their spans
    # E.g., card number immediately followed by an API key candidate
    key1 = "4111 1111 1111 1111"
    key2 = "sk_live_1234567890abcdefghij"
    text_adjacent = f"[{key1}][{key2}]"
    adj_dets = detect_sensitive_data(text_adjacent)
    assert len(adj_dets) == 2
    assert adj_dets[0].value == key1
    assert adj_dets[1].value == key2

    # Verify protector and reconstruction handle adjacent detection spans with zero separation
    key = generate_key()
    raw_adjacent = key1 + key2
    dets_raw = [
        Detection(SensitiveType.CREDIT_CARD, 0, len(key1), key1, 0.98, "luhn_valid_card"),
        Detection(SensitiveType.API_KEY, len(key1), len(raw_adjacent), key2, 0.90, "structured_sk_key"),
    ]
    assert dets_raw[0].end == dets_raw[1].start
    protected = protect_text(raw_adjacent, "doc-adj", dets_raw, key)
    reconstructed = reconstruct_text(protected, key)
    assert reconstructed == raw_adjacent


def test_multiline_and_unicode():
    text = (
        "Server: prod-01\r\n"
        "Password: P@sswørd_ünicode_123!\r\n"
        "User: María\r\n"
        "email: maria.garcia@empresa.es\r\n"
        "api_key: sk_live_unicode_test_9876543210\r\n"
    )
    detections = detect_sensitive_data(text)
    assert len(detections) == 3
    types = [d.sensitive_type for d in detections]
    assert SensitiveType.PASSWORD in types
    assert SensitiveType.EMAIL in types
    assert SensitiveType.API_KEY in types
    pass_det = [d for d in detections if d.sensitive_type == SensitiveType.PASSWORD][0]
    assert pass_det.value == "P@sswørd_ünicode_123!"

    key = generate_key()
    protected = protect_text(text, "doc-unicode", detections, key)
    assert "P@sswørd_ünicode_123!" not in protected.protected_text
    assert "maria.garcia@empresa.es" not in protected.protected_text
    reconstructed = reconstruct_text(protected, key)
    assert reconstructed == text
