"""
Index management service for index.json.
Provides fast search/lookup with file locking for concurrency control.
"""
import json
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime

from filelock import FileLock
from django.conf import settings

from backend.apps.core.exceptions import IndexLockError
from backend.apps.core.utils.frontmatter import extract_metadata_fields


class IndexService:
    """Service for managing index.json with file locking."""

    def __init__(self):
        self.index_path = Path(settings.INDEX_PATH)
        self.lock_path = Path(settings.INDEX_LOCK_PATH)
        self.lock_timeout = 30  # seconds

    def _ensure_index_exists(self):
        """Ensure index.json exists with proper structure."""
        if not self.index_path.exists():
            self.index_path.parent.mkdir(parents=True, exist_ok=True)
            initial_data = {
                'prompts': [],
                'templates': [],
                'chats': [],
                'last_updated': datetime.utcnow().isoformat(),
                'last_error': None,
            }
            self.index_path.write_text(json.dumps(initial_data, indent=2))

    def _read_index(self) -> Dict:
        """Read index.json (requires lock to be held)."""
        self._ensure_index_exists()
        try:
            return json.loads(self.index_path.read_text())
        except json.JSONDecodeError:
            return {
                'prompts': [],
                'templates': [],
                'chats': [],
                'last_error': 'index.json corrupted',
            }

    def _write_index(self, data: Dict):
        """Write index.json atomically (requires lock to be held)."""
        # Write to temp file then atomic rename
        temp_path = self.index_path.with_suffix('.tmp')
        data.setdefault('last_error', None)
        data['last_updated'] = datetime.utcnow().isoformat()
        temp_path.write_text(json.dumps(data, indent=2))
        temp_path.replace(self.index_path)

    def search(self, type_filter: Optional[str] = None,
               labels: Optional[List[str]] = None,
               slug: Optional[str] = None,
               author: Optional[str] = None,
               limit: int = 50,
               cursor: Optional[str] = None) -> Dict:
        """
        Search index with filters.

        Args:
            type_filter: Filter by type (prompt/template)
            labels: Filter by labels (AND logic)
            slug: Filter by slug
            author: Filter by author
            limit: Max results
            cursor: Pagination cursor (last item id)

        Returns:
            Dict with results and next cursor
        """
        lock = FileLock(str(self.lock_path), timeout=self.lock_timeout)

        try:
            with lock:
                index_data = self._read_index()
                results = []

                # Determine which collection to search
                collections = []
                if not type_filter or type_filter == 'prompt':
                    collections.append(index_data.get('prompts', []))
                if not type_filter or type_filter == 'template':
                    collections.append(index_data.get('templates', []))
                if not type_filter or type_filter == 'chat':
                    collections.append(index_data.get('chats', []))

                # Flatten and sort by updated_at descending (most recent first)
                all_items = []
                for collection in collections:
                    all_items.extend(collection)

                # Sort by updated_at (most recent first)
                all_items.sort(key=lambda x: x.get('updated_at', x.get('created_at', '')), reverse=True)

                # Apply filters
                for item in all_items:
                    # Cursor-based pagination
                    if cursor and item.get('id') <= cursor:
                        continue

                    # Slug filter
                    if slug and item.get('slug') != slug:
                        continue

                    # Author filter
                    if author and item.get('author') != author:
                        continue

                    # Labels filter (must have all specified labels)
                    if labels:
                        item_labels = item.get('labels', [])
                        if not all(label in item_labels for label in labels):
                            continue

                    results.append(item)

                    if len(results) >= limit:
                        break

                # Determine next cursor
                next_cursor = results[-1]['id'] if len(results) == limit else None

                return {
                    'items': results,
                    'count': len(results),
                    'next_cursor': next_cursor,
                }

        except Exception as e:
            raise IndexLockError(f"Failed to search index: {str(e)}")

    def add_or_update(self, prompt_id: str, metadata: Dict, file_path: str,
                     sha: str) -> None:
        """
        Add or update a prompt/template in the index.

        Args:
            prompt_id: ULID of the prompt
            metadata: Front matter metadata
            file_path: Relative file path in repo
            sha: Git blob SHA
        """
        lock = FileLock(str(self.lock_path), timeout=self.lock_timeout)

        try:
            with lock:
                index_data = self._read_index()

                # Extract standard fields
                fields = extract_metadata_fields(metadata)
                item_type = fields.get('type', 'prompt')

                # Determine collection based on type
                if item_type == 'chat':
                    collection_key = 'chats'
                elif item_type == 'template':
                    collection_key = 'templates'
                else:
                    collection_key = 'prompts'
                collection = index_data.get(collection_key, [])

                # Create index entry
                entry = {
                    'id': prompt_id,
                    'type': item_type,
                    'title': fields['title'],
                    'description': fields['description'],
                    'slug': fields['slug'],
                    'labels': fields['labels'],
                    'author': fields['author'],
                    'created_at': fields['created_at'],
                    'updated_at': datetime.utcnow().isoformat(),
                    'file_path': file_path,
                    'sha': sha,
                }

                # Find and update or append
                found = False
                for i, item in enumerate(collection):
                    if item['id'] == prompt_id:
                        collection[i] = entry
                        found = True
                        break

                if not found:
                    collection.append(entry)

                index_data[collection_key] = collection
                self._write_index(index_data)

        except Exception as e:
            raise IndexLockError(f"Failed to update index: {str(e)}")

    def remove(self, prompt_id: str) -> None:
        """
        Remove a prompt/template from index.

        Args:
            prompt_id: ULID of the prompt
        """
        lock = FileLock(str(self.lock_path), timeout=self.lock_timeout)

        try:
            with lock:
                index_data = self._read_index()

                # Remove from all collections
                for collection_key in ['prompts', 'templates', 'chats']:
                    collection = index_data.get(collection_key, [])
                    index_data[collection_key] = [
                        item for item in collection if item['id'] != prompt_id
                    ]

                self._write_index(index_data)

        except Exception as e:
            raise IndexLockError(f"Failed to remove from index: {str(e)}")

    def get_by_id(self, prompt_id: str) -> Optional[Dict]:
        """
        Get prompt/template by ID.

        Args:
            prompt_id: ULID of the prompt

        Returns:
            Index entry or None
        """
        lock = FileLock(str(self.lock_path), timeout=self.lock_timeout)

        try:
            with lock:
                index_data = self._read_index()

                # Search in all collections
                for collection_key in ['prompts', 'templates', 'chats']:
                    collection = index_data.get(collection_key, [])
                    for item in collection:
                        if item['id'] == prompt_id:
                            return item

                return None

        except Exception as e:
            raise IndexLockError(f"Failed to read index: {str(e)}")

    def rebuild(self, storage_service) -> Dict:
        """
        Rebuild index from file storage.

        Args:
            storage_service: FileStorageService instance

        Returns:
            Dict with rebuild statistics
        """
                lock = FileLock(str(self.lock_path), timeout=self.lock_timeout)

        try:
            with lock:
                new_index = {
                    'prompts': [],
                    'templates': [],
                    'chats': [],
                    'last_error': None,
                }

                stats = {
                    'prompts_added': 0,
                    'templates_added': 0,
                    'chats_added': 0,
                    'errors': [],
                }

                # Scan storage for prompts
                try:
                    prompts = storage_service.list_all_items('prompt')
                    for prompt in prompts:
                        try:
                            fields = extract_metadata_fields(prompt)
                            head_version = prompt.versions[-1] if prompt.versions else None
                            entry = {
                                'id': fields['id'],
                                'type': 'prompt',
                                'title': fields['title'],
                                'description': fields['description'],
                                'slug': fields['slug'],
                                'labels': fields['labels'],
                                'author': fields['author'],
                                'created_at': fields['created_at'],
                                'updated_at': fields['updated_at'],
                                'version_count': len(prompt.versions),
                                'head_version_id': head_version.id if head_version else None,
                                'head_version_number': head_version.version_number if head_version else None,
                                'file_path': f"prompts/prompt_{fields['slug']}-{fields['id']}/HEAD",
                                'sha': 'latest',
                            }
                            new_index['prompts'].append(entry)
                            stats['prompts_added'] += 1
                        except Exception as e:
                            stats['errors'].append({
                                'item': prompt.get('id', 'unknown'),
                                'error': str(e),
                            })
                except Exception as e:
                    stats['errors'].append({
                        'type': 'prompts',
                        'error': str(e),
                    })

                # Scan storage for templates
                try:
                    templates = storage_service.list_all_items('template')
                    for template in templates:
                        try:
                            fields = extract_metadata_fields(template)
                            head_version = template.versions[-1] if template.versions else None
                            entry = {
                                'id': fields['id'],
                                'type': 'template',
                                'title': fields['title'],
                                'description': fields['description'],
                                'slug': fields['slug'],
                                'labels': fields['labels'],
                                'author': fields['author'],
                                'created_at': fields['created_at'],
                                'updated_at': fields['updated_at'],
                                'version_count': len(template.versions),
                                'head_version_id': head_version.id if head_version else None,
                                'head_version_number': head_version.version_number if head_version else None,
                                'file_path': f"templates/template_{fields['slug']}-{fields['id']}/HEAD",
                                'sha': 'latest',
                            }
                            new_index['templates'].append(entry)
                            stats['templates_added'] += 1
                        except Exception as e:
                            stats['errors'].append({
                                'item': template.get('id', 'unknown'),
                                'error': str(e),
                            })
                except Exception as e:
                    stats['errors'].append({
                        'type': 'templates',
                        'error': str(e),
                    })

                # Scan storage for chats
                try:
                    chats = storage_service.list_all_chats()
                    for chat in chats:
                        try:
                            entry = {
                                'id': chat.get('id'),
                                'type': 'chat',
                                'title': chat.get('title', ''),
                                'description': chat.get('description', ''),
                                'slug': chat.get('id'),  # Use ID as slug for chats
                                'labels': chat.get('tags', []),
                                'author': chat.get('author', 'system'),
                                'provider': chat.get('provider'),
                                'model': chat.get('model'),
                                'conversation_id': chat.get('conversation_id'),
                                'turn_count': chat.get('turn_count', 0),
                                'created_at': chat.get('created_at', datetime.utcnow().isoformat()),
                                'updated_at': chat.get('updated_at', datetime.utcnow().isoformat()),
                                'file_path': f"chats/chat_{chat.get('id')}.json",
                                'sha': 'latest',
                            }
                            new_index['chats'].append(entry)
                            stats['chats_added'] += 1
                        except Exception as e:
                            stats['errors'].append({
                                'item': chat.get('id', 'unknown'),
                                'error': str(e),
                            })
                except Exception as e:
                    stats['errors'].append({
                        'type': 'chats',
                        'error': str(e),
                    })

                # Persist last error if any
                if stats['errors']:
                    new_index['last_error'] = stats['errors'][0].get('error')

                self._write_index(new_index)
                return stats

        except Exception as e:
            raise IndexLockError(f"Failed to rebuild index: {str(e)}")

    def get_status(self) -> Dict:
        """
        Get index status information.

        Returns:
            Dict with status info
        """
        lock = FileLock(str(self.lock_path), timeout=self.lock_timeout)

        try:
            with lock:
                index_data = self._read_index()

                return {
                    'prompts_count': len(index_data.get('prompts', [])),
                    'templates_count': len(index_data.get('templates', [])),
                    'chats_count': len(index_data.get('chats', [])),
                    'last_updated': index_data.get('last_updated'),
                    'index_size_bytes': self.index_path.stat().st_size if self.index_path.exists() else 0,
                }

        except Exception as e:
            raise IndexLockError(f"Failed to get index status: {str(e)}")
