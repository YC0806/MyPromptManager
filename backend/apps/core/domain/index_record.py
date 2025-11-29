"""
IndexRecord DTO for database indexing.
"""
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

from backend.apps.core.domain.enums import ItemType


@dataclass
class IndexRecord:
    """
    Data Transfer Object for index records.
    Used for database storage and API responses.
    """
    # Core fields (from BaseItemMeta)
    id: str
    item_type: ItemType
    title: str
    description: str
    slug: str
    labels: List[str]
    author: str
    created_at: str
    updated_at: str

    # Version fields (for prompts/templates)
    version_count: int = 0
    head_version_id: Optional[str] = None
    head_version_number: Optional[str] = None

    # File tracking
    file_path: str = ""
    sha: str = "latest"

    # Chat-specific fields
    provider: Optional[str] = None
    model: Optional[str] = None
    conversation_id: Optional[str] = None
    turn_count: int = 0

    def to_response_dict(self) -> Dict[str, Any]:
        """
        Convert to API response dictionary.
        Includes only relevant fields based on item type.
        """
        base_response = {
            "id": self.id,
            "type": self.item_type.value,
            "title": self.title,
            "description": self.description,
            "slug": self.slug,
            "labels": self.labels,
            "author": self.author,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "file_path": self.file_path,
            "sha": self.sha,
        }

        # Add version info for prompts/templates
        if self.item_type in (ItemType.PROMPT, ItemType.TEMPLATE):
            base_response.update({
                "version_count": self.version_count,
                "head_version_id": self.head_version_id,
                "head_version_number": self.head_version_number,
            })

        # Add chat-specific fields
        if self.item_type == ItemType.CHAT:
            base_response.update({
                "provider": self.provider,
                "model": self.model,
                "conversation_id": self.conversation_id,
                "turn_count": self.turn_count,
            })

        return base_response

    @classmethod
    def from_meta(cls, meta: Any, version_info: Optional[Any] = None) -> "IndexRecord":
        """
        Create IndexRecord from metadata object.

        Args:
            meta: BaseItemMeta subclass (PromptMeta, TemplateMeta, or ChatMeta)
            version_info: Optional version information

        Returns:
            IndexRecord instance
        """
        # Delegate to the meta object's to_index_record method
        return meta.to_index_record(version_info)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database storage."""
        return {
            "id": self.id,
            "item_type": self.item_type.value,
            "title": self.title,
            "description": self.description,
            "slug": self.slug,
            "labels": self.labels,
            "author": self.author,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "version_count": self.version_count,
            "head_version_id": self.head_version_id,
            "head_version_number": self.head_version_number,
            "file_path": self.file_path,
            "sha": self.sha,
            "provider": self.provider,
            "model": self.model,
            "conversation_id": self.conversation_id,
            "turn_count": self.turn_count,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "IndexRecord":
        """Create from dictionary (e.g., database row)."""
        item_type_str = data.get("item_type")
        if isinstance(item_type_str, str):
            item_type = ItemType(item_type_str)
        else:
            item_type = item_type_str

        return cls(
            id=data["id"],
            item_type=item_type,
            title=data["title"],
            description=data.get("description", ""),
            slug=data["slug"],
            labels=data.get("labels", []),
            author=data.get("author", ""),
            created_at=data.get("created_at", ""),
            updated_at=data.get("updated_at", ""),
            version_count=data.get("version_count", 0),
            head_version_id=data.get("head_version_id"),
            head_version_number=data.get("head_version_number"),
            file_path=data.get("file_path", ""),
            sha=data.get("sha", "latest"),
            provider=data.get("provider"),
            model=data.get("model"),
            conversation_id=data.get("conversation_id"),
            turn_count=data.get("turn_count", 0),
        )
