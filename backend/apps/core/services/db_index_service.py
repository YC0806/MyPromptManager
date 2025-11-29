"""
Database-backed index service for fast search and lookup.
Replaces file-based index.json with PostgreSQL database.
"""
from typing import List, Dict, Optional
from datetime import datetime
from django.db import models, transaction
from django.db.models import Q, Count
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank

from backend.apps.core.models import IndexedItem
from backend.apps.core.domain.index_record import IndexRecord
from backend.apps.core.domain.enums import ItemType
from backend.apps.core.utils.pagination import encode_cursor, decode_cursor, parse_datetime


class DBIndexService:
    """
    Database-backed index service.
    Provides search, filtering, and fast lookups using PostgreSQL.
    """

    def add_or_update(self, record: IndexRecord) -> None:
        """
        Add or update an item in the index.

        Args:
            record: IndexRecord instance
        """
        # Parse datetime strings
        created_at = parse_datetime(record.created_at) if record.created_at else datetime.now()
        updated_at = parse_datetime(record.updated_at) if record.updated_at else datetime.now()

        # Update or create
        IndexedItem.objects.update_or_create(
            id=record.id,
            defaults={
                'item_type': record.item_type.value,
                'title': record.title,
                'description': record.description,
                'slug': record.slug,
                'labels': record.labels,
                'author': record.author,
                'created_at': created_at,
                'updated_at': updated_at,
                'version_count': record.version_count,
                'head_version_id': record.head_version_id,
                'head_version_number': record.head_version_number,
                'file_path': record.file_path,
                'sha': record.sha,
                'provider': record.provider,
                'model': record.model,
                'conversation_id': record.conversation_id,
                'turn_count': record.turn_count,
            }
        )

    def remove(self, item_id: str) -> None:
        """
        Remove an item from the index.

        Args:
            item_id: Item ID
        """
        IndexedItem.objects.filter(id=item_id).delete()

    def get_by_id(self, item_id: str) -> Optional[IndexRecord]:
        """
        Get an item by ID.

        Args:
            item_id: Item ID

        Returns:
            IndexRecord or None
        """
        try:
            item = IndexedItem.objects.get(id=item_id)
            return self._item_to_record(item)
        except IndexedItem.DoesNotExist:
            return None

    def search(self,
               type_filter: Optional[str] = None,
               labels: Optional[List[str]] = None,
               slug: Optional[str] = None,
               author: Optional[str] = None,
               provider: Optional[str] = None,
               query: Optional[str] = None,
               limit: int = 50,
               cursor: Optional[str] = None) -> Dict:
        """
        Search index with filters and pagination.

        Args:
            type_filter: Filter by type (prompt/template/chat)
            labels: Filter by labels (AND logic - must have all)
            slug: Filter by exact slug
            author: Filter by author
            provider: Filter by provider (for chats)
            query: Text search query (title, description, slug)
            limit: Max results
            cursor: Pagination cursor

        Returns:
            Dict with items, count, and next_cursor
        """
        queryset = IndexedItem.objects.all()

        # Apply filters
        if type_filter:
            queryset = queryset.filter(item_type=type_filter)

        if slug:
            queryset = queryset.filter(slug=slug)

        if author:
            queryset = queryset.filter(author=author)

        if provider:
            queryset = queryset.filter(provider=provider)

        if labels:
            # AND logic: must contain all specified labels
            # For SQLite: filter in Python since JSON field doesn't support contains
            # This is less efficient but works across all databases
            for label in labels:
                # Filter using JSON contains - works in memory for SQLite
                queryset = [item for item in queryset if label in item.labels]
                # Convert back to queryset
                item_ids = [item.id if hasattr(item, 'id') else item['id'] for item in queryset]
                queryset = IndexedItem.objects.filter(id__in=item_ids)

        # Text search
        if query:
            queryset = self._apply_text_search(queryset, query)

        # Cursor-based pagination
        if cursor:
            cursor_data = decode_cursor(cursor)
            if cursor_data:
                cursor_updated_at, cursor_id = cursor_data
                cursor_dt = parse_datetime(cursor_updated_at)

                # Keyset pagination: (updated_at, id) ordering
                queryset = queryset.filter(
                    Q(updated_at__lt=cursor_dt) |
                    Q(updated_at=cursor_dt, id__lt=cursor_id)
                )

        # Order by updated_at DESC, id DESC (already in Meta.ordering)
        queryset = queryset.order_by('-updated_at', '-id')

        # Fetch limit + 1 to determine if there's a next page
        items_list = list(queryset[:limit + 1])

        has_more = len(items_list) > limit
        if has_more:
            items_list = items_list[:limit]

        # Convert to IndexRecord
        results = [self._item_to_record(item) for item in items_list]

        # Generate next cursor
        next_cursor = None
        if has_more and results:
            last_item = results[-1]
            next_cursor = encode_cursor(last_item.updated_at, last_item.id)

        return {
            'items': [r.to_response_dict() for r in results],
            'count': len(results),
            'next_cursor': next_cursor,
        }

    def get_status(self) -> Dict:
        """
        Get index status information.

        Returns:
            Dict with status info
        """
        # Count by type
        stats = IndexedItem.objects.values('item_type').annotate(
            count=Count('id')
        )

        prompts_count = 0
        templates_count = 0
        chats_count = 0

        for stat in stats:
            if stat['item_type'] == 'prompt':
                prompts_count = stat['count']
            elif stat['item_type'] == 'template':
                templates_count = stat['count']
            elif stat['item_type'] == 'chat':
                chats_count = stat['count']

        # Get last updated
        last_updated = IndexedItem.objects.aggregate(
            max_updated=models.Max('updated_at')
        )['max_updated']

        return {
            'prompts_count': prompts_count,
            'templates_count': templates_count,
            'chats_count': chats_count,
            'last_updated': last_updated.isoformat() if last_updated else None,
            'index_size_bytes': 0,  # Not applicable for DB
        }

    def rebuild(self, storage_service) -> Dict:
        """
        Rebuild index from file storage.

        Args:
            storage_service: FileStorageService instance

        Returns:
            Dict with rebuild statistics
        """
        stats = {
            'prompts_added': 0,
            'templates_added': 0,
            'chats_added': 0,
            'errors': [],
        }

        with transaction.atomic():
            # Clear existing index
            IndexedItem.objects.all().delete()

            # Rebuild prompts
            try:
                prompts = storage_service.list_all_items('prompt')
                for prompt in prompts:
                    try:
                        # Convert to PromptMeta then to IndexRecord
                        from backend.apps.core.domain.base_meta import PromptMeta
                        prompt_meta = PromptMeta.from_file_dict(prompt.__dict__())
                        record = prompt_meta.to_index_record()
                        self.add_or_update(record)
                        stats['prompts_added'] += 1
                    except Exception as e:
                        stats['errors'].append({
                            'item': prompt.id if hasattr(prompt, 'id') else 'unknown',
                            'type': 'prompt',
                            'error': str(e),
                        })
            except Exception as e:
                stats['errors'].append({
                    'type': 'prompts',
                    'error': str(e),
                })

            # Rebuild templates
            try:
                templates = storage_service.list_all_items('template')
                for template in templates:
                    try:
                        from backend.apps.core.domain.base_meta import TemplateMeta
                        template_meta = TemplateMeta.from_file_dict(template.__dict__())
                        record = template_meta.to_index_record()
                        self.add_or_update(record)
                        stats['templates_added'] += 1
                    except Exception as e:
                        stats['errors'].append({
                            'item': template.id if hasattr(template, 'id') else 'unknown',
                            'type': 'template',
                            'error': str(e),
                        })
            except Exception as e:
                stats['errors'].append({
                    'type': 'templates',
                    'error': str(e),
                })

            # Rebuild chats
            try:
                chats = storage_service.list_all_chats()
                for chat in chats:
                    try:
                        from backend.apps.core.domain.base_meta import ChatMeta
                        chat_meta = ChatMeta.from_file_dict(chat.__dict__())
                        record = chat_meta.to_index_record()
                        self.add_or_update(record)
                        stats['chats_added'] += 1
                    except Exception as e:
                        stats['errors'].append({
                            'item': chat.id if hasattr(chat, 'id') else 'unknown',
                            'type': 'chat',
                            'error': str(e),
                        })
            except Exception as e:
                stats['errors'].append({
                    'type': 'chats',
                    'error': str(e),
                })

        return stats

    def _apply_text_search(self, queryset, query: str):
        """
        Apply text search to queryset.
        Uses PostgreSQL full-text search if available, falls back to icontains.

        Args:
            queryset: Django queryset
            query: Search query string

        Returns:
            Filtered queryset
        """
        try:
            # Try PostgreSQL full-text search
            search_vector = SearchVector('title', weight='A') + \
                          SearchVector('description', weight='B') + \
                          SearchVector('slug', weight='C')
            search_query = SearchQuery(query)

            return queryset.annotate(
                search=search_vector,
                rank=SearchRank(search_vector, search_query)
            ).filter(search=search_query).order_by('-rank', '-updated_at', '-id')

        except Exception:
            # Fallback to icontains for non-PostgreSQL databases
            return queryset.filter(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(slug__icontains=query)
            )

    def _item_to_record(self, item: IndexedItem) -> IndexRecord:
        """
        Convert Django model instance to IndexRecord.

        Args:
            item: IndexedItem instance

        Returns:
            IndexRecord
        """
        return IndexRecord(
            id=item.id,
            item_type=ItemType(item.item_type),
            title=item.title,
            description=item.description,
            slug=item.slug,
            labels=item.labels,
            author=item.author,
            created_at=item.created_at.isoformat(),
            updated_at=item.updated_at.isoformat(),
            version_count=item.version_count,
            head_version_id=item.head_version_id,
            head_version_number=item.head_version_number,
            file_path=item.file_path,
            sha=item.sha,
            provider=item.provider,
            model=item.model,
            conversation_id=item.conversation_id,
            turn_count=item.turn_count,
        )
