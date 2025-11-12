from dataclasses import dataclass
from typing import List, Optional
import json

from apps.core.utils.frontmatter import parse_frontmatter

@dataclass
class VersionData:
    id: str
    version_number: str
    content: str
    created_at: Optional[str] = None
    author: Optional[str] = None
    _extra_data: Optional[dict] = None

    def __dict__(self) -> dict:
        return {
            "id": self.id,
            "version_number": self.version_number,
            "created_at": self.created_at,
            "author": self.author,
        }

    def to_text(self) -> str:
        frontmatter_dict = self.__dict__()
        frontmatter = f"---\n{json.dumps(frontmatter_dict, indent=2, ensure_ascii=False)}\n---\n\n"
        return frontmatter + (self.content or "")
    
    @classmethod
    def from_text(cls, text: str) -> "VersionData":
        frontmatter_dict, content = parse_frontmatter(text)
        return cls(
            id=frontmatter_dict["id"],
            version_number=frontmatter_dict["version_number"],
            created_at=frontmatter_dict.get("created_at"),
            author=frontmatter_dict.get("author"),
            content=content,
            _extra_data=frontmatter_dict
        )

@dataclass
class TemplateVariable:
    name: str
    type: type
    description: Optional[str] = None
    default_value: Optional[str] = None

    def __dict__(self) -> dict:
        return {
            "name": self.name,
            "type": self.type.__name__,
            "description": self.description,
            "default_value": self.default_value,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "TemplateVariable":
        type_str = data.get("type", "str")
        type_map = {
            "str": str,
            "int": int,
            "float": float,
            "bool": bool,
        }
        var_type = type_map.get(type_str, str)
        return cls(
            name=data["name"],
            type=var_type,
            description=data.get("description"),
            default_value=data.get("default_value"),
        )

@dataclass
class TemplateVersionData(VersionData):
    variables: Optional[List[TemplateVariable]] = None

    def __dict__(self) -> dict:
        base_dict = super().__dict__()
        if self.variables is not None:
            base_dict["variables"] = [var.__dict__() for var in self.variables]
        return base_dict

    @classmethod
    def from_text(cls, text: str) -> "TemplateVersionData":
        base = super().from_text(text)
        variables_data = base._extra_data.get("variables", [])
        variables = [TemplateVariable.from_dict(var) for var in variables_data]
        return cls(
            id=base.id,
            version_number=base.version_number,
            created_at=base.created_at,
            author=base.author,
            content=base.content,
            _extra_data=base._extra_data,
            variables=variables
        )