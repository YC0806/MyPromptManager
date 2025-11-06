"""
Version management service for semantic versioning and release management.
"""
import re
import json
from typing import Optional, Dict, List, Tuple
from datetime import datetime
import hashlib

from django.conf import settings

from apps.core.exceptions import ValidationError, ConflictError
from apps.core.utils.frontmatter import parse_frontmatter


class VersionService:
    """Service for version management and semantic versioning."""

    VERSION_PATTERN = re.compile(r'^v?(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.]+))?$')

    @staticmethod
    def parse_version(version: str) -> Tuple[int, int, int, Optional[str]]:
        """
        Parse semantic version string.

        Args:
            version: Version string (e.g., 'v1.2.3' or 'v1.2.3-rc.1')

        Returns:
            Tuple of (major, minor, patch, prerelease)

        Raises:
            ValidationError: If version format is invalid
        """
        match = VersionService.VERSION_PATTERN.match(version)
        if not match:
            raise ValidationError(f"Invalid version format: {version}")

        major, minor, patch, prerelease = match.groups()
        return int(major), int(minor), int(patch), prerelease

    @staticmethod
    def compare_versions(v1: str, v2: str) -> int:
        """
        Compare two versions.

        Args:
            v1: First version
            v2: Second version

        Returns:
            -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2
        """
        major1, minor1, patch1, pre1 = VersionService.parse_version(v1)
        major2, minor2, patch2, pre2 = VersionService.parse_version(v2)

        # Compare major.minor.patch
        if (major1, minor1, patch1) < (major2, minor2, patch2):
            return -1
        elif (major1, minor1, patch1) > (major2, minor2, patch2):
            return 1

        # If same version, check prerelease
        if pre1 and not pre2:
            return -1  # v1.0.0-rc < v1.0.0
        elif not pre1 and pre2:
            return 1   # v1.0.0 > v1.0.0-rc
        elif pre1 and pre2:
            return -1 if pre1 < pre2 else (1 if pre1 > pre2 else 0)

        return 0

    @staticmethod
    def increment_version(current: str, bump_type: str = 'patch') -> str:
        """
        Increment version based on bump type.

        Args:
            current: Current version
            bump_type: 'major', 'minor', or 'patch'

        Returns:
            New version string
        """
        major, minor, patch, _ = VersionService.parse_version(current)

        if bump_type == 'major':
            return f"v{major + 1}.0.0"
        elif bump_type == 'minor':
            return f"v{major}.{minor + 1}.0"
        else:  # patch
            return f"v{major}.{minor}.{patch + 1}"

    @staticmethod
    def suggest_version(old_content: str, new_content: str,
                       current_version: Optional[str] = None) -> str:
        """
        Suggest next version based on content changes.

        Rules:
        - Only text changes -> +patch
        - New sections/labels -> +minor
        - Structural/protocol changes -> +major

        Args:
            old_content: Previous content
            new_content: New content
            current_version: Current version (default: v0.1.0)

        Returns:
            Suggested version string
        """
        if not current_version:
            return "v0.1.0"

        old_meta, old_body = parse_frontmatter(old_content)
        new_meta, new_body = parse_frontmatter(new_content)

        # Check for major changes
        critical_fields = ['type', 'project']
        for field in critical_fields:
            if old_meta.get(field) != new_meta.get(field):
                return VersionService.increment_version(current_version, 'major')

        # Check for minor changes
        if old_meta.get('labels') != new_meta.get('labels'):
            return VersionService.increment_version(current_version, 'minor')

        # Check body changes
        old_sections = len(re.findall(r'^#+\s', old_body, re.MULTILINE))
        new_sections = len(re.findall(r'^#+\s', new_body, re.MULTILINE))

        if abs(new_sections - old_sections) > 0:
            return VersionService.increment_version(current_version, 'minor')

        # Default to patch
        return VersionService.increment_version(current_version, 'patch')

    @staticmethod
    def create_release_metadata(version: str, channel: str, notes: str,
                               sha: str, **extra) -> str:
        """
        Create release metadata JSON for tag message.

        Args:
            version: Version string
            channel: Release channel (prod/beta)
            notes: Release notes
            sha: Commit SHA
            **extra: Additional metadata

        Returns:
            JSON string
        """
        metadata = {
            'version': version,
            'channel': channel,
            'notes': notes,
            'released_at': datetime.utcnow().isoformat(),
            'checksum': hashlib.sha256(sha.encode()).hexdigest(),
            **extra
        }
        return json.dumps(metadata, indent=2)

    @staticmethod
    def parse_release_metadata(tag_message: str) -> Dict:
        """
        Parse release metadata from tag message.

        Args:
            tag_message: Tag message containing JSON

        Returns:
            Metadata dictionary
        """
        try:
            return json.loads(tag_message)
        except json.JSONDecodeError:
            return {'notes': tag_message}

    @staticmethod
    def build_tag_name(prompt_id: str, version: str) -> str:
        """
        Build tag name following convention.

        Args:
            prompt_id: Prompt ULID
            version: Version string

        Returns:
            Tag name (e.g., 'prompt/<id>/v1.0.0')
        """
        version = version if version.startswith('v') else f'v{version}'
        return f"{settings.VERSION_TAG_PREFIX}/{prompt_id}/{version}"

    @staticmethod
    def parse_tag_name(tag_name: str) -> Optional[Tuple[str, str]]:
        """
        Parse tag name to extract prompt ID and version.

        Args:
            tag_name: Tag name (e.g., 'prompt/<id>/v1.0.0')

        Returns:
            Tuple of (prompt_id, version) or None if invalid
        """
        pattern = rf'^{settings.VERSION_TAG_PREFIX}/([^/]+)/(.+)$'
        match = re.match(pattern, tag_name)
        if match:
            return match.group(1), match.group(2)
        return None

    @staticmethod
    def get_latest_version(versions: List[str]) -> Optional[str]:
        """
        Get latest version from list.

        Args:
            versions: List of version strings

        Returns:
            Latest version or None
        """
        if not versions:
            return None

        # Filter out prereleases for "latest"
        stable_versions = [v for v in versions if '-' not in v]
        if not stable_versions:
            stable_versions = versions

        return max(stable_versions, key=lambda v: VersionService.parse_version(v)[:3])

    @staticmethod
    def validate_version_bump(current: str, new: str) -> bool:
        """
        Validate that new version is greater than current.

        Args:
            current: Current version
            new: New version

        Returns:
            True if valid bump
        """
        return VersionService.compare_versions(new, current) > 0
