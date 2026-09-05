"""Explainable regex-based sensitive-data detection for plain text."""

from typing import Iterable, List

from app.detector import patterns
from app.documents.models import Detection, SensitiveType


def is_luhn_valid(candidate: str) -> bool:
    """Return whether the digits in *candidate* pass the Luhn checksum.

    Spaces and hyphens are allowed in the input because card numbers are often
    formatted.  Luhn helps reduce false positives but does not prove a number is
    an issued or active payment card.
    """
    digits = "".join(character for character in candidate if character.isdigit())
    if not 13 <= len(digits) <= 19:
        return False
    total = 0
    for index, digit in enumerate(reversed(digits)):
        number = int(digit)
        if index % 2 == 1:
            number *= 2
            if number > 9:
                number -= 9
        total += number
    return total % 10 == 0


def _field_detections(text: str, expression, sensitive_type: SensitiveType, confidence: float, rule_name: str) -> Iterable[Detection]:
    """Yield value-only detections from a labelled regex with a ``value`` group."""
    for match in expression.finditer(text):
        start, end = match.span("value")
        yield Detection(sensitive_type, start, end, match.group("value"), confidence, rule_name)


def _remove_overlaps(detections: Iterable[Detection]) -> List[Detection]:
    """Choose deterministic non-overlapping detections, preferring specificity.

    Selective replacement cannot safely apply two detections to the same
    characters.  Longer values win first; equal spans prefer the higher
    confidence score, then rule name for deterministic results.
    """
    ordered = sorted(detections, key=lambda item: (-(item.end - item.start), -item.confidence_score, item.rule_name, item.start))
    accepted: List[Detection] = []
    for candidate in ordered:
        overlaps = any(candidate.start < chosen.end and chosen.start < candidate.end for chosen in accepted)
        if not overlaps:
            accepted.append(candidate)
    return sorted(accepted, key=lambda item: item.start)


def detect_sensitive_data(text: str) -> List[Detection]:
    """Find supported sensitive values and return exact, non-overlapping spans.

    The detector uses intentionally transparent rules.  Its scores are
    heuristics: 0.99 for an explicit password field, 0.98 for a valid Luhn card,
    0.95 for labelled API keys, 0.90 for structured API keys, and 0.85 for a
    syntactically valid email address.
    """
    candidates: List[Detection] = list(
        _field_detections(text, patterns.PASSWORD_FIELD, SensitiveType.PASSWORD, 0.99, "explicit_password_field")
    )
    candidates.extend(_field_detections(text, patterns.API_KEY_FIELD, SensitiveType.API_KEY, 0.95, "explicit_api_key_field"))
    candidates.extend(
        Detection(SensitiveType.API_KEY, match.start(), match.end(), match.group(), 0.90, "structured_sk_key")
        for match in patterns.STRUCTURED_API_KEY.finditer(text)
    )
    candidates.extend(
        Detection(SensitiveType.EMAIL, match.start(), match.end(), match.group(), 0.85, "email_syntax")
        for match in patterns.EMAIL.finditer(text)
    )
    for match in patterns.CARD_CANDIDATE.finditer(text):
        if is_luhn_valid(match.group()):
            candidates.append(Detection(SensitiveType.CREDIT_CARD, match.start(), match.end(), match.group(), 0.98, "luhn_valid_card"))
    return _remove_overlaps(candidates)

