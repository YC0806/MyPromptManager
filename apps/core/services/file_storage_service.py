"""
File-based storage service for prompts, templates, and chats.
Replaces Git-based storage with file-based versioning system.
"""
import os
import json
import yaml
import shutil
from pathlib import Path
from typing import Optional, List, Dict, Tuple, Union
import datetime
import hashlib

from filelock import FileLock
from django.conf import settings

from apps.core.exceptions import ResourceNotFoundError, ConflictError, ValidationError
from apps.core.utils.id_generator import generate_ulid
from apps.core.domain.metadata import Metadata, VersionSummary
from apps.core.domain.version import VersionData, TemplateVersionData, TemplateVariable


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
        """Generate a unique version ID."""
        suffix = generate_ulid()[-5:]  # Last 5 chars of ULID
        return suffix

    def _get_item_directory(self, item_type: str, item_id: str) -> Path:
        """Get directory path for an item."""
        dir_name = f"{item_type}-{item_id}"
        return self.storage_root / f"{item_type}s" / dir_name

    def _get_versions_directory(self, item_type: str, item_id: str) -> Path:
        """Get versions directory path for an item."""
        item_dir = self._get_item_directory(item_type, item_id)
        return item_dir / "versions"

    def _get_version_filename(self, item_type: str, item_id: str, version_id: str) -> str:
        """Generate version filename."""
        prefix = "pv" if item_type == "prompt" else "tv"
        return f"{prefix}-{item_id}_{version_id}.md"

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

    def _get_head_target(self, item_type: str, item_id: str) -> Optional[str]:
        """Get the target of HEAD pointer."""
        item_dir = self._get_item_directory(item_type, item_id)
        head_file = item_dir / "HEAD"

        if not head_file.exists():
            return None

        return head_file.read_text().strip()

    def _set_head_target(self, item_type: str, item_id: str, version_filename: str):
        """Set HEAD pointer to a version file."""
        item_dir = self._get_item_directory(item_type, item_id)
        head_file = item_dir / "HEAD"
        head_file.parent.mkdir(parents=True, exist_ok=True)
        head_file.write_text(f"versions/{version_filename}")

    def load_metadata(self, item_type: str, item_id: str) -> Metadata:
        """
        Load metadata from YAML file.

        Args:
            item_type: 'prompt' or 'template'
            item_id: Item ID
        Returns:
            Metadata object
        """
        item_dir = self._get_item_directory(item_type, item_id)
        yaml_path = item_dir / f"{item_type}.yaml"

        if not yaml_path.exists():
            raise ResourceNotFoundError(f"{item_type.capitalize()} {item_id} not found")

        data = self._read_yaml(yaml_path)
        return Metadata.from_dict(data)
    
    def create_version(self, metadata: Metadata, version_number: str, content: str, variables: Optional[List[TemplateVariable]]) -> str:
        """
        Create a new version of an existing item.

        Args:
            metadata: Item metadata
            version_number: Version number
            content: Updated content

        Returns:
            version_id
        """
        item_type = metadata.type
        item_id = metadata.id

        item_dir = self._get_item_directory(item_type, item_id)
        if not item_dir.exists():
            raise ResourceNotFoundError(f"{item_type.capitalize()} {item_id} not found")

        versions_dir = self._get_versions_directory(item_type, item_id)

        # Generate version ID
        version_id = self._generate_version_id()
        version_filename = self._get_version_filename(item_type, item_id, version_id)
        version_path = versions_dir / version_filename

        # Build minimal frontmatter for version file
        # Only store: id, created_at, created_by, and variables (for templates)
        if item_type == 'prompt':
            version_data = VersionData(
                id=version_id,
                version_number=version_number,
                created_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                author=metadata.author,
                content=content,
            )
        elif item_type == 'template':
            version_data = TemplateVersionData(
                id=version_id,
                version_number=version_number,
                created_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                author=metadata.author,
                content=content,
                variables=variables,
            )
        else:
            raise ValidationError(f"Invalid item type: {item_type}")

        # Write version file (immutable, minimal frontmatter)
        try:
            version_text = version_data.to_text()
        except Exception as e:
            raise ValidationError(f"Error serializing version data: {str(e)}")
        
        version_path.write_text(version_text, encoding='utf-8')

        metadata.updated_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
        metadata.versions.append(
            VersionSummary(
                id=version_id,
                version_number=version_number,
                created_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
            )
        )

        # Write full metadata to YAML
        yaml_path = item_dir / f"{item_type}.yaml"
        self._write_yaml(yaml_path, metadata.__dict__())

        # Update HEAD
        self._set_head_target(item_type, item_id, version_filename)

        return version_id
    

    def create_item(self, item_type: str, metadata: Metadata, content: str, variables: Optional[List[TemplateVariable]]) -> Tuple[str, str]:
        """
        Create a new item (prompt/template).

        Args:
            item_type: 'prompt' or 'template'
            metadata: Item metadata (stored in YAML)
            content: Item content (markdown body)

        Returns:
            Tuple of (item_id, version_id)
        """
        item_id = metadata.id or generate_ulid()

        # Ensure ID is in metadata
        metadata.id = item_id

        # Create directory structure
        item_dir = self._get_item_directory(item_type, item_id)
        versions_dir = self._get_versions_directory(item_type, item_id)
        versions_dir.mkdir(parents=True, exist_ok=True)

        # Create initial version
        version_id = self.create_version(metadata, "inital", content, variables)

        return item_id, version_id



    def read_version(self, item_type: str, item_id: str,
                    version_id: Optional[str] = None) -> Tuple[Metadata,  Union[VersionData, TemplateVersionData]]:
        """
        Read a specific version or HEAD.

        Args:
            item_type: 'prompt' or 'template'
            item_id: Item ID
            version_id: Version ID, or None for HEAD

        Returns:
            VersionData or TemplateVersionData object
        """
        item_dir = self._get_item_directory(item_type, item_id)
        if not item_dir.exists():
            raise ResourceNotFoundError(f"{item_type.capitalize()} {item_id} not found")

        if version_id:
            # Read specific version
            version_filename = self._get_version_filename(item_type, item_id, version_id)
            version_path = self._get_versions_directory(item_type, item_id) / version_filename
        else:
            # Read HEAD
            head_target = self._get_head_target(item_type, item_id)
            if not head_target:
                Warning(f"No HEAD found for {item_type} {item_id}")
                return None
            version_path = item_dir / head_target

        if not version_path.exists():
            raise ResourceNotFoundError(f"Version {version_id} not found")

        # Parse frontmatter from version file (minimal: id, created_at, created_by, variables)
        content = version_path.read_text(encoding='utf-8')
        if item_type == 'prompt':
            version_data = VersionData.from_text(content)
        elif item_type == 'template':
            version_data = TemplateVersionData.from_text(content)
        else:
            raise ValidationError(f"Invalid item type: {item_type}")    

        return version_data

    def list_versions(self, item_type: str, item_id: str) -> List[VersionSummary]:
        """
        List all versions of an item.

        Args:
            item_type: 'prompt' or 'template'
            item_id: Item ID

        Returns:
            List of version summaries
        """
        metadata = self.load_metadata(item_type, item_id)
        return metadata.versions

    def delete_item(self, item_type: str, item_id: str):
        """
        Delete an item and all its versions.

        Args:
            item_type: 'prompt' or 'template'
            item_id: Item ID
        """
        item_dir = self._get_item_directory(item_type, item_id)
        if item_dir.exists():
            shutil.rmtree(item_dir)

    def delete_version(self, item_type: str, item_id: str, version_id: str) :
        """
        Delete a specific version of an item.

        Args:
            item_type: 'prompt' or 'template'
            item_id: Item ID
            version_id: Version ID
        """
        item_dir = self._get_item_directory(item_type, item_id)
        if not item_dir.exists():
            raise ResourceNotFoundError(f"{item_type.capitalize()} {item_id} not found")

        versions_dir = self._get_versions_directory(item_type, item_id)
        version_filename = self._get_version_filename(item_type, item_id, version_id)
        version_path = versions_dir / version_filename

        if not version_path.exists():
            raise ResourceNotFoundError(f"Version {version_id} not found")

        # Delete version file
        version_path.unlink()

        # Update metadata
        metadata = self.load_metadata(item_type, item_id)
        metadata.versions = [v for v in metadata.versions if v.id != version_id]

        # Write updated metadata
        yaml_path = item_dir / f"{item_type}.yaml"
        self._write_yaml(yaml_path, metadata.__dict__())

        # If deleted version was HEAD, update HEAD to latest version
        head_target = self._get_head_target(item_type, item_id)
        if head_target == f"versions/{version_filename}":
            if metadata.versions:
                latest_version = metadata.versions[-1]
                new_head_filename = self._get_version_filename(item_type, item_id, latest_version.id)
                self._set_head_target(item_type, item_id, new_head_filename)
            else:
                # No versions left, remove HEAD
                head_file = item_dir / "HEAD"
                if head_file.exists():
                    head_file.unlink()

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
            chat_data['updated_at'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
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

    def list_all_items(self, item_type: str) -> List[Metadata]:
        """
        List all items of a specific type.

        Args:
            item_type: 'prompt' or 'template'

        Returns:
            List of item metadata
        """
        items_dir = self.storage_root / f"{item_type}s"
        items = []

        
        for item_dir in items_dir.glob(f"{item_type}-*"):
            if item_dir.is_dir():
                yaml_path = item_dir / f"{item_type}.yaml"
                if yaml_path.exists():
                    items.append(Metadata.from_dict(self._read_yaml(yaml_path)))

        return items

    def list_all_chats(self) -> List[Dict]:
        """
        List all chats.

        Returns:
            List of chat data
        """
        chats_dir = self.storage_root / 'chats'
        chats = []

        if not chats_dir.exists():
            return chats

        for chat_file in chats_dir.glob("chat_*.json"):
            with open(chat_file, 'r', encoding='utf-8') as f:
                chats.append(json.load(f))

        return chats

    def find_chat_by_conversation(self, provider: str, conversation_id: str) -> Optional[Dict]:
        """
        Find a chat by provider and conversation_id.

        Args:
            provider: AI provider name (e.g., 'ChatGPT', 'Claude')
            conversation_id: Conversation ID from the provider

        Returns:
            Chat data if found, None otherwise
        """
        chats = self.list_all_chats()

        for chat in chats:
            if (chat.get('provider', '').lower() == provider.lower() and
                chat.get('conversation_id') == conversation_id):
                return chat

        return None
