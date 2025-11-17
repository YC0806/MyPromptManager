"""
ID generation utilities.
"""
import time
import random
import string


def generate_ulid() -> str:
    """
    Generate a ULID-like identifier.
    Format: Timestamp (10 chars) + Random (16 chars)

    Returns:
        26-character ULID string
    """
    # Timestamp component (milliseconds since epoch, base32 encoded)
    timestamp_ms = int(time.time() * 1000)

    # Convert to base32-like encoding using Crockford's base32
    charset = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

    # Encode timestamp
    timestamp_chars = []
    t = timestamp_ms
    for _ in range(10):
        timestamp_chars.append(charset[t % 32])
        t //= 32
    timestamp_part = ''.join(reversed(timestamp_chars))

    # Random component
    random_part = ''.join(random.choice(charset) for _ in range(16))

    return timestamp_part + random_part
