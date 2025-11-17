#!/usr/bin/env python
"""
Test script for new storage logic.
Verifies that:
1. YAML file stores full metadata
2. Markdown Front Matter only stores minimal info (id, created_at, created_by, variables)
3. read_version correctly merges data
"""

import os
import sys
import django
import json

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from backend.apps.core.services.file_storage_service import FileStorageService
from datetime import datetime
from pathlib import Path
import tempfile
import shutil


def test_prompt_storage():
    """Test Prompt storage logic."""
    print("=" * 60)
    print("Testing Prompt Storage Logic")
    print("=" * 60)

    # Create temporary storage
    temp_dir = Path(tempfile.mkdtemp())
    print(f"\n📁 Using temporary directory: {temp_dir}\n")

    try:
        storage = FileStorageService(str(temp_dir))

        # Test data
        metadata = {
            'title': 'Test Prompt',
            'slug': 'test-prompt',
            'description': 'A test prompt for storage logic',
            'labels': ['test', 'demo'],
            'author': 'john_doe',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'type': 'prompt',
        }

        content = "# Test Prompt Content\n\nThis is a test prompt."

        # Create item
        item_id, version_id = storage.create_item('prompt', metadata, content)
        print(f"✅ Created Prompt: {item_id}")
        print(f"   Version ID: {version_id}\n")

        # Check YAML file
        yaml_path = temp_dir / 'prompts' / f"prompt_{metadata['slug']}-{item_id}" / 'prompt.yaml'
        print(f"📄 Checking YAML file: {yaml_path}")

        import yaml
        with open(yaml_path, 'r') as f:
            yaml_data = yaml.safe_load(f)

        print(f"   YAML contains: {list(yaml_data.keys())}")
        assert 'title' in yaml_data, "YAML should contain title"
        assert 'description' in yaml_data, "YAML should contain description"
        assert 'labels' in yaml_data, "YAML should contain labels"
        print("   ✅ YAML file contains full metadata\n")

        # Check Markdown Front Matter
        version_path = temp_dir / 'prompts' / f"prompt_{metadata['slug']}-{item_id}" / 'versions' / f"pv_{metadata['slug']}-{item_id}_{version_id}.md"
        print(f"📄 Checking Markdown file: {version_path}")

        with open(version_path, 'r') as f:
            md_content = f.read()

        # Extract frontmatter
        import re
        match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', md_content, re.DOTALL)
        if match:
            frontmatter_str = match.group(1)
            frontmatter_data = json.loads(frontmatter_str)
            print(f"   Front Matter contains: {list(frontmatter_data.keys())}")

            # Verify minimal frontmatter
            assert 'id' in frontmatter_data, "Front Matter should contain id"
            assert 'created_at' in frontmatter_data, "Front Matter should contain created_at"
            assert 'created_by' in frontmatter_data, "Front Matter should contain created_by"

            # Should NOT contain these fields
            assert 'title' not in frontmatter_data, "Front Matter should NOT contain title"
            assert 'description' not in frontmatter_data, "Front Matter should NOT contain description"
            assert 'labels' not in frontmatter_data, "Front Matter should NOT contain labels"

            print("   ✅ Front Matter contains only minimal info (id, created_at, created_by)\n")
        else:
            raise AssertionError("Could not parse Front Matter")

        # Test read_version (should merge data)
        print("🔍 Testing read_version (should merge YAML + Front Matter)")
        merged_metadata, body = storage.read_version('prompt', item_id, metadata['slug'])

        print(f"   Merged metadata contains: {list(merged_metadata.keys())}")
        assert 'title' in merged_metadata, "Merged metadata should contain title"
        assert 'description' in merged_metadata, "Merged metadata should contain description"
        assert 'labels' in merged_metadata, "Merged metadata should contain labels"
        assert 'id' in merged_metadata, "Merged metadata should contain id"
        print("   ✅ read_version correctly merges YAML + Front Matter\n")

        print("✅ Prompt storage test PASSED!\n")

    finally:
        # Cleanup
        shutil.rmtree(temp_dir)
        print(f"🧹 Cleaned up temporary directory\n")


def test_template_storage():
    """Test Template storage logic with variables."""
    print("=" * 60)
    print("Testing Template Storage Logic")
    print("=" * 60)

    # Create temporary storage
    temp_dir = Path(tempfile.mkdtemp())
    print(f"\n📁 Using temporary directory: {temp_dir}\n")

    try:
        storage = FileStorageService(str(temp_dir))

        # Test data with variables
        metadata = {
            'title': 'Email Template',
            'slug': 'email-template',
            'description': 'A reusable email template',
            'labels': ['email', 'marketing'],
            'author': 'jane_doe',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'type': 'template',
            'variables': [
                {
                    'name': 'recipient_name',
                    'description': 'Name of the recipient',
                    'default': 'User'
                },
                {
                    'name': 'subject',
                    'description': 'Email subject',
                    'default': 'Welcome'
                }
            ]
        }

        content = "# Hello {{recipient_name}}\n\nSubject: {{subject}}"

        # Create item
        item_id, version_id = storage.create_item('template', metadata, content)
        print(f"✅ Created Template: {item_id}")
        print(f"   Version ID: {version_id}\n")

        # Check YAML file
        yaml_path = temp_dir / 'templates' / f"template_{metadata['slug']}-{item_id}" / 'template.yaml'
        print(f"📄 Checking YAML file: {yaml_path}")

        import yaml
        with open(yaml_path, 'r') as f:
            yaml_data = yaml.safe_load(f)

        print(f"   YAML contains: {list(yaml_data.keys())}")
        assert 'variables' in yaml_data, "YAML should contain variables"
        print(f"   Variables in YAML: {len(yaml_data['variables'])} variables")
        print("   ✅ YAML file contains full metadata including variables\n")

        # Check Markdown Front Matter
        version_path = temp_dir / 'templates' / f"template_{metadata['slug']}-{item_id}" / 'versions' / f"tv_{metadata['slug']}-{item_id}_{version_id}.md"
        print(f"📄 Checking Markdown file: {version_path}")

        with open(version_path, 'r') as f:
            md_content = f.read()

        # Extract frontmatter
        import re
        match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', md_content, re.DOTALL)
        if match:
            frontmatter_str = match.group(1)
            frontmatter_data = json.loads(frontmatter_str)
            print(f"   Front Matter contains: {list(frontmatter_data.keys())}")

            # Verify minimal frontmatter + variables
            assert 'id' in frontmatter_data, "Front Matter should contain id"
            assert 'created_at' in frontmatter_data, "Front Matter should contain created_at"
            assert 'created_by' in frontmatter_data, "Front Matter should contain created_by"
            assert 'variables' in frontmatter_data, "Front Matter should contain variables (for templates)"

            print(f"   Variables in Front Matter: {len(frontmatter_data['variables'])} variables")
            print("   ✅ Front Matter contains minimal info + variables\n")
        else:
            raise AssertionError("Could not parse Front Matter")

        # Test read_version
        print("🔍 Testing read_version")
        merged_metadata, body = storage.read_version('template', item_id, metadata['slug'])

        assert 'variables' in merged_metadata, "Merged metadata should contain variables"
        print(f"   Variables in merged metadata: {len(merged_metadata['variables'])} variables")
        print("   ✅ read_version correctly includes variables\n")

        print("✅ Template storage test PASSED!\n")

    finally:
        # Cleanup
        shutil.rmtree(temp_dir)
        print(f"🧹 Cleaned up temporary directory\n")


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("STORAGE LOGIC TEST SUITE")
    print("=" * 60 + "\n")

    try:
        test_prompt_storage()
        test_template_storage()

        print("=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60 + "\n")

    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
