from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class VersionRecord:
    id: str
    parent_id: str
    version: int
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    changelog: str = ""
    created_at: str = ""
    created_by: Optional[str] = None
    path: str = ""
    placeholders: Optional[List[str]] = None
    render_example: Optional[str] = None


@dataclass
class PromptRecord:
    id: str
    slug: str
    name: str
    description: str = ""
    tags: List[str] = field(default_factory=list)
    is_archived: bool = False
    created_at: str = ""
    updated_at: str = ""
    created_by: Optional[str] = None
    active_version: Optional[VersionRecord] = None
    latest_version: Optional[VersionRecord] = None
    versions: List[VersionRecord] = field(default_factory=list)


@dataclass
class PromptTemplateRecord:
    id: str
    slug: str
    name: str
    description: str = ""
    tags: List[str] = field(default_factory=list)
    is_archived: bool = False
    created_at: str = ""
    updated_at: str = ""
    created_by: Optional[str] = None
    active_version: Optional[VersionRecord] = None
    latest_version: Optional[VersionRecord] = None
    versions: List[VersionRecord] = field(default_factory=list)
