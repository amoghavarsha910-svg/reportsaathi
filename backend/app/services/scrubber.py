import re


REDACTED = "[REDACTED]"
_SENSITIVE_LABEL_LINE = re.compile(
    r"^\s*(?:(?:patient\s+name|patient\s+id|referred\s+by|mrn|uhid|name|phone|mobile|email|address)\b|dr\.).*$",
    re.IGNORECASE,
)
_EMAIL = re.compile(r"(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b")
_TWELVE_DIGIT_ID = re.compile(r"(?<!\d)\d{4}\s?\d{4}\s?\d{4}(?!\d)")
_TEN_DIGIT_PHONE = re.compile(r"(?<!\d)(?:\d[ -]?){9}\d(?!\d)")


def scrub_pii(raw_text: str) -> tuple[str, int]:
    """Redact labeled patient details and common ID/contact patterns."""
    redaction_count = 0
    redacted_lines: list[str] = []

    for line in raw_text.splitlines(keepends=True):
        ending = "\r\n" if line.endswith("\r\n") else "\n" if line.endswith("\n") else "\r" if line.endswith("\r") else ""
        body = line[:-len(ending)] if ending else line
        if _SENSITIVE_LABEL_LINE.match(body):
            redaction_count += 1
            redacted_lines.append(REDACTED + ending)
        else:
            redacted_lines.append(line)

    cleaned_text = "".join(redacted_lines)
    for pattern in (_EMAIL, _TWELVE_DIGIT_ID, _TEN_DIGIT_PHONE):
        cleaned_text, count = pattern.subn(REDACTED, cleaned_text)
        redaction_count += count

    return cleaned_text, redaction_count
