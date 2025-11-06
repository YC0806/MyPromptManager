"""
Simple API views - Low barrier of entry for non-technical users.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from datetime import datetime
import uuid

from apps.core.services.git_service import GitService
from apps.core.services.index_service import IndexService
from apps.core.services.version_service import VersionService
from apps.core.utils.frontmatter import parse_frontmatter, serialize_frontmatter
from apps.core.exceptions import ResourceNotFoundError, ConflictError, ValidationError


class TimelineView(APIView):
    """
    GET /v1/simple/prompts/{id}/timeline
    Get timeline of releases and drafts for a prompt.
    """

    def get(self, request, prompt_id):
        view_mode = request.query_params.get('view', 'releases')
        limit = int(request.query_params.get('limit', 50))
        cursor = request.query_params.get('cursor')

        git_service = GitService()
        index_service = IndexService()

        # Get index entry to find file path
        entry = index_service.get_by_id(prompt_id)
        if not entry:
            raise ResourceNotFoundError(f"Prompt {prompt_id} not found")

        file_path = entry['file_path']

        # Get tags (releases)
        tag_prefix = f"{settings.VERSION_TAG_PREFIX}/{prompt_id}/"
        tags = git_service.list_tags(prefix=tag_prefix)

        timeline = []

        # Add releases
        for tag in tags:
            version = tag['name'].replace(tag_prefix, '')
            metadata = VersionService.parse_release_metadata(tag.get('message', '{}'))

            timeline.append({
                'type': 'release',
                'version': version,
                'sha': tag['sha'],
                'channel': metadata.get('channel', 'prod'),
                'notes': metadata.get('notes', ''),
                'released_at': metadata.get('released_at', tag.get('date')),
            })

        # If view=all, add draft commits
        if view_mode == 'all':
            history = git_service.get_file_history(file_path, limit=limit)
            for commit in history:
                # Skip if already a release
                if any(t['sha'] == commit['sha'] for t in timeline):
                    continue

                timeline.append({
                    'type': 'draft',
                    'sha': commit['sha'],
                    'message': commit['message'],
                    'author': commit['author'],
                    'timestamp': commit['timestamp'],
                })

        # Sort by timestamp descending
        timeline.sort(key=lambda x: x.get('released_at') or x.get('timestamp'), reverse=True)

        return Response({
            'prompt_id': prompt_id,
            'timeline': timeline[:limit],
        })


class ContentView(APIView):
    """
    GET /v1/simple/prompts/{id}/content
    Get content of a specific version.
    """

    def get(self, request, prompt_id):
        ref = request.query_params.get('ref', 'latest')

        git_service = GitService()
        index_service = IndexService()

        # Get index entry
        entry = index_service.get_by_id(prompt_id)
        if not entry:
            raise ResourceNotFoundError(f"Prompt {prompt_id} not found")

        file_path = entry['file_path']

        # Resolve ref
        if ref == 'latest':
            # Get latest release tag
            tag_prefix = f"{settings.VERSION_TAG_PREFIX}/{prompt_id}/"
            tags = git_service.list_tags(prefix=tag_prefix)
            versions = [t['name'].replace(tag_prefix, '') for t in tags]
            latest_version = VersionService.get_latest_version(versions)

            if not latest_version:
                # No releases yet, use HEAD
                ref = None
            else:
                ref = f"{tag_prefix}{latest_version}"

        elif ref.startswith('v'):
            # Version string, build tag name
            ref = VersionService.build_tag_name(prompt_id, ref)

        # Read content
        content = git_service.read_file(file_path, ref)

        metadata, body = parse_frontmatter(content)

        return Response({
            'prompt_id': prompt_id,
            'ref': ref,
            'content': content,
            'metadata': metadata,
            'body': body,
        })


class SaveDraftView(APIView):
    """
    POST /v1/simple/prompts/{id}/save
    Save draft to hidden UI branch.
    """

    def post(self, request, prompt_id):
        content = request.data.get('content')
        message = request.data.get('message', 'Draft save')
        idempotency_key = request.data.get('idempotency_key')

        if not content:
            raise ValidationError("Content is required")

        git_service = GitService()
        index_service = IndexService()

        # Get or create entry
        entry = index_service.get_by_id(prompt_id)

        if entry:
            file_path = entry['file_path']
        else:
            # New prompt, create file path
            metadata, body = parse_frontmatter(content)
            project = metadata.get('project', 'default')
            item_type = metadata.get('type', 'prompt')
            file_path = f"projects/{project}/{item_type}s/{item_type}_{prompt_id}.md"

        # Create UI branch for this user/session
        user = request.user.username if request.user.is_authenticated else 'anonymous'
        session_id = idempotency_key or str(uuid.uuid4())[:8]
        ui_branch = f"ui/{user}/{prompt_id}/{session_id}"

        # Checkout or create UI branch
        try:
            git_service.checkout_branch(ui_branch, create=True)
        except:
            pass

        # Write file
        commit_message = f"Save draft for {prompt_id}: {message}"
        sha = git_service.write_file(
            file_path,
            content,
            commit_message,
            author=f"{user} <{user}@promptmanager.local>"
        )

        # Parse for version suggestion
        try:
            old_content = git_service.read_file(file_path, 'main')
        except:
            old_content = ""

        suggested_version = VersionService.suggest_version(old_content, content)

        # Return to main branch
        git_service.checkout_branch('main')

        return Response({
            'type': 'draft',
            'sha': sha,
            'saved_at': datetime.utcnow().isoformat(),
            'suggested_next_version': suggested_version,
            'ui_branch': ui_branch,
        }, status=status.HTTP_201_CREATED)


class PublishView(APIView):
    """
    POST /v1/simple/prompts/{id}/publish
    Publish a version (merge UI branch and create tag).
    """

    def post(self, request, prompt_id):
        base_sha = request.data.get('base_sha')
        channel = request.data.get('channel', 'prod')
        version = request.data.get('version', 'auto')
        notes = request.data.get('notes', '')
        idempotency_key = request.data.get('idempotency_key')

        if not base_sha:
            raise ValidationError("base_sha is required")

        git_service = GitService()
        index_service = IndexService()

        # Get entry
        entry = index_service.get_by_id(prompt_id)
        if not entry:
            raise ResourceNotFoundError(f"Prompt {prompt_id} not found")

        file_path = entry['file_path']

        # Determine version
        if version == 'auto':
            # Get latest version
            tag_prefix = f"{settings.VERSION_TAG_PREFIX}/{prompt_id}/"
            tags = git_service.list_tags(prefix=tag_prefix)
            versions = [t['name'].replace(tag_prefix, '') for t in tags]
            current_version = VersionService.get_latest_version(versions) or 'v0.0.0'

            # Get content for comparison
            try:
                old_content = git_service.read_file(file_path, 'main')
            except:
                old_content = ""

            new_content = git_service.read_file(file_path, base_sha)
            version = VersionService.suggest_version(old_content, new_content, current_version)

        # Validate version
        if not version.startswith('v'):
            version = f'v{version}'

        # TODO: Merge UI branch content into main
        # For now, we'll cherry-pick the commit
        # (Simplified implementation - real version needs proper merge)

        # Write to main branch
        git_service.checkout_branch('main')
        content = git_service.read_file(file_path, base_sha)
        commit_sha = git_service.write_file(
            file_path,
            content,
            f"Release {prompt_id} {version}: {notes}",
            author="release-bot <release-bot@promptmanager.local>"
        )

        # Create release tag
        tag_name = VersionService.build_tag_name(prompt_id, version)
        tag_message = VersionService.create_release_metadata(
            version, channel, notes, commit_sha
        )

        git_service.create_tag(
            tag_name,
            commit_sha,
            message=tag_message,
            tagger="release-bot <release-bot@promptmanager.local>"
        )

        # Update index
        metadata, _ = parse_frontmatter(content)
        index_service.add_or_update(prompt_id, metadata, file_path, commit_sha)

        return Response({
            'type': 'release',
            'version': version,
            'channel': channel,
            'released_at': datetime.utcnow().isoformat(),
            'sha': commit_sha,
            'notes': notes,
            'tag_name': tag_name,
        }, status=status.HTTP_201_CREATED)


class CompareView(APIView):
    """
    GET /v1/simple/prompts/{id}/compare
    Compare two versions.
    """

    def get(self, request, prompt_id):
        from_ref = request.query_params.get('from')
        to_ref = request.query_params.get('to', 'latest')

        if not from_ref:
            raise ValidationError("'from' parameter is required")

        git_service = GitService()
        index_service = IndexService()

        # Get entry
        entry = index_service.get_by_id(prompt_id)
        if not entry:
            raise ResourceNotFoundError(f"Prompt {prompt_id} not found")

        file_path = entry['file_path']

        # Resolve refs
        tag_prefix = f"{settings.VERSION_TAG_PREFIX}/{prompt_id}/"

        if from_ref.startswith('v'):
            from_ref = f"{tag_prefix}{from_ref}"
        if to_ref == 'latest' or to_ref.startswith('v'):
            tags = git_service.list_tags(prefix=tag_prefix)
            versions = [t['name'].replace(tag_prefix, '') for t in tags]
            latest = VersionService.get_latest_version(versions)
            if to_ref == 'latest':
                to_ref = f"{tag_prefix}{latest}" if latest else None
            else:
                to_ref = f"{tag_prefix}{to_ref}"

        # Get diff
        diff_result = git_service.diff_files(from_ref, to_ref, file_path)

        # Parse metadata from both versions
        from_content = git_service.read_file(file_path, from_ref)
        to_content = git_service.read_file(file_path, to_ref)

        from_meta, _ = parse_frontmatter(from_content)
        to_meta, _ = parse_frontmatter(to_content)

        # Calculate metadata changes
        metadata_changes = {}
        all_keys = set(from_meta.keys()) | set(to_meta.keys())
        for key in all_keys:
            if from_meta.get(key) != to_meta.get(key):
                metadata_changes[key] = {
                    'old': from_meta.get(key),
                    'new': to_meta.get(key),
                }

        return Response({
            'prompt_id': prompt_id,
            'from_ref': from_ref,
            'to_ref': to_ref,
            'metadata_changes': metadata_changes,
            'additions': diff_result['additions'],
            'deletions': diff_result['deletions'],
            'diff': diff_result['diff'],
        })


class RollbackView(APIView):
    """
    POST /v1/simple/prompts/{id}/rollback
    Rollback to previous version.
    """

    def post(self, request, prompt_id):
        to_version = request.data.get('to_version')
        channel = request.data.get('channel', 'prod')
        strategy = request.data.get('strategy', 'revert_and_publish')
        version = request.data.get('version', 'auto')
        notes = request.data.get('notes', f'Rollback to {to_version}')

        if not to_version:
            raise ValidationError("to_version is required")

        git_service = GitService()
        index_service = IndexService()

        # Get entry
        entry = index_service.get_by_id(prompt_id)
        if not entry:
            raise ResourceNotFoundError(f"Prompt {prompt_id} not found")

        file_path = entry['file_path']

        # Get content from target version
        tag_prefix = f"{settings.VERSION_TAG_PREFIX}/{prompt_id}/"
        target_ref = f"{tag_prefix}{to_version}"

        rollback_content = git_service.read_file(file_path, target_ref)

        # Determine new version
        if version == 'auto':
            tags = git_service.list_tags(prefix=tag_prefix)
            versions = [t['name'].replace(tag_prefix, '') for t in tags]
            current_version = VersionService.get_latest_version(versions) or 'v0.0.0'
            version = VersionService.increment_version(current_version, 'patch')

        # Write rollback commit
        git_service.checkout_branch('main')
        commit_sha = git_service.write_file(
            file_path,
            rollback_content,
            f"Rollback {prompt_id} to {to_version}: {notes}",
            author="release-bot <release-bot@promptmanager.local>"
        )

        # Create new release tag
        tag_name = VersionService.build_tag_name(prompt_id, version)
        tag_message = VersionService.create_release_metadata(
            version, channel, notes, commit_sha,
            rollback_from=to_version
        )

        git_service.create_tag(
            tag_name,
            commit_sha,
            message=tag_message,
            tagger="release-bot <release-bot@promptmanager.local>"
        )

        # Update index
        metadata, _ = parse_frontmatter(rollback_content)
        index_service.add_or_update(prompt_id, metadata, file_path, commit_sha)

        return Response({
            'type': 'release',
            'version': version,
            'channel': channel,
            'released_at': datetime.utcnow().isoformat(),
            'sha': commit_sha,
            'notes': notes,
            'rollback_to': to_version,
        }, status=status.HTTP_201_CREATED)
