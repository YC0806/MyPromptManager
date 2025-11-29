"""
Enumerations for domain models.
"""
from enum import Enum


class ItemType(str, Enum):
    """Types of items in the system."""
    PROMPT = "prompt"
    TEMPLATE = "template"
    CHAT = "chat"

    def __str__(self):
        return self.value


class Provider(str, Enum):
    """AI providers."""
    CHATGPT = "ChatGPT"
    CLAUDE = "Claude"
    GEMINI = "Gemini"
    CUSTOM = "Custom"
    UNKNOWN = "Unknown"

    def __str__(self):
        return self.value

    @classmethod
    def from_string(cls, value: str) -> "Provider":
        """Parse provider from string."""
        if not value:
            return cls.UNKNOWN

        value_lower = value.lower()
        if "chatgpt" in value_lower or "gpt" in value_lower or "openai" in value_lower:
            return cls.CHATGPT
        elif "claude" in value_lower or "anthropic" in value_lower:
            return cls.CLAUDE
        elif "gemini" in value_lower or "bard" in value_lower:
            return cls.GEMINI
        else:
            return cls.CUSTOM
