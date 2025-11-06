"""
Detail API views - Full Git access for technical users.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.core.services.git_service import GitService
from apps.core.services.index_service import IndexService
from apps.core.services.version_service import VersionService
from apps.core.utils.frontmatter import parse_frontmatter
from apps.core.exceptions import ResourceNotFoundError, ValidationError


class HistoryView(APIView):
    """
    GET /v1/detail/prompts/{id}/history
    Get full commit history for a prompt.
    """

    def get(self, request, prompt_id):
        limit = int(request.query_params.get('limit', 100))
        follow_renames = request.query_params.get('follow_renames', 'true') == 'true'

        git_service = GitService()
        index_service = IndexService()

        entry = index_service.get_by_id(prompt_id)
        if not entry:
            raise ResourceNotFoundError(f"Prompt {prompt_id} not found")

        history = git_service.get_file_history(entry['file_path'], limit=limit)

        return Response({
            'prompt_id': prompt_id,
            'file_path': entry['file_path'],
            'history': history,
            'count': len(history),
        })


class DiffView(APIView):
    """
    GET /v1/detail/prompts/{id}/diff
    Get diff between two references.
    """

    def get(self, request, prompt_id):
        from_ref = request.query_params.get('from')
        to_ref = request.query_params.get('to')

        if not from_ref or not to_ref:
            raise ValidationError("Both 'from' and 'to' parameters are required")

        git_service = GitService()
        index_service = IndexService()

        entry = index_service.get_by_id(prompt_id)
        if not entry:
            raise ResourceNotFoundError(f"Prompt {prompt_id} not found")

        diff_result = git_service.diff_files(from_ref, to_ref, entry['file_path'])

        return Response(diff_result)


class RawContentView(APIView):
    """
    GET /v1/detail/prompts/{id}/raw - Read raw markdown
    PUT /v1/detail/prompts/{id}/raw - Write raw markdown
    """

    def get(self, request, prompt_id):
        ref = request.query_params.get('ref', 'main')

        git_service = GitService()
        index_service = IndexService()

        entry = index_service.get_by_id(prompt_id)
        if not entry:
            raise ResourceNotFoundError(f"Prompt {prompt_id} not found")

        content = git_service.read_file(entry['file_path'], ref if ref != 'main' else None)

        return Response(
            content,
            content_type='text/markdown',
            headers={
                'ETag': git_service.get_file_sha(entry['file_path']),
            }
        )

    def put(self, request, prompt_id):
        content = request.body.decode('utf-8')
        if_match = request.headers.get('If-Match')
        message = request.query_params.get('message', f'Update {prompt_id}')

        if not if_match:
            raise ValidationError("If-Match header is required")

        git_service = GitService()
        index_service = IndexService()

        entry = index_service.get_by_id(prompt_id)
        if not entry:
            raise ResourceNotFoundError(f"Prompt {prompt_id} not found")

        # Check ETag
        current_sha = git_service.get_file_sha(entry['file_path'])
        if current_sha != if_match:
            from apps.core.exceptions import ConflictError
            raise ConflictError(
                "If-Match does not match current resource sha",
                resource_sha=current_sha
            )

        # Write file
        commit_sha = git_service.write_file(
            entry['file_path'],
            content,
            message,
            author=f"{request.user.username} <{request.user.email}>" if request.user.is_authenticated else None
        )

        # Update index
        metadata, _ = parse_frontmatter(content)
        index_service.add_or_update(prompt_id, metadata, entry['file_path'], commit_sha)

        return Response({
            'sha': commit_sha,
            'updated_at': git_service.get_file_history(entry['file_path'], limit=1)[0]['timestamp']
        })


class ReleasesView(APIView):
    """
    GET /v1/detail/prompts/{id}/releases - List releases
    POST /v1/detail/prompts/{id}/releases - Create release
    """

    def get(self, request, prompt_id):
        git_service = GitService()

        tag_prefix = f"prompt/{prompt_id}/"
        tags = git_service.list_tags(prefix=tag_prefix)

        releases = []
        for tag in tags:
            version = tag['name'].replace(tag_prefix, '')
            metadata = VersionService.parse_release_metadata(tag.get('message', '{}'))

            releases.append({
                'version': version,
                'tag_name': tag['name'],
                'sha': tag['sha'],
                'channel': metadata.get('channel'),
                'notes': metadata.get('notes'),
                'released_at': metadata.get('released_at', tag.get('date')),
            })

        # Sort by version
        releases.sort(
            key=lambda r: VersionService.parse_version(r['version'])[:3],
            reverse=True
        )

        return Response({
            'prompt_id': prompt_id,
            'releases': releases,
            'count': len(releases),
        })

    def post(self, request, prompt_id):
        base_sha = request.data.get('base_sha')
        version = request.data.get('version')
        channel = request.data.get('channel', 'prod')
        notes = request.data.get('notes', '')
        payload = request.data.get('payload', {})

        if not base_sha or not version:
            raise ValidationError("base_sha and version are required")

        git_service = GitService()

        # Validate version format
        VersionService.parse_version(version)

        # Create tag
        tag_name = VersionService.build_tag_name(prompt_id, version)
        tag_message = VersionService.create_release_metadata(
            version, channel, notes, base_sha, **payload
        )

        git_service.create_tag(
            tag_name,
            base_sha,
            message=tag_message,
            tagger=f"{request.user.username} <{request.user.email}>" if request.user.is_authenticated else None
        )

        return Response({
            'version': version,
            'tag_name': tag_name,
            'sha': base_sha,
            'channel': channel,
        }, status=status.HTTP_201_CREATED)


class GitBranchesView(APIView):
    """
    GET /v1/detail/git/branches
    List all branches.
    """

    def get(self, request):
        git_service = GitService()

        branches = []
        for ref in git_service.repo.refs.keys():
            if ref.startswith(b'refs/heads/'):
                branch_name = ref[len(b'refs/heads/'):].decode('utf-8')
                branches.append(branch_name)

        return Response({
            'branches': branches,
            'current': git_service.get_current_branch(),
        })


class GitCheckoutView(APIView):
    """
    POST /v1/detail/git/checkout
    Checkout a branch.
    """

    def post(self, request):
        branch = request.data.get('branch')
        create = request.data.get('create', False)

        if not branch:
            raise ValidationError("branch is required")

        git_service = GitService()
        git_service.checkout_branch(branch, create=create)

        return Response({
            'branch': branch,
            'created': create,
        })


class GitTagView(APIView):
    """
    POST /v1/detail/git/tag
    Create a Git tag.
    """

    def post(self, request):
        name = request.data.get('name')
        sha = request.data.get('sha')
        annotated = request.data.get('annotated', True)
        message = request.data.get('message', '')

        if not name or not sha:
            raise ValidationError("name and sha are required")

        git_service = GitService()

        if annotated:
            git_service.create_tag(
                name, sha, message=message,
                tagger=f"{request.user.username} <{request.user.email}>" if request.user.is_authenticated else None
            )
        else:
            git_service.create_tag(name, sha)

        return Response({
            'tag_name': name,
            'sha': sha,
            'annotated': annotated,
        }, status=status.HTTP_201_CREATED)
