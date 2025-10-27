from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from django.conf import settings

from .models import PromptRecord, PromptTemplateRecord, VersionRecord
from .storage import MarkdownStore


def _resolve_user(user) -> Optional[str]:
    if user and getattr(user, "is_authenticated", False):
        return getattr(user, "username", None) or str(user)
    return None


def _store() -> MarkdownStore:
    root = settings.PROMPT_STORAGE_ROOT
    if not isinstance(root, Path):
        root = Path(root)
    return MarkdownStore(root)


def list_prompts(
    *,
    search: Optional[str] = None,
    tags: Optional[Iterable[str]] = None,
    include_archived: Optional[bool] = None,
) -> List[PromptRecord]:
    store = _store()
    items = []
    tags_set = {tag.strip() for tag in tags or [] if tag.strip()}
    for entry in store.list_records("prompts"):
        if include_archived is True and not entry.get("is_archived"):
            continue
        if include_archived is False and entry.get("is_archived"):
            continue
        if include_archived is None and entry.get("is_archived"):
            continue
        if search:
            term = search.lower()
            if term not in entry.get("name", "").lower() and term not in entry.get(
                "description", ""
            ).lower():
                continue
        if tags_set and not tags_set.issubset(set(entry.get("tags", []))):
            continue
        items.append(store._build_prompt(entry))
    return items


def list_templates(
    *,
    search: Optional[str] = None,
    tags: Optional[Iterable[str]] = None,
    include_archived: Optional[bool] = None,
) -> List[PromptTemplateRecord]:
    store = _store()
    items = []
    tags_set = {tag.strip() for tag in tags or [] if tag.strip()}
    for entry in store.list_records("templates"):
        if include_archived is True and not entry.get("is_archived"):
            continue
        if include_archived is False and entry.get("is_archived"):
            continue
        if include_archived is None and entry.get("is_archived"):
            continue
        if search:
            term = search.lower()
            if term not in entry.get("name", "").lower() and term not in entry.get(
                "description", ""
            ).lower():
                continue
        if tags_set and not tags_set.issubset(set(entry.get("tags", []))):
            continue
        items.append(store._build_template(entry))
    return items


def get_prompt(prompt_id: str) -> PromptRecord:
    store = _store()
    return store.to_prompt_record(prompt_id)


def get_template(template_id: str) -> PromptTemplateRecord:
    store = _store()
    return store.to_template_record(template_id)


def create_prompt(
    *,
    name: str,
    description: str,
    tags: List[str],
    metadata: Optional[Dict[str, Any]],
    content: str,
    changelog: str,
    user=None,
) -> PromptRecord:
    store = _store()
    return store.create_prompt(
        name=name,
        description=description,
        tags=list({tag.strip() for tag in tags if tag.strip()}),
        metadata=metadata or {},
        content=content,
        changelog=changelog,
        created_by=_resolve_user(user),
    )


def update_prompt(
    *,
    prompt_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    tags: Optional[List[str]] = None,
    is_archived: Optional[bool] = None,
    content: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    changelog: str = "",
    user=None,
) -> PromptRecord:
    store = _store()
    store.update_item(
        kind="prompts",
        item_id=prompt_id,
        name=name,
        description=description,
        tags=list({tag.strip() for tag in tags}) if tags is not None else None,
        is_archived=is_archived,
    )
    if content is not None:
        store.add_version(
            kind="prompts",
            item_id=prompt_id,
            content=content,
            metadata=metadata or {},
            changelog=changelog,
            created_by=_resolve_user(user),
        )
    return store.to_prompt_record(prompt_id)


def delete_prompt(prompt_id: str) -> None:
    store = _store()
    store.delete_item(kind="prompts", item_id=prompt_id)


def list_prompt_versions(prompt_id: str) -> List[VersionRecord]:
    store = _store()
    return store.list_versions(kind="prompts", item_id=prompt_id)


def get_prompt_version(prompt_id: str, version: int) -> VersionRecord:
    store = _store()
    return store.get_version(kind="prompts", item_id=prompt_id, version=version)


def create_prompt_version(
    *,
    prompt_id: str,
    content: str,
    metadata: Optional[Dict[str, Any]],
    changelog: str,
    user=None,
) -> VersionRecord:
    store = _store()
    return store.add_version(
        kind="prompts",
        item_id=prompt_id,
        content=content,
        metadata=metadata or {},
        changelog=changelog,
        created_by=_resolve_user(user),
    )


def restore_prompt_version(
    *,
    prompt_id: str,
    version: int,
    user=None,
    changelog: Optional[str] = None,
) -> VersionRecord:
    store = _store()
    record = store.get_version(kind="prompts", item_id=prompt_id, version=version)
    return store.add_version(
        kind="prompts",
        item_id=prompt_id,
        content=record.content,
        metadata=record.metadata,
        changelog=changelog or f"Restored from v{version}",
        created_by=_resolve_user(user),
    )


def create_prompt_template(
    *,
    name: str,
    description: str,
    tags: List[str],
    metadata: Optional[Dict[str, Any]],
    content: str,
    changelog: str,
    placeholders: Optional[List[str]],
    render_example: str,
    user=None,
) -> PromptTemplateRecord:
    store = _store()
    return store.create_template(
        name=name,
        description=description,
        tags=list({tag.strip() for tag in tags if tag.strip()}),
        metadata=metadata or {},
        content=content,
        changelog=changelog,
        created_by=_resolve_user(user),
        placeholders=list(placeholders or []),
        render_example=render_example,
    )


def update_prompt_template(
    *,
    template_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    tags: Optional[List[str]] = None,
    is_archived: Optional[bool] = None,
    content: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    changelog: str = "",
    placeholders: Optional[List[str]] = None,
    render_example: Optional[str] = None,
    user=None,
) -> PromptTemplateRecord:
    store = _store()
    store.update_item(
        kind="templates",
        item_id=template_id,
        name=name,
        description=description,
        tags=list({tag.strip() for tag in tags}) if tags is not None else None,
        is_archived=is_archived,
    )
    if content is not None:
        store.add_version(
            kind="templates",
            item_id=template_id,
            content=content,
            metadata=metadata or {},
            changelog=changelog,
            created_by=_resolve_user(user),
            extra_front_matter={
                "placeholders": list(placeholders or []),
                "render_example": render_example or "",
            },
        )
    return store.to_template_record(template_id)


def delete_prompt_template(template_id: str) -> None:
    store = _store()
    store.delete_item(kind="templates", item_id=template_id)


def list_template_versions(template_id: str) -> List[VersionRecord]:
    store = _store()
    return store.list_versions(kind="templates", item_id=template_id)


def get_template_version(template_id: str, version: int) -> VersionRecord:
    store = _store()
    return store.get_version(kind="templates", item_id=template_id, version=version)


def create_prompt_template_version(
    *,
    template_id: str,
    content: str,
    metadata: Optional[Dict[str, Any]],
    changelog: str,
    placeholders: Optional[List[str]],
    render_example: str,
    user=None,
) -> VersionRecord:
    store = _store()
    return store.add_version(
        kind="templates",
        item_id=template_id,
        content=content,
        metadata=metadata or {},
        changelog=changelog,
        created_by=_resolve_user(user),
        extra_front_matter={
            "placeholders": list(placeholders or []),
            "render_example": render_example or "",
        },
    )


def restore_prompt_template_version(
    *,
    template_id: str,
    version: int,
    user=None,
    changelog: Optional[str] = None,
) -> VersionRecord:
    store = _store()
    record = store.get_version(kind="templates", item_id=template_id, version=version)
    return store.add_version(
        kind="templates",
        item_id=template_id,
        content=record.content,
        metadata=record.metadata,
        changelog=changelog or f"Restored from v{version}",
        created_by=_resolve_user(user),
        extra_front_matter={
            "placeholders": list(record.placeholders or []),
            "render_example": record.render_example or "",
        },
    )


def list_tags() -> List[Dict[str, Any]]:
    store = _store()
    return store.list_tags()


def create_tag(name: str) -> Dict[str, Any]:
    store = _store()
    return store.create_tag(name)


def delete_tag(slug: str) -> None:
    store = _store()
    store.delete_tag(slug)
