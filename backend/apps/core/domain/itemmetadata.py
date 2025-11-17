from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class VersionSummary:
    id: str
    version_number: str
    created_at: Optional[str] = None

    @classmethod
    def from_dict(cls, data: dict) -> "VersionSummary":
        return cls(
            id=data["id"],
            version_number=data["version_number"],
            created_at=data.get("created_at")
        )
    
    def __dict__(self) -> dict:
        return {
            "id": self.id,
            "version_number": self.version_number,
            "created_at": self.created_at
        }

@dataclass
class ItemSummary:
    id: str
    title: str
    type: str
    labels: List[str]
    description: str
    updated_at: str
    created_at: str
    author: str
    
    def __dict__(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "type": self.type,
            "labels": self.labels,
            "description": self.description,
            "updated_at": self.updated_at,
            "created_at": self.created_at,
            "author": self.author
        }

@dataclass
class ItemMetadata:
    id: str
    title: str
    type: str
    labels: List[str]
    description: Optional[str] = None
    updated_at: Optional[str] = None
    created_at: Optional[str] = None
    author: Optional[str] = None
    versions: List[VersionSummary] = field(default_factory=list)

    @classmethod 
    def from_dict(cls, data: dict) -> "ItemMetadata":
        return cls(
            id=data["id"],
            title=data["title"],
            type=data["type"],
            labels=data.get("labels", []),
            description=data.get("description",""),
            updated_at=data.get("updated_at",""),
            created_at=data.get("created_at",""),
            author=data.get("author",""),
            versions=[VersionSummary.from_dict(v) for v in data.get("versions", [])]
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
            "versions": [v.__dict__() for v in self.versions]
        }
    
    def to_summary(self) -> ItemSummary:
        return ItemSummary(
            id=self.id,
            title=self.title,
            type=self.type,
            labels=self.labels,
            description=self.description,
            updated_at=self.updated_at,
            created_at=self.created_at,
            author=self.author,
        )
