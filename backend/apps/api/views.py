"""
Unified API views for prompts, templates, and chats.
"""
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import datetime

from backend.apps.core.services.file_storage_service import FileStorageService
from backend.apps.core.services.index_service import IndexService
from backend.apps.core.exceptions import ValidationError, BadRequestError, IndexLockError
from backend.apps.core.domain.itemmetadata import ItemMetadata
from backend.apps.core.domain.version import TemplateVariable
from backend.apps.core.domain.chatmetadata import ChatMetadata

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
        labels = request.query_params.getlist('labels')
        limit = int(request.query_params.get('limit', 100))

        if labels:
            prompts = [p for p in prompts if all(label in p.labels for label in labels)]

        # Sort by updated_at descending
        prompts.sort(key=lambda x: x.updated_at or x.created_at or "", reverse=True)

        return Response({
            'items': [p.to_summary().__dict__() for p in prompts[:limit]],
            'count': len(prompts[:limit]),
            'total': len(prompts),
        })

    def post(self, request):
        """Create a new prompt."""
        title = request.data.get('title')
        content = request.data.get('content')
        labels = request.data.get('labels', [])
        description = request.data.get('description', '')
        author = "You"  # Default author
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()

        if not title:
            raise BadRequestError("title is required")
        if not content:
            raise BadRequestError("content is required")

        metadata = ItemMetadata(
            id='',
            title=title,
            type='prompt',
            labels=labels,
            description=description,
            updated_at=now,
            created_at=now,
            author=author,
            versions=[]
        )

        # Create prompt
        storage = FileStorageService()
        item_id, version_id = storage.create_item('prompt', metadata, content, None)

        return JsonResponse({
            'success': True,
            'id': item_id,
            'version_id': version_id
        }, status=status.HTTP_200_OK)


class PromptDetailView(APIView):
    """
    GET /v1/prompts/{id} - Get prompt metadata
    PUT /v1/prompts/{id} - Update prompt metadata
    DELETE /v1/prompts/{id} - Delete prompt
    """

    def get(self, request, prompt_id):
        """Get prompt metadata"""
        storage = FileStorageService()

        metadata = storage.load_metadata('prompt', prompt_id)

        return JsonResponse(metadata.to_summary().__dict__(), status=status.HTTP_200_OK)

    def put(self, request, prompt_id):
        """Update prompt metadata"""
        title = request.data.get('title')
        labels = request.data.get('labels', [])
        description = request.data.get('description', '')
        author = "You"  # Default author

        storage = FileStorageService()
        storage.update_item("prompt", prompt_id, title, labels, description, author)

        return JsonResponse({'success': True, 'id': prompt_id}, status=status.HTTP_200_OK)


    def delete(self, request, prompt_id):
        """Delete prompt."""
        storage = FileStorageService()

        # Delete from storage
        storage.delete_item('prompt', prompt_id)

        return JsonResponse({'success': True, 'id': prompt_id}, status=status.HTTP_200_OK)


class PromptVersionsView(APIView):
    """
    GET /v1/prompts/{id}/versions - List all versions
    POST /v1/prompts/{id}/versions - Create a new version
    """

    def get(self, request, prompt_id):
        """List all versions of a prompt."""
        storage = FileStorageService()

        # Get versions
        versions = storage.list_versions('prompt', prompt_id)

        return Response({
            'prompt_id': prompt_id,
            'versions': [v.__dict__() for v in versions],
            'count': len(versions),
        })

    def post(self, request, prompt_id):
        """Create a new version of a prompt."""
        version_number = request.data.get('version_number')
        content = request.data.get('content')
        if not content:
            raise BadRequestError("content is required")
        if version_number is None:
            raise BadRequestError("version_number is required")

        storage = FileStorageService()

        # Get existing metadata
        metadata = storage.load_metadata('prompt', prompt_id)

        # Create new version
        version_id = storage.create_version(metadata, version_number, content, None)

        return Response({
            'id': prompt_id,
            'version_id': version_id
        })


class PromptVersionDetailView(APIView):
    """
    GET /v1/prompts/{id}/versions/{version_id} - Get specific version
    DELETE /v1/prompts/{id}/versions/{version_id} - Delete specific version
    """

    def get(self, request, prompt_id, version_id):
        """Get a specific version of a prompt."""
        storage = FileStorageService()

        # Read specific version
        version_data = storage.read_version('prompt', prompt_id, version_id)

        return JsonResponse({
            'prompt_id': prompt_id,
            **version_data.__dict__(),
            'content': version_data.content,
        }, status=status.HTTP_200_OK)

    def delete(self, request, prompt_id, version_id):
        """Delete a specific version of a prompt."""
        storage = FileStorageService()

        # Delete specific version
        storage.delete_version('prompt', prompt_id, version_id)

        return Response(status=status.HTTP_204_NO_CONTENT)

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
            templates = [t for t in templates if all(label in t.labels for label in labels)]

        # Sort by updated_at descending
        templates.sort(key=lambda x: x.updated_at or x.created_at or "", reverse=True)

        return Response({
            'items': [t.to_summary().__dict__() for t in templates[:limit]],
            'count': len(templates[:limit]),
            'total': len(templates),
        })

    def post(self, request):
        """Create a new template."""
        title = request.data.get('title')
        content = request.data.get('content')
        labels = request.data.get('labels', [])
        description = request.data.get('description', '')
        author = "You"
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()

        if not title:
            raise BadRequestError("title is required")
        if not content:
            raise BadRequestError("content is required")
        
        variables = [TemplateVariable.from_dict(v) for v in request.data.get('variables', [])]

        metadata = ItemMetadata(
            id='',
            title=title,
            type='template',
            labels=labels,
            description=description,
            updated_at=now,
            created_at=now,
            author=author,
            versions=[]
        )

        storage = FileStorageService()
        item_id, version_id = storage.create_item('template', metadata, content, variables)

        return Response({
            'id': item_id,
            'version_id': version_id,
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

        metadata = storage.load_metadata('template', template_id)

        return Response(metadata.to_summary().__dict__())

    def put(self, request, template_id):
        """Update prompt metadata"""
        title = request.data.get('title')
        labels = request.data.get('labels', [])
        description = request.data.get('description', '')
        author = "You"  # Default author

        storage = FileStorageService()
        storage.update_item("template", template_id, title, labels, description, author)

        return JsonResponse({'success': True, 'id': template_id}, status=status.HTTP_200_OK)



    def delete(self, request, template_id):
        """Delete template."""
        storage = FileStorageService()
        # Delete from storage
        storage.delete_item('template', template_id)

        return JsonResponse({'success': True, 'id': template_id}, status=status.HTTP_200_OK)


class TemplateVersionsView(APIView):
    """
    GET /v1/templates/{id}/versions - List all versions
    """

    def get(self, request, template_id):
        """List all versions of a template."""
        storage = FileStorageService()

        # Get versions
        versions = storage.list_versions('template', template_id)

        return Response({
            'template_id': template_id,
            'versions': [v.__dict__() for v in versions],
            'count': len(versions),
        })

    def post(self, request, template_id):
        """Update template (creates new version)."""
        version_number = request.data.get('version_number')
        content = request.data.get('content')
        if not content:
            raise BadRequestError("content is required")
        if version_number is None:
            raise BadRequestError("version_number is required")

        variables = [TemplateVariable.from_dict(v) for v in request.data.get('variables', [])]

        storage = FileStorageService()

        # Get existing metadata
        metadata = storage.load_metadata('template', template_id)

        # Create new version
        version_id = storage.create_version(metadata, version_number, content, variables)

        return Response({
            'id': template_id,
            'version_id': version_id
        })


class TemplateVersionDetailView(APIView):
    """
    GET /v1/templates/{id}/versions/{version_id} - Get specific version
    """

    def get(self, request, template_id, version_id):
        """Get a specific version of a template."""
        storage = FileStorageService()

        # Read specific version
        version_data = storage.read_version('template', template_id, version_id)

        return JsonResponse({
            'template_id': template_id,
            **version_data.__dict__(),
            'content': version_data.content,
        }, status=status.HTTP_200_OK)
    
    def delete(self, request, template_id, version_id):
        """Delete a specific version of a template."""
        storage = FileStorageService()

        # Delete specific version
        storage.delete_version('template', template_id, version_id)

        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================================================
# Chats
# ============================================================================

class ChatsListView(APIView):
    """
    GET /v1/chats - List all chats
    POST /v1/chats - Create a new chat (with deduplication support)
    """

    def get(self, request):
        """List all chats."""
        storage = FileStorageService()
        chats = storage.list_all_chats()

        # Apply filters if provided
        provider = request.query_params.get('provider')
        labels = request.query_params.getlist('labels')
        limit = int(request.query_params.get('limit', 100))

        if provider:
            chats = [c for c in chats if c.provider and c.provider.lower() == provider.lower()]

        if labels:
            chats = [c for c in chats if all(label in c.labels for label in labels)]

        # Sort by updated_at descending
        chats.sort(key=lambda x: x.updated_at or x.created_at or "", reverse=True)

        return Response({
            'items': [c.to_summary().__dict__() for c in chats[:limit]],
            'count': len(chats[:limit]),
            'total': len(chats),
        })

    def post(self, request):
        """Create a new chat (or update if provider + conversation_id exists)."""
        title = request.data.get('title')
        description = request.data.get('description', '')
        labels = request.data.get('labels', request.data.get('tags', []))
        provider = request.data.get('provider')
        model = request.data.get('model')
        conversation_id = request.data.get('conversation_id')
        messages = request.data.get('messages', [])
        author = request.data.get('author', 'system')
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()

        if not title:
            raise BadRequestError("title is required")

        storage = FileStorageService()

        # Check for existing chat by provider + conversation_id (for browser extension deduplication)
        if provider and conversation_id:
            existing = storage.find_chat_by_conversation(provider, conversation_id)

            if existing:
                # Update existing chat
                existing.title = title
                existing.description = description
                existing.labels = labels
                existing.messages = messages
                existing.updated_at = now
                existing.model = model or existing.model
                storage.save_chat(existing)

                return Response({
                    'success': True,
                    'id': existing.id,
                    'updated_at': now,
                    'message': 'Chat updated',
                })

        # Create new chat
        chat = ChatMetadata(
            id='',
            title=title,
            type='chat',
            labels=labels,
            description=description,
            updated_at=now,
            created_at=request.data.get('created_at') or now,
            author=author,
            provider=provider,
            model=model,
            conversation_id=conversation_id,
            messages=messages,
        )

        chat_id = storage.create_chat(chat.__dict__())

        return Response({
            'success': True,
            'id': chat_id,
            'created_at': chat.created_at,
        }, status=status.HTTP_201_CREATED)


class ChatDetailView(APIView):
    """
    GET /v1/chats/{id} - Get chat metadata
    PUT /v1/chats/{id} - Update chat metadata
    DELETE /v1/chats/{id} - Delete chat
    """

    def get(self, request, chat_id):
        """Get chat metadata."""
        storage = FileStorageService()
        chat = storage.load_chat(chat_id)

        return Response(chat.to_summary().__dict__())

    def put(self, request, chat_id):
        """Update chat metadata."""
        title = request.data.get('title')
        labels = request.data.get('labels', [])
        description = request.data.get('description', '')
        author = request.data.get('author', 'You')

        storage = FileStorageService()
        chat = storage.load_chat(chat_id)

        chat.title = title or chat.title
        chat.labels = labels
        chat.description = description
        chat.author = author
        chat.updated_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

        storage.save_chat(chat)

        return JsonResponse({'success': True, 'id': chat_id}, status=status.HTTP_200_OK)

    def delete(self, request, chat_id):
        """Delete chat."""
        storage = FileStorageService()
        storage.delete_chat(chat_id)

        return JsonResponse({'success': True, 'id': chat_id}, status=status.HTTP_200_OK)


class ChatMessagesView(APIView):
    """
    GET /v1/chats/{id}/messages - Get chat messages
    PUT /v1/chats/{id}/messages - Update chat messages
    """

    def get(self, request, chat_id):
        """Get chat with full messages."""
        storage = FileStorageService()
        chat = storage.load_chat(chat_id)

        return JsonResponse({
            'chat_id': chat_id,
            'messages': chat.messages,
            'turn_count': chat.turn_count,
        }, status=status.HTTP_200_OK)

    def put(self, request, chat_id):
        """Update chat messages."""
        messages = request.data.get('messages', [])

        storage = FileStorageService()
        chat = storage.load_chat(chat_id)

        chat.messages = messages
        chat.turn_count = sum(1 for msg in messages if msg.get('role') == 'user')
        chat.updated_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

        storage.save_chat(chat)

        return JsonResponse({
            'success': True,
            'id': chat_id,
            'turn_count': chat.turn_count,
        }, status=status.HTTP_200_OK)


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
        author = request.query_params.get('author')
        slug = request.query_params.get('slug')
        limit = int(request.query_params.get('limit', 50))
        cursor = request.query_params.get('cursor')

        index_service = IndexService()

        try:
            results = index_service.search(
                type_filter=type_filter,
                labels=labels,
                slug=slug,
                author=author,
                limit=limit,
                cursor=cursor,
            )
            return Response(results)
        except IndexLockError as e:
            return Response({'detail': str(e)}, status=status.HTTP_423_LOCKED)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# Index management
# ============================================================================

class IndexStatusView(APIView):
    """
    GET /v1/index/status - Get index status
    """

    def get(self, request):
        service = IndexService()
        try:
            status_data = service.get_status()
            status_data['entries_count'] = (
                status_data.get('prompts_count', 0)
                + status_data.get('templates_count', 0)
                + status_data.get('chats_count', 0)
            )
            status_data.setdefault('last_error', None)
            status_data['lock_status'] = 'unlocked'
            return Response(status_data)
        except IndexLockError as e:
            return Response({'detail': str(e)}, status=status.HTTP_423_LOCKED)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class IndexRebuildView(APIView):
    """
    POST /v1/index/rebuild - Rebuild index from storage
    """

    def post(self, request):
        storage = FileStorageService()
        service = IndexService()

        try:
            stats = service.rebuild(storage)
            return Response({'success': True, 'stats': stats})
        except IndexLockError as e:
            return Response({'detail': str(e)}, status=status.HTTP_423_LOCKED)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# Note: AI Histories have been merged into Chats
# Browser extension should use POST /v1/chats with provider and conversation_id
# for automatic deduplication
# ============================================================================
