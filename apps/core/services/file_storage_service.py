"""
File-based storage service for prompts, templates, and chats.
Replaces Git-based storage with file-based versioning system.
"""
import os
import json
import yaml
import shutil
from pathlib import Path
from typing import Optional, List, Dict, Tuple
from datetime import datetime
import hashlib

from filelock import FileLock
from django.conf import settings

from apps.core.exceptions import ResourceNotFoundError, ConflictError, ValidationError
from apps.core.utils.id_generator import generate_ulid


class FileStorageService:
    """Service for file-based storage with versioning."""

    def __init__(self, storage_root: Optional[str] = None):
        """
        Initialize file storage service.

        Args:
            storage_root: Root directory for storage. Defaults to settings.GIT_REPO_ROOT
        """
        self.storage_root = Path(storage_root or settings.GIT_REPO_ROOT)
        self._ensure_directory_structure()

    def _ensure_directory_structure(self):
        """Ensure basic directory structure exists."""
        dirs = [
            self.storage_root / 'prompts',
            self.storage_root / 'templates',
            self.storage_root / 'chats',
        ]
        for dir_path in dirs:
            dir_path.mkdir(parents=True, exist_ok=True)

    def _generate_version_id(self) -> str:
        """Generate a unique version ID (timestamp + random suffix)."""
        timestamp = datetime.utcnow().strftime('%Y-%m-%dT%H-%MZ')
        suffix = generate_ulid()[-5:]  # Last 5 chars of ULID
        return f"{timestamp}_{suffix}"

    def _get_item_directory(self, item_type: str, item_id: str, slug: str) -> Path:
        """Get directory path for an item."""
        dir_name = f"{item_type}_{slug}-{item_id}"
        return self.storage_root / f"{item_type}s" / dir_name

    def _get_versions_directory(self, item_type: str, item_id: str, slug: str) -> Path:
        """Get versions directory path for an item."""
        item_dir = self._get_item_directory(item_type, item_id, slug)
        return item_dir / "versions"

    def _get_version_filename(self, item_type: str, slug: str, item_id: str, version_id: str) -> str:
        """Generate version filename."""
        prefix = "pv" if item_type == "prompt" else "tv"
        return f"{prefix}_{slug}-{item_id}_{version_id}.md"

    def _read_yaml(self, file_path: Path) -> Dict:
        """Read YAML file."""
        if not file_path.exists():
            return {}
        with open(file_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f) or {}

    def _write_yaml(self, file_path: Path, data: Dict):
        """Write YAML file."""
        file_path.parent.mkdir(parents=True, exist_ok=True)
        # Convert data to plain dict/list to avoid Python object tags
        plain_data = json.loads(json.dumps(data))
        with open(file_path, 'w', encoding='utf-8') as f:
            yaml.safe_dump(plain_data, f, allow_unicode=True, default_flow_style=False)

    def _get_head_target(self, item_type: str, item_id: str, slug: str) -> Optional[str]:
        """Get the target of HEAD pointer."""
        item_dir = self._get_item_directory(item_type, item_id, slug)
        head_file = item_dir / "HEAD"

        if not head_file.exists():
            return None

        return head_file.read_text().strip()

    def _set_head_target(self, item_type: str, item_id: str, slug: str, version_filename: str):
        """Set HEAD pointer to a version file."""
        item_dir = self._get_item_directory(item_type, item_id, slug)
        head_file = item_dir / "HEAD"
        head_file.parent.mkdir(parents=True, exist_ok=True)
        head_file.write_text(f"versions/{version_filename}")

    def create_item(self, item_type: str, metadata: Dict, content: str) -> Tuple[str, str]:
        """
        Create a new item (prompt/template).

        Args:
            item_type: 'prompt' or 'template'
            metadata: Item metadata
            content: Item content (markdown body)

        Returns:
            Tuple of (item_id, version_id)
        """
        item_id = metadata.get('id') or generate_ulid()
        slug = metadata.get('slug', item_id)

        # Ensure ID is in metadata
        metadata['id'] = item_id

        # Create directory structure
        item_dir = self._get_item_directory(item_type, item_id, slug)
        versions_dir = self._get_versions_directory(item_type, item_id, slug)
        versions_dir.mkdir(parents=True, exist_ok=True)

        # Generate version ID
        version_id = self._generate_version_id()
        version_filename = self._get_version_filename(item_type, slug, item_id, version_id)
        version_path = versions_dir / version_filename

        # Write version file (frontmatter + content)
        frontmatter = f"---\n{json.dumps(metadata, indent=2, ensure_ascii=False)}\n---\n\n"
        version_path.write_text(frontmatter + content, encoding='utf-8')

        # Update HEAD
        self._set_head_target(item_type, item_id, slug, version_filename)

        # Write metadata YAML
        yaml_path = item_dir / f"{item_type}.yaml"
        self._write_yaml(yaml_path, metadata)

        return item_id, version_id

    def create_version(self, item_type: str, item_id: str, slug: str,
                      metadata: Dict, content: str) -> str:
        """
        Create a new version of an existing item.

        Args:
            item_type: 'prompt' or 'template'
            item_id: Item ID
            slug: Item slug
            metadata: Updated metadata
            content: Updated content

        Returns:
            version_id
        """
        item_dir = self._get_item_directory(item_type, item_id, slug)
        if not item_dir.exists():
            raise ResourceNotFoundError(f"{item_type.capitalize()} {item_id} not found")

        versions_dir = self._get_versions_directory(item_type, item_id, slug)

        # Generate version ID
        version_id = self._generate_version_id()
        version_filename = self._get_version_filename(item_type, slug, item_id, version_id)
        version_path = versions_dir / version_filename

        # Write version file (immutable)
        frontmatter = f"---\n{json.dumps(metadata, indent=2, ensure_ascii=False)}\n---\n\n"
        version_path.write_text(frontmatter + content, encoding='utf-8')

        # Update HEAD
        self._set_head_target(item_type, item_id, slug, version_filename)

        # Update metadata YAML
        yaml_path = item_dir / f"{item_type}.yaml"
        metadata['updated_at'] = datetime.utcnow().isoformat()
        self._write_yaml(yaml_path, metadata)

        return version_id

    def read_version(self, item_type: str, item_id: str, slug: str,
                    version_id: Optional[str] = None) -> Tuple[Dict, str]:
        """
        Read a specific version or HEAD.

        Args:
            item_type: 'prompt' or 'template'
            item_id: Item ID
            slug: Item slug
            version_id: Version ID, or None for HEAD

        Returns:
            Tuple of (metadata, content)
        """
        item_dir = self._get_item_directory(item_type, item_id, slug)
        if not item_dir.exists():
            raise ResourceNotFoundError(f"{item_type.capitalize()} {item_id} not found")

        if version_id:
            # Read specific version
            version_filename = self._get_version_filename(item_type, slug, item_id, version_id)
            version_path = self._get_versions_directory(item_type, item_id, slug) / version_filename
        else:
            # Read HEAD
            head_target = self._get_head_target(item_type, item_id, slug)
            if not head_target:
                raise ResourceNotFoundError(f"No HEAD version for {item_type} {item_id}")
            version_path = item_dir / head_target

        if not version_path.exists():
            raise ResourceNotFoundError(f"Version {version_id} not found")

        # Parse frontmatter
        content = version_path.read_text(encoding='utf-8')
        from apps.core.utils.frontmatter import parse_frontmatter
        metadata, body = parse_frontmatter(content)

        return metadata, body

    def list_versions(self, item_type: str, item_id: str, slug: str) -> List[Dict]:
        """
        List all versions of an item.

        Args:
            item_type: 'prompt' or 'template'
            item_id: Item ID
            slug: Item slug

        Returns:
            List of version info dicts
        """
        versions_dir = self._get_versions_directory(item_type, item_id, slug)
        if not versions_dir.exists():
            return []

        prefix = "pv" if item_type == "prompt" else "tv"
        versions = []

        for version_file in sorted(versions_dir.glob(f"{prefix}_*.md"), reverse=True):
            # Extract version_id from filename
            # Format: pv_{slug}-{id}_{version_id}.md
            filename = version_file.stem
            parts = filename.split('_', 2)
            if len(parts) >= 3:
                version_id = parts[2]
                versions.append({
                    'version_id': version_id,
                    'filename': version_file.name,
                    'created_at': version_id.split('_')[0],  # Timestamp part
                    'size': version_file.stat().st_size,
                })

        return versions

    def delete_item(self, item_type: str, item_id: str, slug: str):
        """
        Delete an item and all its versions.

        Args:
            item_type: 'prompt' or 'template'
            item_id: Item ID
            slug: Item slug
        """
        item_dir = self._get_item_directory(item_type, item_id, slug)
        if item_dir.exists():
            shutil.rmtree(item_dir)

    def get_item_metadata(self, item_type: str, item_id: str, slug: str) -> Dict:
        """
        Get item metadata from YAML file.

        Args:
            item_type: 'prompt' or 'template'
            item_id: Item ID
            slug: Item slug

        Returns:
            Metadata dict
        """
        item_dir = self._get_item_directory(item_type, item_id, slug)
        yaml_path = item_dir / f"{item_type}.yaml"

        if not yaml_path.exists():
            raise ResourceNotFoundError(f"{item_type.capitalize()} {item_id} not found")

        return self._read_yaml(yaml_path)

    # Chat operations (simpler, no versioning)

    def create_chat(self, chat_data: Dict) -> str:
        """
        Create a new chat.

        Args:
            chat_data: Chat data including id, title, messages, etc.

        Returns:
            chat_id
        """
        chat_id = chat_data.get('id') or generate_ulid()
        chat_data['id'] = chat_id

        # Determine filename
        title_slug = chat_data.get('title', chat_id).lower().replace(' ', '-')[:50]
        filename = f"chat_{title_slug}-{chat_id}.json"

        chat_path = self.storage_root / 'chats' / filename
        chat_path.parent.mkdir(parents=True, exist_ok=True)

        # Write JSON
        with open(chat_path, 'w', encoding='utf-8') as f:
            json.dump(chat_data, f, indent=2, ensure_ascii=False)

        return chat_id

    def read_chat(self, chat_id: str) -> Dict:
        """
        Read a chat by ID.

        Args:
            chat_id: Chat ID

        Returns:
            Chat data
        """
        chats_dir = self.storage_root / 'chats'

        # Find chat file
        for chat_file in chats_dir.glob(f"chat_*-{chat_id}.json"):
            with open(chat_file, 'r', encoding='utf-8') as f:
                return json.load(f)

        raise ResourceNotFoundError(f"Chat {chat_id} not found")

    def update_chat(self, chat_id: str, chat_data: Dict):
        """
        Update a chat.

        Args:
            chat_id: Chat ID
            chat_data: Updated chat data
        """
        chats_dir = self.storage_root / 'chats'

        # Find and update chat file
        for chat_file in chats_dir.glob(f"chat_*-{chat_id}.json"):
            chat_data['updated_at'] = datetime.utcnow().isoformat()
            with open(chat_file, 'w', encoding='utf-8') as f:
                json.dump(chat_data, f, indent=2, ensure_ascii=False)
            return

        raise ResourceNotFoundError(f"Chat {chat_id} not found")

    def delete_chat(self, chat_id: str):
        """
        Delete a chat.

        Args:
            chat_id: Chat ID
        """
        chats_dir = self.storage_root / 'chats'

        for chat_file in chats_dir.glob(f"chat_*-{chat_id}.json"):
            chat_file.unlink()
            return

        raise ResourceNotFoundError(f"Chat {chat_id} not found")

    def list_all_items(self, item_type: str) -> List[Dict]:
        """
        List all items of a specific type.

        Args:
            item_type: 'prompt' or 'template'

        Returns:
            List of item metadata
        """
        items_dir = self.storage_root / f"{item_type}s"
        items = []

        for item_dir in items_dir.glob(f"{item_type}_*"):
            if item_dir.is_dir():
                yaml_path = item_dir / f"{item_type}.yaml"
                if yaml_path.exists():
                    metadata = self._read_yaml(yaml_path)
                    items.append(metadata)

        return items

    def list_all_chats(self) -> List[Dict]:
        """
        List all chats.

        Returns:
            List of chat data
        """
        chats_dir = self.storage_root / 'chats'
        chats = []

        for chat_file in chats_dir.glob("chat_*.json"):
            with open(chat_file, 'r', encoding='utf-8') as f:
                chats.append(json.load(f))

        return chats
