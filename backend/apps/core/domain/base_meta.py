"""
Base metadata classes for domain models.
"""
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime
import datetime as dt

from backend.apps.core.domain.enums import ItemType


@dataclass
class BaseItemMeta:
    """
    Base class for all item metadata (prompts, templates, chats).
    Provides common fields and methods for file/index serialization.
    """
    id: str
    title: str
    slug: str
    type: ItemType
    labels: List[str] = field(default_factory=list)
    description: Optional[str] = None
    author: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    def from_file_dict(self, data: Dict[str, Any]) -> "BaseItemMeta":
        """
        Parse metadata from file storage dictionary.
        Override in subclasses to handle type-specific fields.
        """
        raise NotImplementedError("Subclasses must implement from_file_dict")

    def to_file_dict(self) -> Dict[str, Any]:
        """
        Convert metadata to dictionary for file storage.
        Override in subclasses to include type-specific fields.
        """
        raise NotImplementedError("Subclasses must implement to_file_dict")

    def to_index_record(self, version_info: Optional[Any] = None) -> "IndexRecord":
        """
        Convert to IndexRecord for database indexing.
        Override in subclasses to include type-specific fields.

        Args:
            version_info: Optional version information (for prompts/templates)
        """
        raise NotImplementedError("Subclasses must implement to_index_record")

    def _ensure_timestamps(self):
        """Ensure created_at and updated_at are set."""
        now = dt.datetime.now(dt.timezone.utc).isoformat()
        if not self.created_at:
            self.created_at = now
        if not self.updated_at:
            self.updated_at = now


@dataclass
class PromptMeta(BaseItemMeta):
    """Metadata for prompts."""
    type: ItemType = field(default=ItemType.PROMPT)
    versions: List[Any] = field(default_factory=list)  # List[VersionSummary]

    @classmethod
    def from_file_dict(cls, data: Dict[str, Any]) -> "PromptMeta":
        """Parse from file storage."""
        from backend.apps.core.domain.itemmetadata import VersionSummary

        return cls(
            id=data["id"],
            title=data["title"],
            slug=data.get("slug", data["id"]),
            type=ItemType.PROMPT,
            labels=data.get("labels", []),
            description=data.get("description", ""),
            author=data.get("author", ""),
            created_at=data.get("created_at", ""),
            updated_at=data.get("updated_at", ""),
            versions=[VersionSummary.from_dict(v) for v in data.get("versions", [])]
        )

    def to_file_dict(self) -> Dict[str, Any]:
        """Convert to file storage dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "type": self.type.value,
            "labels": self.labels,
            "description": self.description,
            "author": self.author,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "versions": [v.__dict__() if hasattr(v, '__dict__') and callable(v.__dict__) else v for v in self.versions]
        }

    def to_index_record(self, version_info: Optional[Any] = None):
        """Convert to IndexRecord for database indexing."""
        from backend.apps.core.domain.index_record import IndexRecord

        head_version = self.versions[-1] if self.versions else None

        return IndexRecord(
            id=self.id,
            item_type=ItemType.PROMPT,
            title=self.title,
            description=self.description or "",
            slug=self.slug,
            labels=self.labels,
            author=self.author or "",
            created_at=self.created_at or "",
            updated_at=self.updated_at or "",
            version_count=len(self.versions),
            head_version_id=head_version.id if head_version else None,
            head_version_number=head_version.version_number if head_version else None,
            file_path=f"prompts/prompt-{self.id}/HEAD",
            sha="latest"
        )


@dataclass
class TemplateMeta(BaseItemMeta):
    """Metadata for templates with variables."""
    type: ItemType = field(default=ItemType.TEMPLATE)
    versions: List[Any] = field(default_factory=list)  # List[VersionSummary]

    @classmethod
    def from_file_dict(cls, data: Dict[str, Any]) -> "TemplateMeta":
        """Parse from file storage."""
        from backend.apps.core.domain.itemmetadata import VersionSummary

        return cls(
            id=data["id"],
            title=data["title"],
            slug=data.get("slug", data["id"]),
            type=ItemType.TEMPLATE,
            labels=data.get("labels", []),
            description=data.get("description", ""),
            author=data.get("author", ""),
            created_at=data.get("created_at", ""),
            updated_at=data.get("updated_at", ""),
            versions=[VersionSummary.from_dict(v) for v in data.get("versions", [])]
        )

    def to_file_dict(self) -> Dict[str, Any]:
        """Convert to file storage dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "type": self.type.value,
            "labels": self.labels,
            "description": self.description,
            "author": self.author,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "versions": [v.__dict__() if hasattr(v, '__dict__') and callable(v.__dict__) else v for v in self.versions]
        }

    def to_index_record(self, version_info: Optional[Any] = None):
        """Convert to IndexRecord for database indexing."""
        from backend.apps.core.domain.index_record import IndexRecord

        head_version = self.versions[-1] if self.versions else None

        return IndexRecord(
            id=self.id,
            item_type=ItemType.TEMPLATE,
            title=self.title,
            description=self.description or "",
            slug=self.slug,
            labels=self.labels,
            author=self.author or "",
            created_at=self.created_at or "",
            updated_at=self.updated_at or "",
            version_count=len(self.versions),
            head_version_id=head_version.id if head_version else None,
            head_version_number=head_version.version_number if head_version else None,
            file_path=f"templates/template-{self.id}/HEAD",
            sha="latest"
        )


@dataclass
class ChatMeta(BaseItemMeta):
    """
    Metadata for chats with provider-specific fields.
    """
    type: ItemType = field(default=ItemType.CHAT)
    provider: Optional[str] = None
    model: Optional[str] = None
    conversation_id: Optional[str] = None
    turn_count: int = 0
    messages: List[Dict[str, Any]] = field(default_factory=list)

    @classmethod
    def from_file_dict(cls, data: Dict[str, Any]) -> "ChatMeta":
        """Parse from file storage."""
        messages = data.get("messages", [])
        turn_count = data.get("turn_count")
        if turn_count is None:
            turn_count = sum(1 for msg in messages if msg.get("role") == "user")

        return cls(
            id=data["id"],
            title=data.get("title", ""),
            slug=data.get("slug", data["id"]),
            type=ItemType.CHAT,
            labels=data.get("labels", data.get("tags", [])),
            description=data.get("description", ""),
            author=data.get("author", "system"),
            created_at=data.get("created_at", ""),
            updated_at=data.get("updated_at", ""),
            provider=data.get("provider"),
            model=data.get("model"),
            conversation_id=data.get("conversation_id"),
            turn_count=turn_count,
            messages=messages
        )

    def to_file_dict(self) -> Dict[str, Any]:
        """Convert to file storage dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "type": self.type.value,
            "labels": self.labels,
            "description": self.description,
            "author": self.author,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "provider": self.provider,
            "model": self.model,
            "conversation_id": self.conversation_id,
            "turn_count": self.turn_count,
            "messages": self.messages
        }

    def to_index_record(self, version_info: Optional[Any] = None):
        """Convert to IndexRecord for database indexing."""
        from backend.apps.core.domain.index_record import IndexRecord

        return IndexRecord(
            id=self.id,
            item_type=ItemType.CHAT,
            title=self.title,
            description=self.description or "",
            slug=self.slug,
            labels=self.labels,
            author=self.author or "system",
            created_at=self.created_at or "",
            updated_at=self.updated_at or "",
            provider=self.provider,
            model=self.model,
            conversation_id=self.conversation_id,
            turn_count=self.turn_count,
            file_path=f"chats/chat-{self.id}.json",
            sha="latest",
            version_count=0,
            head_version_id=None,
            head_version_number=None
        )
