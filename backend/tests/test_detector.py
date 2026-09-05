from app.detector.detector import detect_sensitive_data, is_luhn_valid
from app.documents.models import SensitiveType


def test_detects_password_value_with_exact_span():
    text = "Server password is MyPassword123\n"
    # Deliberately not detected: an explicit field label is required.
    assert detect_sensitive_data(text) == []

    text = "Password: MyPassword123\n"
    detection = detect_sensitive_data(text)[0]
    assert detection.sensitive_type == SensitiveType.PASSWORD
    assert text[detection.start:detection.end] == "MyPassword123"
    assert detection.confidence_score == 0.99


def test_detects_multiple_supported_types_without_overlaps():
    text = """password = hello@123
API-Key: abcdefghijklmnopQRSTUV
email: person@example.com
card: 4111 1111 1111 1111
"""
    detections = detect_sensitive_data(text)
    assert [item.sensitive_type for item in detections] == [
        SensitiveType.PASSWORD,
        SensitiveType.API_KEY,
        SensitiveType.EMAIL,
        SensitiveType.CREDIT_CARD,
    ]
    assert all(text[item.start:item.end] == item.value for item in detections)


def test_card_luhn_validation_reduces_false_positives():
    assert is_luhn_valid("4111 1111 1111 1111")
    assert not is_luhn_valid("4111 1111 1111 1112")
    text = "Reference 4111 1111 1111 1112 should stay visible."
    assert detect_sensitive_data(text) == []


def test_api_key_field_wins_over_structured_submatch():
    text = "api_key: sk_live_abcdefghijklmnop"
    detections = detect_sensitive_data(text)
    assert len(detections) == 1
    assert detections[0].rule_name == "explicit_api_key_field"


def test_safe_dictionary_does_not_contain_plaintext():
    detection = detect_sensitive_data("password: secret-value\n")[0]
    assert "secret-value" not in str(detection.to_safe_dict())

