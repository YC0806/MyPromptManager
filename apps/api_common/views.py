"""
Common API views - Shared endpoints for both Simple and Detail users.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from pathlib import Path
import json

from apps.core.services.git_service import GitService
from apps.core.services.index_service import IndexService
from apps.core.utils.frontmatter import parse_frontmatter
from apps.core.exceptions import ValidationError


class SearchView(APIView):
    """
    GET /v1/search
    Search prompts and templates in index.
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
    GET /v1/index/status
    Get index status.
    """

    def get(self, request):
        index_service = IndexService()
        status_info = index_service.get_status()

        return Response(status_info)


class IndexRepairView(APIView):
    """
    POST /v1/index/repair
    Quick repair of index (synchronous).
    """

    def post(self, request):
        index_service = IndexService()
        git_service = GitService()

        # Rebuild index
        stats = index_service.rebuild(git_service)

        return Response({
            'status': 'completed',
            'stats': stats,
        })


class IndexRebuildView(APIView):
    """
    POST /v1/index/rebuild
    Full rebuild of index (synchronous).
    """

    def post(self, request):
        index_service = IndexService()
        git_service = GitService()

        # Full rebuild
        stats = index_service.rebuild(git_service)

        return Response({
            'status': 'completed',
            'stats': stats,
        })


class FrontMatterSchemaView(APIView):
    """
    GET /v1/schemas/frontmatter
    Get front matter JSON schema.
    """

    def get(self, request):
        schema_path = Path(settings.SCHEMA_DIR) / 'frontmatter.schema.json'

        if not schema_path.exists():
            # Return default schema
            return Response({
                "$schema": "http://json-schema.org/draft-07/schema#",
                "type": "object",
                "required": ["id", "title", "type"],
                "properties": {
                    "id": {"type": "string", "pattern": "^[0-9A-HJKMNP-TV-Z]{26}$"},
                    "title": {"type": "string", "minLength": 1},
                    "description": {"type": "string"},
                    "type": {"enum": ["prompt", "template"]},
                    "slug": {"type": "string"},
                    "labels": {"type": "array", "items": {"type": "string"}},
                    "author": {"type": "string"},
                    "created_at": {"type": "string", "format": "date-time"},
                    "updated_at": {"type": "string", "format": "date-time"}
                }
            })

        return Response(json.loads(schema_path.read_text()))


class IndexSchemaView(APIView):
    """
    GET /v1/schemas/index
    Get index JSON schema.
    """

    def get(self, request):
        schema_path = Path(settings.SCHEMA_DIR) / 'index.schema.json'

        if not schema_path.exists():
            # Return default schema
            return Response({
                "$schema": "http://json-schema.org/draft-07/schema#",
                "type": "object",
                "required": ["prompts", "templates"],
                "properties": {
                    "prompts": {"type": "array"},
                    "templates": {"type": "array"},
                    "last_updated": {"type": "string", "format": "date-time"}
                }
            })

        return Response(json.loads(schema_path.read_text()))


class ValidateFrontMatterView(APIView):
    """
    POST /v1/validate/frontmatter
    Validate front matter content.
    """

    def post(self, request):
        content = request.data.get('content')

        if not content:
            raise ValidationError("content is required")

        try:
            metadata, body = parse_frontmatter(content)

            # Basic validation
            errors = []

            if not metadata.get('id'):
                errors.append("Missing required field: id")
            if not metadata.get('title'):
                errors.append("Missing required field: title")
            if not metadata.get('type'):
                errors.append("Missing required field: type")
            elif metadata['type'] not in ['prompt', 'template']:
                errors.append("Invalid type: must be 'prompt' or 'template'")

            # Validate ULID format
            if metadata.get('id'):
                import re
                if not re.match(r'^[0-9A-HJKMNP-TV-Z]{26}$', metadata['id']):
                    errors.append("Invalid ULID format for id")

            return Response({
                'valid': len(errors) == 0,
                'errors': errors,
                'metadata': metadata,
            })

        except Exception as e:
            return Response({
                'valid': False,
                'errors': [str(e)],
            })


class HealthView(APIView):
    """
    GET /v1/health
    Health check endpoint.
    """
    permission_classes = []  # Public endpoint

    def get(self, request):
        # Check Git repo
        try:
            git_service = GitService()
            git_healthy = True
            git_branch = git_service.get_current_branch()
        except Exception as e:
            git_healthy = False
            git_branch = None

        # Check index
        try:
            index_service = IndexService()
            status_info = index_service.get_status()
            index_healthy = True
        except Exception as e:
            index_healthy = False
            status_info = {}

        overall_healthy = git_healthy and index_healthy

        return Response({
            'status': 'healthy' if overall_healthy else 'unhealthy',
            'git': {
                'healthy': git_healthy,
                'branch': git_branch,
            },
            'index': {
                'healthy': index_healthy,
                **status_info
            }
        }, status=status.HTTP_200_OK if overall_healthy else status.HTTP_503_SERVICE_UNAVAILABLE)
