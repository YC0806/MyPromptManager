from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any


@dataclass
class ChatSummary:
    """Summary of a chat for list views."""
    id: str
    title: str
    type: str
    labels: List[str]
    description: str
    updated_at: str
    created_at: str
    author: str
    provider: Optional[str] = None
    model: Optional[str] = None
    turn_count: int = 0

    def __dict__(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "type": self.type,
            "labels": self.labels,
            "description": self.description,
            "updated_at": self.updated_at,
            "created_at": self.created_at,
            "author": self.author,
            "provider": self.provider,
            "model": self.model,
            "turn_count": self.turn_count,
        }


@dataclass
class ChatMetadata:
    """
    Metadata for a chat, stored within the JSON file.
    Keeps the single-file JSON storage approach while providing
    structured metadata similar to ItemMetadata.
    """
    id: str
    title: str
    type: str = "chat"
    labels: List[str] = field(default_factory=list)
    description: Optional[str] = None
    updated_at: Optional[str] = None
    created_at: Optional[str] = None
    author: Optional[str] = None
    # Chat-specific fields
    provider: Optional[str] = None
    model: Optional[str] = None
    conversation_id: Optional[str] = None
    turn_count: int = 0
    # Messages stored within the same JSON
    messages: List[Dict[str, Any]] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict) -> "ChatMetadata":
        messages = data.get("messages", [])
        turn_count = data.get("turn_count")
        if turn_count is None:
            # Calculate turn count from messages
            turn_count = sum(1 for msg in messages if msg.get("role") == "user")

        return cls(
            id=data["id"],
            title=data.get("title", ""),
            type=data.get("type", "chat"),
            labels=data.get("labels", data.get("tags", [])),
            description=data.get("description", ""),
            updated_at=data.get("updated_at", ""),
            created_at=data.get("created_at", ""),
            author=data.get("author", ""),
            provider=data.get("provider"),
            model=data.get("model"),
            conversation_id=data.get("conversation_id"),
            turn_count=turn_count,
            messages=messages,
        )

    def __dict__(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "type": self.type,
            "labels": self.labels,
            "description": self.description,
            "updated_at": self.updated_at,
            "created_at": self.created_at,
            "author": self.author,
            "provider": self.provider,
            "model": self.model,
            "conversation_id": self.conversation_id,
            "turn_count": self.turn_count,
            "messages": self.messages,
        }

    def to_summary(self) -> ChatSummary:
        """Convert to summary for list views (excludes messages)."""
        return ChatSummary(
            id=self.id,
            title=self.title,
            type=self.type,
            labels=self.labels,
            description=self.description,
            updated_at=self.updated_at,
            created_at=self.created_at,
            author=self.author,
            provider=self.provider,
            model=self.model,
            turn_count=self.turn_count,
        )
