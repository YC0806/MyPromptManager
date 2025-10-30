from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import yaml
from django.utils.text import slugify

from .models import PromptRecord, PromptTemplateRecord, VersionRecord


def _now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


class MarkdownStore:
    def __init__(self, root: Path):
        self.root = Path(root)
        self.prompts_dir = self.root / "prompts"
        self.templates_dir = self.root / "templates"
        self.index_path = self.root / "index.json"
        self.root.mkdir(parents=True, exist_ok=True)
        self.prompts_dir.mkdir(parents=True, exist_ok=True)
        self.templates_dir.mkdir(parents=True, exist_ok=True)
        if not self.index_path.exists():
            self._write_index({"prompts": {}, "templates": {}, "tags": {}})

    # ------------------------------------------------------------------ #
    # Index helpers
    # ------------------------------------------------------------------ #

    def _read_index(self) -> Dict[str, Any]:
        with self.index_path.open("r", encoding="utf-8") as fh:
            return json.load(fh)

    def _write_index(self, data: Dict[str, Any]) -> None:
        tmp_path = self.index_path.with_suffix(".tmp")
        with tmp_path.open("w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2, ensure_ascii=False)
        tmp_path.replace(self.index_path)

    def _update_index(self, data: Dict[str, Any]) -> None:
        self._write_index(data)

    # ------------------------------------------------------------------ #
    # Tag helpers
    # ------------------------------------------------------------------ #

    def _ensure_tags(self, index: Dict[str, Any], tags: Iterable[str]) -> None:
        if not tags:
            return
        tags_section = index.setdefault("tags", {})
        for name in tags:
            normalized = name.strip()
            if not normalized:
                continue
            if normalized in tags_section:
                continue
            tags_section[normalized] = {
                "name": normalized,
                "slug": self._unique_slug(normalized, tags_section.values()),
                "created_at": _now_iso(),
            }

    def list_tags(self) -> List[Dict[str, Any]]:
        index = self._read_index()
        tags = index.get("tags", {})
        return [
            {"name": data["name"], "slug": data["slug"], "created_at": data["created_at"]}
            for data in tags.values()
        ]

    def create_tag(self, name: str) -> Dict[str, Any]:
        index = self._read_index()
        tags = index.setdefault("tags", {})
        normalized = name.strip()
        for existing in tags.values():
            if existing["name"] == normalized:
                return existing
        slug = self._unique_slug(normalized, tags.values())
        tag_data = {"name": normalized, "slug": slug, "created_at": _now_iso()}
        tags[normalized] = tag_data
        self._update_index(index)
        return tag_data

    def delete_tag(self, slug: str) -> None:
        index = self._read_index()
        tags = index.get("tags", {})
        to_remove = None
        for key, data in tags.items():
            if data["slug"] == slug:
                to_remove = key
                break
        if to_remove:
            tags.pop(to_remove, None)
            self._update_index(index)

    def _unique_slug(self, name: str, existing_items: Iterable[Dict[str, Any]]) -> str:
        base_slug = slugify(name) or "item"
        collision_set = {item.get("slug") for item in existing_items}
        slug_candidate = base_slug
        counter = 2
        while slug_candidate in collision_set:
            slug_candidate = f"{base_slug}-{counter}"
            counter += 1
        return slug_candidate

    # ------------------------------------------------------------------ #
    # Prompt / Template operations
    # ------------------------------------------------------------------ #

    def list_records(self, kind: str) -> List[Dict[str, Any]]:
        index = self._read_index()
        return list(index.get(kind, {}).values())

    def get_record(self, kind: str, item_id: str) -> Optional[Dict[str, Any]]:
        index = self._read_index()
        return index.get(kind, {}).get(item_id)

    def create_prompt(
        self,
        *,
        name: str,
        description: str,
        tags: List[str],
        metadata: Dict[str, Any],
        content: str,
        changelog: str,
        created_by: Optional[str],
    ) -> PromptRecord:
        return self._create_item(
            kind="prompts",
            name=name,
            description=description,
            tags=tags,
            metadata=metadata,
            content=content,
            changelog=changelog,
            created_by=created_by,
            extra_front_matter={},
        )

    def create_template(
        self,
        *,
        name: str,
        description: str,
        tags: List[str],
        metadata: Dict[str, Any],
        content: str,
        changelog: str,
        created_by: Optional[str],
        placeholders: List[str],
        render_example: str,
    ) -> PromptTemplateRecord:
        extra = {"placeholders": placeholders, "render_example": render_example}
        return self._create_item(
            kind="templates",
            name=name,
            description=description,
            tags=tags,
            metadata=metadata,
            content=content,
            changelog=changelog,
            created_by=created_by,
            extra_front_matter=extra,
        )

    def update_item(
        self,
        *,
        kind: str,
        item_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        is_archived: Optional[bool] = None,
    ) -> None:
        index = self._read_index()
        collection = index.get(kind, {})
        entry = collection.get(item_id)
        if not entry:
            raise KeyError(item_id)
        if name is not None:
            entry["name"] = name
        if description is not None:
            entry["description"] = description
        if tags is not None:
            entry["tags"] = sorted(set(tags))
            self._ensure_tags(index, entry["tags"])
        if is_archived is not None:
            entry["is_archived"] = is_archived
        entry["updated_at"] = _now_iso()
        self._update_index(index)

    def delete_item(self, *, kind: str, item_id: str) -> None:
        index = self._read_index()
        collection = index.get(kind, {})
        if item_id in collection:
            collection.pop(item_id)
            self._update_index(index)

    def list_versions(self, *, kind: str, item_id: str) -> List[VersionRecord]:
        entry = self.get_record(kind, item_id)
        if not entry:
            raise KeyError(item_id)
        versions = []
        for version_meta in entry.get("versions", []):
            versions.append(
                self._build_version(
                    kind=kind, entry=entry, version=version_meta["version"]
                )
            )
        return versions

    def get_version(
        self, *, kind: str, item_id: str, version: int
    ) -> VersionRecord:
        entry = self.get_record(kind, item_id)
        if not entry:
            raise KeyError(item_id)
        return self._build_version(kind=kind, entry=entry, version=version)

    def add_version(
        self,
        *,
        kind: str,
        item_id: str,
        content: str,
        metadata: Dict[str, Any],
        changelog: str,
        created_by: Optional[str],
        extra_front_matter: Optional[Dict[str, Any]] = None,
    ) -> VersionRecord:
        index = self._read_index()
        collection = index.get(kind, {})
        entry = collection.get(item_id)
        if not entry:
            raise KeyError(item_id)

        versions_meta = entry.setdefault("versions", [])
        next_version = 1
        if versions_meta:
            next_version = max(v["version"] for v in versions_meta) + 1

        created_at = _now_iso()
        version_meta = {
            "version": next_version,
            "created_at": created_at,
            "changelog": changelog or "",
        }
        relative_path = self._write_version_file(
            kind=kind,
            entry=entry,
            version=next_version,
            content=content,
            metadata=metadata,
            changelog=changelog,
            created_at=created_at,
            created_by=created_by,
            extra_front_matter=extra_front_matter or {},
        )
        version_meta["path"] = relative_path
        versions_meta.append(version_meta)
        entry["active_version"] = next_version
        entry["updated_at"] = created_at
        self._update_index(index)
        return self._build_version(kind=kind, entry=entry, version=next_version)

    def _create_item(
        self,
        *,
        kind: str,
        name: str,
        description: str,
        tags: List[str],
        metadata: Dict[str, Any],
        content: str,
        changelog: str,
        created_by: Optional[str],
        extra_front_matter: Dict[str, Any],
    ):
        index = self._read_index()
        collection = index.setdefault("prompts" if kind == "prompts" else "templates", {})
        item_id = uuid.uuid4().hex
        slug = self._unique_slug(name, collection.values())
        created_at = _now_iso()
        entry = {
            "id": item_id,
            "slug": slug,
            "name": name,
            "description": description,
            "tags": sorted(set(tags)),
            "is_archived": False,
            "created_at": created_at,
            "updated_at": created_at,
            "created_by": created_by,
            "active_version": 1,
            "versions": [],
        }
        self._ensure_tags(index, entry["tags"])

        relative_path = self._write_version_file(
            kind=kind,
            entry=entry,
            version=1,
            content=content,
            metadata=metadata,
            changelog=changelog,
            created_at=created_at,
            created_by=created_by,
            extra_front_matter=extra_front_matter,
        )
        entry["versions"].append(
            {
                "version": 1,
                "created_at": created_at,
                "changelog": changelog or "",
                "path": relative_path,
            }
        )
        collection[item_id] = entry
        self._update_index(index)
        if kind == "prompts":
            return self._build_prompt(entry)
        return self._build_template(entry)

    def _write_version_file(
        self,
        *,
        kind: str,
        entry: Dict[str, Any],
        version: int,
        content: str,
        metadata: Dict[str, Any],
        changelog: str,
        created_at: str,
        created_by: Optional[str],
        extra_front_matter: Dict[str, Any],
    ) -> str:
        directory = self.prompts_dir if kind == "prompts" else self.templates_dir
        target_dir = directory / entry["slug"]
        target_dir.mkdir(parents=True, exist_ok=True)
        filename = f"v{version:03d}.md"
        filepath = target_dir / filename
        front_matter = {
            "id": entry["id"],
            "type": "prompt" if kind == "prompts" else "template",
            "name": entry["name"],
            "description": entry["description"],
            "tags": entry["tags"],
            "is_archived": entry.get("is_archived", False),
            "version": version,
            "metadata": metadata or {},
            "changelog": changelog or "",
            "created_at": created_at,
            "created_by": created_by,
        }
        if extra_front_matter:
            front_matter.update(extra_front_matter)
        yaml_fragment = yaml.safe_dump(
            front_matter, sort_keys=False, allow_unicode=True
        )
        body = content.rstrip() + "\n"
        payload = f"---\n{yaml_fragment}---\n\n{body}"
        filepath.write_text(payload, encoding="utf-8")
        return str(filepath.relative_to(self.root))

    def _build_prompt(self, entry: Dict[str, Any]) -> PromptRecord:
        active_version = self._build_version(
            kind="prompts", entry=entry, version=entry["active_version"]
        )
        latest_meta = max(entry["versions"], key=lambda v: v["version"])
        latest_version = self._build_version(
            kind="prompts", entry=entry, version=latest_meta["version"]
        )
        version_objects = [
            self._build_version(kind="prompts", entry=entry, version=v["version"])
            for v in entry["versions"]
        ]
        return PromptRecord(
            id=entry["id"],
            slug=entry["slug"],
            name=entry["name"],
            description=entry["description"],
            tags=entry.get("tags", []),
            is_archived=entry.get("is_archived", False),
            created_at=entry.get("created_at", ""),
            updated_at=entry.get("updated_at", ""),
            created_by=entry.get("created_by"),
            active_version=active_version,
            latest_version=latest_version,
            versions=version_objects,
        )

    def _build_template(self, entry: Dict[str, Any]) -> PromptTemplateRecord:
        active_version = self._build_version(
            kind="templates", entry=entry, version=entry["active_version"]
        )
        latest_meta = max(entry["versions"], key=lambda v: v["version"])
        latest_version = self._build_version(
            kind="templates", entry=entry, version=latest_meta["version"]
        )
        version_objects = [
            self._build_version(kind="templates", entry=entry, version=v["version"])
            for v in entry["versions"]
        ]
        return PromptTemplateRecord(
            id=entry["id"],
            slug=entry["slug"],
            name=entry["name"],
            description=entry["description"],
            tags=entry.get("tags", []),
            is_archived=entry.get("is_archived", False),
            created_at=entry.get("created_at", ""),
            updated_at=entry.get("updated_at", ""),
            created_by=entry.get("created_by"),
            active_version=active_version,
            latest_version=latest_version,
            versions=version_objects,
        )

    def _build_version(
        self, *, kind: str, entry: Dict[str, Any], version: int
    ) -> VersionRecord:
        index = next(
            (meta for meta in entry.get("versions", []) if meta["version"] == version),
            None,
        )
        if not index:
            raise KeyError(version)
        path = self.root / index["path"]
        front_matter, body = self._parse_markdown(path)
        version_id = f"{entry['id']}:v{version}"
        return VersionRecord(
            id=version_id,
            parent_id=entry["id"],
            version=version,
            content=body,
            metadata=front_matter.get("metadata", {}) or {},
            changelog=front_matter.get("changelog", ""),
            created_at=front_matter.get("created_at", index.get("created_at", "")),
            created_by=front_matter.get("created_by"),
            path=str(path),
            placeholders=front_matter.get("placeholders"),
            render_example=front_matter.get("render_example"),
        )

    def _parse_markdown(self, path: Path) -> Tuple[Dict[str, Any], str]:
        text = path.read_text(encoding="utf-8")
        if not text.startswith("---"):
            return {}, text
        lines = text.splitlines()
        front_lines: List[str] = []
        body_lines: List[str] = []
        delimiter_count = 0
        for idx, line in enumerate(lines):
            if idx == 0 and line.strip() == "---":
                delimiter_count += 1
                continue
            if delimiter_count == 1:
                if line.strip() == "---":
                    delimiter_count += 1
                    body_lines = lines[idx + 1 :]
                    break
                front_lines.append(line)
        front_text = "\n".join(front_lines)
        body = "\n".join(body_lines).strip() + "\n"
        front_matter = yaml.safe_load(front_text) if front_text else {}
        return front_matter or {}, body

    # Convenience exposure
    def to_prompt_record(self, item_id: str) -> PromptRecord:
        entry = self.get_record("prompts", item_id)
        if not entry:
            raise KeyError(item_id)
        return self._build_prompt(entry)

    def to_template_record(self, item_id: str) -> PromptTemplateRecord:
        entry = self.get_record("templates", item_id)
        if not entry:
            raise KeyError(item_id)
        return self._build_template(entry)
