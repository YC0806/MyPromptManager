"""
Unified API views for prompts, templates, and chats.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from datetime import datetime

from apps.core.services.file_storage_service import FileStorageService
from apps.core.services.index_service import IndexService
from apps.core.utils.frontmatter import parse_frontmatter, serialize_frontmatter
from apps.core.exceptions import ResourceNotFoundError, ValidationError, BadRequestError


# ============================================================================
# Prompts
# ============================================================================

class PromptsListView(APIView):
    """
    GET /v1/prompts - List all prompts
    POST /v1/prompts - Create a new prompt
    """

    def get(self, request):
        """List all prompts."""
        storage = FileStorageService()
        prompts = storage.list_all_items('prompt')

        # Apply filters if provided
        type_filter = request.query_params.get('type')
        labels = request.query_params.getlist('labels')
        limit = int(request.query_params.get('limit', 100))

        if labels:
            prompts = [p for p in prompts if all(label in p.get('labels', []) for label in labels)]

        # Sort by updated_at descending
        prompts.sort(key=lambda x: x.get('updated_at', ''), reverse=True)

        return Response({
            'prompts': prompts[:limit],
            'count': len(prompts[:limit]),
            'total': len(prompts),
        })

    def post(self, request):
        """Create a new prompt."""
        content = request.data.get('content')
        if not content:
            raise BadRequestError("content is required")

        # Parse frontmatter
        metadata, body = parse_frontmatter(content)

        # Validate required fields
        if not metadata.get('title'):
            raise ValidationError("title is required in frontmatter")
        if not metadata.get('slug'):
            metadata['slug'] = metadata.get('title', '').lower().replace(' ', '-')[:50]

        # Set type
        metadata['type'] = 'prompt'

        # Set timestamps
        metadata['created_at'] = metadata.get('created_at') or datetime.utcnow().isoformat()
        metadata['updated_at'] = datetime.utcnow().isoformat()

        # Create prompt
        storage = FileStorageService()
        item_id, version_id = storage.create_item('prompt', metadata, body)

        # Add to index
        index_service = IndexService()
        slug = metadata['slug']
        metadata['id'] = item_id  # Add ID to metadata for indexing
        index_service.add_or_update(
            item_id,
            metadata,
            f"prompts/prompt_{slug}-{item_id}/versions/pv_{slug}-{item_id}_{version_id}.md",
            version_id
        )

        return Response({
            'id': item_id,
            'version_id': version_id,
            'created_at': metadata['created_at'],
        }, status=status.HTTP_201_CREATED)


class PromptDetailView(APIView):
    """
    GET /v1/prompts/{id} - Get prompt (HEAD version)
    PUT /v1/prompts/{id} - Update prompt (create new version)
    DELETE /v1/prompts/{id} - Delete prompt
    """

    def get(self, request, prompt_id):
        """Get prompt details (HEAD version)."""
        storage = FileStorageService()
        index_service = IndexService()

        # Get from index to find slug
        entry = index_service.get_by_id(prompt_id)
        if not entry:
            raise ResourceNotFoundError(f"Prompt {prompt_id} not found")

        slug = entry['slug']

        # Read HEAD version
        metadata, content = storage.read_version('prompt', prompt_id, slug)

        return Response({
            'id': prompt_id,
            'metadata': metadata,
            'content': content,
            'full_content': serialize_frontmatter(metadata, content),
        })

    def put(self, request, prompt_id):
        """Update prompt (creates new version)."""
        content = request.data.get('content')
        if not content:
            raise BadRequestError("content is required")

        storage = FileStorageService()
        index_service = IndexService()

        # Get existing item
        entry = index_service.get_by_id(prompt_id)
        if not entry:
            raise ResourceNotFoundError(f"Prompt {prompt_id} not found")

        slug = entry['slug']

        # Parse new content
        metadata, body = parse_frontmatter(content)
        metadata['id'] = prompt_id
        metadata['type'] = 'prompt'
        metadata['updated_at'] = datetime.utcnow().isoformat()

        # Create new version
        version_id = storage.create_version('prompt', prompt_id, slug, metadata, body)

        # Update index
        index_service.add_or_update(
            prompt_id,
            metadata,
            entry['file_path'],
            version_id
        )

        return Response({
            'id': prompt_id,
            'version_id': version_id,
            'updated_at': metadata['updated_at'],
        })

    def delete(self, request, prompt_id):
        """Delete prompt."""
        storage = FileStorageService()
        index_service = IndexService()

        # Get entry to find slug
        entry = index_service.get_by_id(prompt_id)
        if not entry:
            raise ResourceNotFoundError(f"Prompt {prompt_id} not found")

        slug = entry['slug']

        # Delete from storage
        storage.delete_item('prompt', prompt_id, slug)

        # Remove from index
        index_service.remove(prompt_id)

        return Response(status=status.HTTP_204_NO_CONTENT)


class PromptVersionsView(APIView):
    """
    GET /v1/prompts/{id}/versions - List all versions
    """

    def get(self, request, prompt_id):
        """List all versions of a prompt."""
        storage = FileStorageService()
        index_service = IndexService()

        # Get from index to find slug
        entry = index_service.get_by_id(prompt_id)
        if not entry:
            raise ResourceNotFoundError(f"Prompt {prompt_id} not found")

        slug = entry['slug']

        # Get versions
        versions = storage.list_versions('prompt', prompt_id, slug)

        return Response({
            'prompt_id': prompt_id,
            'versions': versions,
            'count': len(versions),
        })


class PromptVersionDetailView(APIView):
    """
    GET /v1/prompts/{id}/versions/{version_id} - Get specific version
    """

    def get(self, request, prompt_id, version_id):
        """Get a specific version of a prompt."""
        storage = FileStorageService()
        index_service = IndexService()

        # Get from index to find slug
        entry = index_service.get_by_id(prompt_id)
        if not entry:
            raise ResourceNotFoundError(f"Prompt {prompt_id} not found")

        slug = entry['slug']

        # Read specific version
        metadata, content = storage.read_version('prompt', prompt_id, slug, version_id)

        return Response({
            'prompt_id': prompt_id,
            'version_id': version_id,
            'metadata': metadata,
            'content': content,
        })


# ============================================================================
# Templates
# ============================================================================

class TemplatesListView(APIView):
    """
    GET /v1/templates - List all templates
    POST /v1/templates - Create a new template
    """

    def get(self, request):
        """List all templates."""
        storage = FileStorageService()
        templates = storage.list_all_items('template')

        # Apply filters if provided
        labels = request.query_params.getlist('labels')
        limit = int(request.query_params.get('limit', 100))

        if labels:
            templates = [t for t in templates if all(label in t.get('labels', []) for label in labels)]

        # Sort by updated_at descending
        templates.sort(key=lambda x: x.get('updated_at', ''), reverse=True)

        return Response({
            'templates': templates[:limit],
            'count': len(templates[:limit]),
            'total': len(templates),
        })

    def post(self, request):
        """Create a new template."""
        content = request.data.get('content')
        if not content:
            raise BadRequestError("content is required")

        # Parse frontmatter
        metadata, body = parse_frontmatter(content)

        # Validate required fields
        if not metadata.get('title'):
            raise ValidationError("title is required in frontmatter")
        if not metadata.get('slug'):
            metadata['slug'] = metadata.get('title', '').lower().replace(' ', '-')[:50]

        # Set type
        metadata['type'] = 'template'

        # Set timestamps
        metadata['created_at'] = metadata.get('created_at') or datetime.utcnow().isoformat()
        metadata['updated_at'] = datetime.utcnow().isoformat()

        # Create template
        storage = FileStorageService()
        item_id, version_id = storage.create_item('template', metadata, body)

        # Add to index
        index_service = IndexService()
        slug = metadata['slug']
        metadata['id'] = item_id  # Add ID to metadata for indexing
        index_service.add_or_update(
            item_id,
            metadata,
            f"templates/template_{slug}-{item_id}/versions/tv_{slug}-{item_id}_{version_id}.md",
            version_id
        )

        return Response({
            'id': item_id,
            'version_id': version_id,
            'created_at': metadata['created_at'],
        }, status=status.HTTP_201_CREATED)


class TemplateDetailView(APIView):
    """
    GET /v1/templates/{id} - Get template (HEAD version)
    PUT /v1/templates/{id} - Update template (create new version)
    DELETE /v1/templates/{id} - Delete template
    """

    def get(self, request, template_id):
        """Get template details (HEAD version)."""
        storage = FileStorageService()
        index_service = IndexService()

        # Get from index to find slug
        entry = index_service.get_by_id(template_id)
        if not entry:
            raise ResourceNotFoundError(f"Template {template_id} not found")

        slug = entry['slug']

        # Read HEAD version
        metadata, content = storage.read_version('template', template_id, slug)

        return Response({
            'id': template_id,
            'metadata': metadata,
            'content': content,
        })

    def put(self, request, template_id):
        """Update template (creates new version)."""
        content = request.data.get('content')
        if not content:
            raise BadRequestError("content is required")

        storage = FileStorageService()
        index_service = IndexService()

        # Get existing item
        entry = index_service.get_by_id(template_id)
        if not entry:
            raise ResourceNotFoundError(f"Template {template_id} not found")

        slug = entry['slug']

        # Parse new content
        metadata, body = parse_frontmatter(content)
        metadata['id'] = template_id
        metadata['type'] = 'template'
        metadata['updated_at'] = datetime.utcnow().isoformat()

        # Create new version
        version_id = storage.create_version('template', template_id, slug, metadata, body)

        # Update index
        index_service.add_or_update(
            template_id,
            metadata,
            entry['file_path'],
            version_id
        )

        return Response({
            'id': template_id,
            'version_id': version_id,
            'updated_at': metadata['updated_at'],
        })

    def delete(self, request, template_id):
        """Delete template."""
        storage = FileStorageService()
        index_service = IndexService()

        # Get entry to find slug
        entry = index_service.get_by_id(template_id)
        if not entry:
            raise ResourceNotFoundError(f"Template {template_id} not found")

        slug = entry['slug']

        # Delete from storage
        storage.delete_item('template', template_id, slug)

        # Remove from index
        index_service.remove(template_id)

        return Response(status=status.HTTP_204_NO_CONTENT)


class TemplateVersionsView(APIView):
    """
    GET /v1/templates/{id}/versions - List all versions
    """

    def get(self, request, template_id):
        """List all versions of a template."""
        storage = FileStorageService()
        index_service = IndexService()

        # Get from index to find slug
        entry = index_service.get_by_id(template_id)
        if not entry:
            raise ResourceNotFoundError(f"Template {template_id} not found")

        slug = entry['slug']

        # Get versions
        versions = storage.list_versions('template', template_id, slug)

        return Response({
            'template_id': template_id,
            'versions': versions,
            'count': len(versions),
        })


class TemplateVersionDetailView(APIView):
    """
    GET /v1/templates/{id}/versions/{version_id} - Get specific version
    """

    def get(self, request, template_id, version_id):
        """Get a specific version of a template."""
        storage = FileStorageService()
        index_service = IndexService()

        # Get from index to find slug
        entry = index_service.get_by_id(template_id)
        if not entry:
            raise ResourceNotFoundError(f"Template {template_id} not found")

        slug = entry['slug']

        # Read specific version
        metadata, content = storage.read_version('template', template_id, slug, version_id)

        return Response({
            'template_id': template_id,
            'version_id': version_id,
            'metadata': metadata,
            'content': content,
        })


# ============================================================================
# Chats
# ============================================================================

class ChatsListView(APIView):
    """
    GET /v1/chats - List all chats
    POST /v1/chats - Create a new chat
    """

    def get(self, request):
        """List all chats."""
        storage = FileStorageService()
        chats = storage.list_all_chats()

        # Sort by updated_at descending
        chats.sort(key=lambda x: x.get('updated_at', ''), reverse=True)

        limit = int(request.query_params.get('limit', 100))

        return Response({
            'chats': chats[:limit],
            'count': len(chats[:limit]),
            'total': len(chats),
        })

    def post(self, request):
        """Create a new chat."""
        chat_data = request.data

        # Validate required fields
        if not chat_data.get('title'):
            raise ValidationError("title is required")

        # Set timestamps
        chat_data['created_at'] = chat_data.get('created_at') or datetime.utcnow().isoformat()
        chat_data['updated_at'] = datetime.utcnow().isoformat()

        # Ensure messages array exists
        if 'messages' not in chat_data:
            chat_data['messages'] = []

        # Create chat
        storage = FileStorageService()
        chat_id = storage.create_chat(chat_data)

        # Add to index
        index_service = IndexService()
        metadata = {
            'id': chat_id,
            'title': chat_data.get('title', ''),
            'description': chat_data.get('description', ''),
            'labels': chat_data.get('tags', []),
            'author': 'system',
            'created_at': chat_data['created_at'],
            'type': 'chat',
        }
        title_slug = chat_data.get('title', chat_id).lower().replace(' ', '-')[:50]
        index_service.add_or_update(
            chat_id,
            metadata,
            f"chats/chat_{title_slug}-{chat_id}.json",
            'latest'
        )

        return Response({
            'id': chat_id,
            'created_at': chat_data['created_at'],
        }, status=status.HTTP_201_CREATED)


class ChatDetailView(APIView):
    """
    GET /v1/chats/{id} - Get chat
    PUT /v1/chats/{id} - Update chat
    DELETE /v1/chats/{id} - Delete chat
    """

    def get(self, request, chat_id):
        """Get chat details."""
        storage = FileStorageService()
        chat_data = storage.read_chat(chat_id)

        return Response(chat_data)

    def put(self, request, chat_id):
        """Update chat."""
        chat_data = request.data
        chat_data['id'] = chat_id

        storage = FileStorageService()
        storage.update_chat(chat_id, chat_data)

        # Update index
        index_service = IndexService()
        metadata = {
            'id': chat_id,
            'title': chat_data.get('title', ''),
            'description': chat_data.get('description', ''),
            'labels': chat_data.get('tags', []),
            'author': 'system',
            'created_at': chat_data.get('created_at', ''),
            'updated_at': chat_data.get('updated_at', ''),
            'type': 'chat',
        }
        # Get file path from index
        entry = index_service.get_by_id(chat_id)
        if entry:
            index_service.add_or_update(chat_id, metadata, entry['file_path'], 'latest')

        return Response({
            'id': chat_id,
            'updated_at': chat_data.get('updated_at'),
        })

    def delete(self, request, chat_id):
        """Delete chat."""
        storage = FileStorageService()
        storage.delete_chat(chat_id)

        # Remove from index
        index_service = IndexService()
        index_service.remove(chat_id)

        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================================================
# Common endpoints
# ============================================================================

class SearchView(APIView):
    """
    GET /v1/search - Search across all items
    """

    def get(self, request):
        type_filter = request.query_params.get('type')
        labels = request.query_params.getlist('labels')
        slug = request.query_params.get('slug')
        author = request.query_params.get('author')
        limit = int(request.query_params.get('limit', 50))
        cursor = request.query_params.get('cursor')

        index_service = IndexService()

        results = index_service.search(
            type_filter=type_filter,
            labels=labels if labels else None,
            slug=slug,
            author=author,
            limit=limit,
            cursor=cursor
        )

        return Response(results)


class IndexStatusView(APIView):
    """
    GET /v1/index/status - Get index status
    """

    def get(self, request):
        index_service = IndexService()
        status_info = index_service.get_status()

        return Response(status_info)


class IndexRebuildView(APIView):
    """
    POST /v1/index/rebuild - Rebuild index from file storage
    """

    def post(self, request):
        index_service = IndexService()
        storage = FileStorageService()

        # Rebuild index from file storage
        stats = index_service.rebuild(storage)

        return Response({
            'status': 'completed',
            'stats': stats,
        })


class HealthView(APIView):
    """
    GET /v1/health - Health check
    """
    permission_classes = []  # Public endpoint

    def get(self, request):
        # Check storage
        try:
            storage = FileStorageService()
            storage_healthy = True
        except Exception as e:
            storage_healthy = False

        # Check index
        try:
            index_service = IndexService()
            status_info = index_service.get_status()
            index_healthy = True
        except Exception as e:
            index_healthy = False
            status_info = {}

        overall_healthy = storage_healthy and index_healthy

        return Response({
            'status': 'healthy' if overall_healthy else 'unhealthy',
            'storage': {
                'healthy': storage_healthy,
            },
            'index': {
                'healthy': index_healthy,
                **status_info
            }
        }, status=status.HTTP_200_OK if overall_healthy else status.HTTP_503_SERVICE_UNAVAILABLE)


# ============================================================================
# AI Histories
# ============================================================================

class AIHistoriesListView(APIView):
    """
    GET /v1/ai-histories - List all AI histories
    POST /v1/ai-histories - Create a new AI history
    """

    def get(self, request):
        """List all AI histories."""
        storage = FileStorageService()
        histories = storage.list_all_ai_histories()

        # Apply filters if provided
        provider = request.query_params.get('provider')
        limit = int(request.query_params.get('limit', 100))

        if provider:
            histories = [h for h in histories if h.get('provider', '').lower() == provider.lower()]

        # Sort by updated_at descending
        histories.sort(key=lambda x: x.get('updated_at', ''), reverse=True)

        return Response({
            'histories': histories[:limit],
            'count': len(histories[:limit]),
            'total': len(histories),
        })

    def post(self, request):
        """Create a new AI history."""
        history_data = request.data

        # Validate required fields
        if not history_data.get('provider'):
            raise ValidationError("provider is required")
        if not history_data.get('conversation_id'):
            raise ValidationError("conversation_id is required")
        if not history_data.get('title'):
            raise ValidationError("title is required")

        # Check if history already exists
        storage = FileStorageService()
        existing = storage.find_ai_history_by_conversation(
            history_data['provider'],
            history_data['conversation_id']
        )

        if existing:
            # Update existing history
            history_id = existing['id']
            history_data['id'] = history_id
            history_data['created_at'] = existing.get('created_at')
            storage.update_ai_history(history_id, history_data)

            return Response({
                'id': history_id,
                'updated_at': history_data.get('updated_at'),
                'message': 'AI History updated',
            })
        else:
            # Create new history
            history_id = storage.create_ai_history(history_data)

            # Add to index
            index_service = IndexService()
            metadata = {
                'id': history_id,
                'title': history_data.get('title', ''),
                'description': f"{history_data.get('provider')} conversation",
                'labels': [history_data.get('provider', 'unknown').lower()],
                'author': 'system',
                'created_at': history_data.get('created_at', ''),
                'type': 'ai-history',
            }
            provider = history_data.get('provider', 'unknown').lower()
            conv_id = history_data.get('conversation_id', history_id)[:20]
            index_service.add_or_update(
                history_id,
                metadata,
                f"ai-histories/history_{provider}_{conv_id}-{history_id}.json",
                'latest'
            )

            return Response({
                'id': history_id,
                'created_at': history_data.get('created_at'),
                'message': 'AI History created',
            }, status=status.HTTP_201_CREATED)


class AIHistoryDetailView(APIView):
    """
    GET /v1/ai-histories/{id} - Get AI history
    PUT /v1/ai-histories/{id} - Update AI history
    DELETE /v1/ai-histories/{id} - Delete AI history
    """

    def get(self, request, history_id):
        """Get AI history details."""
        storage = FileStorageService()
        history_data = storage.read_ai_history(history_id)

        return Response(history_data)

    def put(self, request, history_id):
        """Update AI history."""
        history_data = request.data
        history_data['id'] = history_id

        storage = FileStorageService()
        storage.update_ai_history(history_id, history_data)

        # Update index
        index_service = IndexService()
        metadata = {
            'id': history_id,
            'title': history_data.get('title', ''),
            'description': f"{history_data.get('provider', 'unknown')} conversation",
            'labels': [history_data.get('provider', 'unknown').lower()],
            'author': 'system',
            'created_at': history_data.get('created_at', ''),
            'updated_at': history_data.get('updated_at', ''),
            'type': 'ai-history',
        }
        # Get file path from index
        entry = index_service.get_by_id(history_id)
        if entry:
            index_service.add_or_update(history_id, metadata, entry['file_path'], 'latest')

        return Response({
            'id': history_id,
            'updated_at': history_data.get('updated_at'),
        })

    def delete(self, request, history_id):
        """Delete AI history."""
        storage = FileStorageService()
        storage.delete_ai_history(history_id)

        # Remove from index
        index_service = IndexService()
        index_service.remove(history_id)

        return Response(status=status.HTTP_204_NO_CONTENT)
