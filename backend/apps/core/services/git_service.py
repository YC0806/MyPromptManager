"""
Git operations service using dulwich.
Handles low-level Git operations for the prompt repository.
"""
from pathlib import Path
from typing import Optional, List, Dict
from datetime import datetime
import json

from dulwich import porcelain
from dulwich.repo import Repo
from dulwich.objects import Commit, Tag
from dulwich.errors import NotGitRepository
from django.conf import settings

from backend.apps.core.exceptions import ResourceNotFoundError


class GitService:
    """Service for Git operations using dulwich."""

    def __init__(self, repo_path: Optional[str] = None):
        """
        Initialize Git service.

        Args:
            repo_path: Path to git repository. Defaults to settings.GIT_REPO_ROOT
        """
        self.repo_path = Path(repo_path or settings.GIT_REPO_ROOT)
        self._repo = None

    @property
    def repo(self) -> Repo:
        """Get or initialize the git repository."""
        if self._repo is None:
            try:
                self._repo = Repo(str(self.repo_path))
            except NotGitRepository:
                # Initialize new repository
                self._repo = Repo.init(str(self.repo_path))
                # Create initial structure
                self._create_initial_structure()
        return self._repo

    def _create_initial_structure(self):
        """Create initial directory structure."""
        dirs = [
            self.repo_path / '.promptmeta' / 'schema',
            self.repo_path / 'prompts',
            self.repo_path / 'templates',
        ]
        for dir_path in dirs:
            dir_path.mkdir(parents=True, exist_ok=True)

        # Create empty index.json
        index_path = self.repo_path / '.promptmeta' / 'index.json'
        if not index_path.exists():
            index_path.write_text(json.dumps({'prompts': [], 'templates': []}, indent=2))

    def get_current_branch(self) -> str:
        """Get current branch name."""
        try:
            return self.repo.refs[b'HEAD'].decode('utf-8').split('/')[-1]
        except:
            return settings.GIT_DEFAULT_BRANCH

    def checkout_branch(self, branch: str, create: bool = False) -> None:
        """
        Checkout a branch.

        Args:
            branch: Branch name
            create: Create branch if it doesn't exist
        """
        branch_ref = f'refs/heads/{branch}'.encode('utf-8')

        if create and branch_ref not in self.repo.refs:
            # Create new branch from current HEAD
            head_sha = self.repo.head()
            self.repo.refs[branch_ref] = head_sha

        porcelain.checkout_branch(self.repo, branch.encode('utf-8'))

    def read_file(self, file_path: str, ref: Optional[str] = None) -> str:
        """
        Read file content from repository.

        Args:
            file_path: Path relative to repo root
            ref: Git reference (branch, tag, or SHA). None for working tree.
                 Can be a tag name (e.g., 'prompt/xxx/v1.0.0'), branch name, or SHA.

        Returns:
            File content as string

        Raises:
            ResourceNotFoundError: If file not found
        """
        if ref:
            # Read from specific ref
            try:
                # Try to resolve ref (could be tag name, branch name, or SHA)
                ref_bytes = ref.encode('utf-8')
                obj = None

                # Try different ref formats
                for ref_format in [
                    ref_bytes,  # Direct SHA
                    f'refs/tags/{ref}'.encode('utf-8'),  # Tag
                    f'refs/heads/{ref}'.encode('utf-8'),  # Branch
                ]:
                    try:
                        if ref_format in self.repo.refs:
                            obj = self.repo[self.repo.refs[ref_format]]
                            break
                        else:
                            # Try as direct SHA
                            obj = self.repo[ref_bytes]
                            break
                    except KeyError:
                        continue

                if obj is None:
                    raise KeyError(f"Reference {ref} not found")

                # If it's a tag object, dereference to commit
                if isinstance(obj, Tag):
                    commit = self.repo[obj.object[1]]
                else:
                    commit = obj

                # Get tree object (commit.tree returns SHA, need to dereference)
                tree = self.repo[commit.tree]

                # Navigate through directory structure
                path_parts = file_path.split('/')
                current_tree = tree

                for part in path_parts[:-1]:
                    # Navigate to subdirectory
                    mode, sha = current_tree[part.encode('utf-8')]
                    current_tree = self.repo[sha]

                # Get the file blob
                file_name = path_parts[-1]
                mode, blob_sha = current_tree[file_name.encode('utf-8')]
                blob = self.repo[blob_sha]
                return blob.data.decode('utf-8')
            except KeyError as e:
                raise ResourceNotFoundError(f"File {file_path} not found at ref {ref}: {str(e)}")
        else:
            # Read from working tree
            full_path = self.repo_path / file_path
            if not full_path.exists():
                raise ResourceNotFoundError(f"File {file_path} not found")
            return full_path.read_text()

    def write_file(self, file_path: str, content: str, message: str,
                   author: Optional[str] = None) -> str:
        """
        Write file and commit.

        Args:
            file_path: Path relative to repo root
            content: File content
            message: Commit message
            author: Author name/email

        Returns:
            Commit SHA
        """
        full_path = self.repo_path / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_text(content)

        # Stage and commit
        porcelain.add(self.repo, str(full_path))

        author_str = author or 'System <system@promptmanager.local>'
        commit_sha = porcelain.commit(
            self.repo,
            message=message.encode('utf-8'),
            author=author_str.encode('utf-8'),
            committer=author_str.encode('utf-8')
        )

        return commit_sha.decode('utf-8')

    def get_file_history(self, file_path: str, limit: int = 50) -> List[Dict]:
        """
        Get commit history for a file.

        Args:
            file_path: Path relative to repo root
            limit: Maximum number of commits to return

        Returns:
            List of commit dictionaries
        """
        commits = []
        walker = self.repo.get_walker(paths=[file_path.encode('utf-8')], max_entries=limit)

        for entry in walker:
            commit = entry.commit
            commits.append({
                'sha': commit.id.decode('utf-8'),
                'message': commit.message.decode('utf-8'),
                'author': commit.author.decode('utf-8'),
                'timestamp': datetime.fromtimestamp(commit.commit_time).isoformat(),
            })

        return commits

    def create_tag(self, tag_name: str, ref: str, message: Optional[str] = None,
                   tagger: Optional[str] = None) -> None:
        """
        Create an annotated tag.

        Args:
            tag_name: Tag name (e.g., 'prompt/<id>/v1.0.0')
            ref: Commit SHA to tag
            message: Tag message (JSON metadata)
            tagger: Tagger name/email
        """
        tag_ref = f'refs/tags/{tag_name}'.encode('utf-8')

        if message:
            # Create annotated tag
            tag = Tag()
            tag.name = tag_name.encode('utf-8')
            tag.object = (Commit, ref.encode('utf-8'))
            tag.tag_time = int(datetime.now().timestamp())
            tag.tag_timezone = 0
            tag.tagger = (tagger or 'System <system@promptmanager.local>').encode('utf-8')
            tag.message = message.encode('utf-8')

            self.repo.object_store.add_object(tag)
            self.repo.refs[tag_ref] = tag.id
        else:
            # Lightweight tag
            self.repo.refs[tag_ref] = ref.encode('utf-8')

    def list_tags(self, prefix: Optional[str] = None) -> List[Dict]:
        """
        List tags with optional prefix filter.

        Args:
            prefix: Tag prefix filter (e.g., 'prompt/<id>/')

        Returns:
            List of tag dictionaries
        """
        tags = []
        prefix_bytes = prefix.encode('utf-8') if prefix else None

        for ref in self.repo.refs.keys():
            if not ref.startswith(b'refs/tags/'):
                continue

            tag_name = ref[len(b'refs/tags/'):].decode('utf-8')

            if prefix_bytes and not ref[len(b'refs/tags/'):].startswith(prefix_bytes):
                continue

            tag_obj = self.repo[self.repo.refs[ref]]

            tag_info = {
                'name': tag_name,
                'sha': tag_obj.id.decode('utf-8'),
            }

            # If annotated tag, extract metadata
            if isinstance(tag_obj, Tag):
                tag_info['message'] = tag_obj.message.decode('utf-8')
                tag_info['tagger'] = tag_obj.tagger.decode('utf-8')
                tag_info['date'] = datetime.fromtimestamp(tag_obj.tag_time).isoformat()

            tags.append(tag_info)

        return tags

    def get_file_sha(self, file_path: str) -> str:
        """
        Get SHA of file at HEAD.

        Args:
            file_path: Path relative to repo root

        Returns:
            File blob SHA

        Raises:
            ResourceNotFoundError: If file not found
        """
        try:
            head = self.repo.head()
            commit = self.repo[head]
            # Get tree object (commit.tree returns SHA, need to dereference)
            tree = self.repo[commit.tree]

            # Navigate through directory structure
            path_parts = file_path.split('/')
            current_tree = tree

            for part in path_parts[:-1]:
                # Navigate to subdirectory
                mode, sha = current_tree[part.encode('utf-8')]
                current_tree = self.repo[sha]

            # Get the file blob SHA
            file_name = path_parts[-1]
            mode, blob_sha = current_tree[file_name.encode('utf-8')]
            return blob_sha.hex()
        except KeyError:
            raise ResourceNotFoundError(f"File {file_path} not found at HEAD")

    def diff_files(self, from_ref: str, to_ref: str, file_path: str) -> Dict:
        """
        Get diff between two refs for a specific file.

        Args:
            from_ref: Source reference
            to_ref: Target reference
            file_path: Path relative to repo root

        Returns:
            Dict with diff information
        """
        from_content = self.read_file(file_path, from_ref)
        to_content = self.read_file(file_path, to_ref)

        # Simple line-based diff
        from_lines = from_content.splitlines()
        to_lines = to_content.splitlines()

        import difflib
        diff = list(difflib.unified_diff(from_lines, to_lines, lineterm=''))

        return {
            'from_ref': from_ref,
            'to_ref': to_ref,
            'file_path': file_path,
            'additions': sum(1 for line in diff if line.startswith('+')),
            'deletions': sum(1 for line in diff if line.startswith('-')),
            'diff': '\n'.join(diff),
        }
