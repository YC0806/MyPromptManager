"""
Utilities for parsing and serializing Markdown with YAML Front Matter.
"""
import re
import json
from typing import Dict, Tuple, Optional
from ruamel.yaml import YAML


def parse_frontmatter(content: str) -> Tuple[Dict, str]:
    """
    Parse Markdown content with YAML or JSON Front Matter.

    Supports both YAML and JSON formats between --- delimiters.

    Returns:
        Tuple of (frontmatter_dict dict, body)
    """
    # Match front matter between --- delimiters
    pattern = r'^---\s*\n(.*?)\n---\s*\n(.*)$'
    match = re.match(pattern, content, re.DOTALL)

    if not match:
        return {}, content

    frontmatter_content = match.group(1).strip()
    body = match.group(2)

    # Try to parse as JSON first (if it starts with {)
    if frontmatter_content.startswith('{'):
        try:
            frontmatter_dict = json.loads(frontmatter_content)
            return frontmatter_dict, body
        except json.JSONDecodeError:
            pass  # Fall back to YAML

    # Parse as YAML
    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.default_flow_style = False

    try:
        frontmatter_dict = yaml.load(frontmatter_content) or {}
    except Exception:
        frontmatter_dict = {}

    return frontmatter_dict, body


def serialize_frontmatter(metadata: Dict, body: str) -> str:
    """
    Serialize metadata and body into Markdown with YAML Front Matter.

    Args:
        metadata: Dictionary of metadata
        body: Markdown body content

    Returns:
        Complete Markdown string with front matter
    """
    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.default_flow_style = False

    if not metadata:
        return body

    import io
    stream = io.StringIO()
    yaml.dump(metadata, stream)
    yaml_str = stream.getvalue()

    return f"---\n{yaml_str}---\n{body}"


def extract_metadata_fields(metadata: Dict) -> Dict:
    """
    Extract standard fields from metadata.

    Expected fields:
        - id (ULID)
        - title
        - description
        - type (prompt/template)
        - slug
        - labels (list)
        - created_at
        - updated_at
        - author
        - variables (for templates only): list of {name, description, default}
    """
    fields = {
        'id': metadata.get('id'),
        'title': metadata.get('title', ''),
        'description': metadata.get('description', ''),
        'type': metadata.get('type', 'prompt'),
        'slug': metadata.get('slug', ''),
        'labels': metadata.get('labels', []),
        'created_at': metadata.get('created_at'),
        'updated_at': metadata.get('updated_at'),
        'author': metadata.get('author', ''),
    }

    # Add variables field for templates
    if metadata.get('type') == 'template' and 'variables' in metadata:
        fields['variables'] = metadata.get('variables', [])

    return fields
