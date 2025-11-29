"""
Cursor-based pagination utilities for keyset pagination.
"""
import base64
import json
from typing import Optional, Tuple
from datetime import datetime


def encode_cursor(updated_at: str, item_id: str) -> str:
    """
    Encode a cursor for keyset pagination.

    Args:
        updated_at: ISO format timestamp
        item_id: Item ID (ULID)

    Returns:
        Base64-encoded cursor string
    """
    cursor_data = {
        "updated_at": updated_at,
        "id": item_id
    }
    cursor_json = json.dumps(cursor_data)
    return base64.b64encode(cursor_json.encode()).decode()


def decode_cursor(cursor: Optional[str]) -> Optional[Tuple[str, str]]:
    """
    Decode a cursor for keyset pagination.

    Args:
        cursor: Base64-encoded cursor string

    Returns:
        Tuple of (updated_at, item_id) or None if invalid
    """
    if not cursor:
        return None

    try:
        cursor_json = base64.b64decode(cursor.encode()).decode()
        cursor_data = json.loads(cursor_json)
        return cursor_data["updated_at"], cursor_data["id"]
    except Exception:
        return None


def parse_datetime(dt_str: str) -> datetime:
    """
    Parse ISO format datetime string.

    Args:
        dt_str: ISO format datetime string

    Returns:
        datetime object
    """
    # Handle both formats: with and without microseconds
    if '.' in dt_str:
        # Has microseconds
        if dt_str.endswith('Z'):
            dt_str = dt_str.replace('Z', '+00:00')
        return datetime.fromisoformat(dt_str)
    else:
        # No microseconds
        if dt_str.endswith('Z'):
            dt_str = dt_str.replace('Z', '+00:00')
        return datetime.fromisoformat(dt_str)
