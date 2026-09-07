"""Regex rules used by the first, deliberately conservative detector."""

import re

# Captures values from explicit password fields (unquoted or quoted).
PASSWORD_FIELD = re.compile(
    r"(?im)(?:^|[\s,;{(&])(?:password|passwd|pwd|pass|client_secret|db_password)\s*[:=]\s*"
    r"""(?:"(?P<qvalue>[^\r\n"]+)"|'(?P<sqvalue>[^\r\n']+)'|(?P<value>[^\s"',;>#]+))"""
)

# Inline credential pairs (e.g. username: admin, password: secret)
CREDENTIAL_PAIR = re.compile(
    r"(?im)\b(?:user(?:name)?|login)\s*[:=]\s*[\"']?[A-Za-z0-9_.@-]{2,64}[\"']?[\s,;&|]+\s*"
    r"(?:password|passwd|pwd|pass)\s*[:=]\s*"
    r"""(?:"(?P<qvalue>[^\r\n"]+)"|'(?P<sqvalue>[^\r\n']+)'|(?P<value>[^\s"',;>#]+))"""
)

# Structured API keys recognisable without an explicit label:
STRUCTURED_API_KEY = re.compile(r"\bsk_(?:live|test)_[A-Za-z0-9_-]{16,}\b")
STRUCTURED_GITHUB_TOKEN = re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{30,255}\b")
STRUCTURED_GITLAB_TOKEN = re.compile(r"\bglpat-[A-Za-z0-9_-]{20,}\b")
STRUCTURED_AWS_KEY = re.compile(r"\bAKIA[0-9A-Z]{16}\b")
STRUCTURED_SLACK_TOKEN = re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,48}\b")

# Generic API keys accepted when an explicit field label is present:
API_KEY_FIELD = re.compile(
    r"(?im)(?:^|[\s,;{(&])(?:api[-_ ]?key|apikey|api[-_ ]?token|access[-_ ]?token|secret[-_ ]?key)\s*[:=]\s*"
    r"""(?:"(?P<qvalue>[A-Za-z0-9_\-\.]{16,})"|'(?P<sqvalue>[A-Za-z0-9_\-\.]{16,})'|(?P<value>[A-Za-z0-9_\-\.]{16,}))"""
)

# Bearer tokens:
BEARER_TOKEN = re.compile(r"(?i)\bBearer\s+(?P<value>[A-Za-z0-9_\-\.]{24,})\b")

# Email regex requiring valid domain and TLD:
EMAIL = re.compile(
    r"\b[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}\b"
)

# Candidate only: the Luhn check in detector.py confirms whether it is plausible.
CARD_CANDIDATE = re.compile(r"(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)")

