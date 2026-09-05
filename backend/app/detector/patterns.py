"""Regex rules used by the first, deliberately conservative detector."""

import re

# Captures only the value after an explicit password field name.  Requiring the
# label reduces false positives compared with trying to guess arbitrary words.
PASSWORD_FIELD = re.compile(
    r"(?im)^\s*(?:password|passwd|pwd)\s*[:=]\s*(?P<value>[^\s#;]+)"
)

# A common structured token is recognisable without a label.  The minimum body
# length prevents matching short example strings such as "sk_live_demo".
STRUCTURED_API_KEY = re.compile(r"\bsk_(?:live|test)_[A-Za-z0-9_-]{16,}\b")

# Generic API keys are accepted only when an explicit field label is present.
API_KEY_FIELD = re.compile(
    r"(?im)^\s*(?:api[-_ ]?key|apikey)\s*[:=]\s*(?P<value>[A-Za-z0-9_-]{16,})"
)

EMAIL = re.compile(r"\b[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+\b")

# Candidate only: the Luhn check in detector.py confirms whether it is plausible.
CARD_CANDIDATE = re.compile(r"(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)")

