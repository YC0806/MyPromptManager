import shutil
import tempfile
from pathlib import Path

from django.test import TestCase, override_settings

from prompts import services


class MarkdownServiceTests(TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp(prefix="prompt-storage-")
        self.addCleanup(lambda: shutil.rmtree(self.temp_dir, ignore_errors=True))
        self.override = override_settings(PROMPT_STORAGE_ROOT=Path(self.temp_dir))
        self.override.enable()

    def tearDown(self):
        self.override.disable()

    def test_create_prompt_and_versions(self):
        prompt = services.create_prompt(
            name="Sample Prompt",
            description="A prompt for testing",
            tags=["general"],
            metadata={"tone": "friendly"},
            content="Initial content",
            changelog="Initial version",
        )

        self.assertEqual(prompt.active_version.version, 1)
        self.assertEqual(prompt.active_version.metadata["tone"], "friendly")
        self.assertTrue(Path(prompt.active_version.path).exists())

        second = services.create_prompt_version(
            prompt_id=prompt.id,
            content="Updated content",
            metadata={"tone": "formal"},
            changelog="Tweaked tone",
        )

        self.assertEqual(second.version, 2)
        latest = services.get_prompt(prompt.id)
        self.assertEqual(latest.active_version.version, 2)

        restored = services.restore_prompt_version(
            prompt_id=prompt.id, version=1, changelog="Restore v1"
        )
        self.assertEqual(restored.version, 3)
        refreshed = services.get_prompt(prompt.id)
        self.assertEqual(refreshed.active_version.version, 3)

    def test_create_template_and_versions(self):
        template = services.create_prompt_template(
            name="Email Template",
            description="Welcome mail",
            tags=["email"],
            metadata={"category": "welcome"},
            content="Hi {{name}}, welcome!",
            changelog="Initial",
            placeholders=["name"],
            render_example="Hi Alice, welcome!",
        )

        self.assertEqual(template.active_version.version, 1)
        self.assertEqual(template.active_version.placeholders, ["name"])

        second = services.create_prompt_template_version(
            template_id=template.id,
            content="Hello {{name}}, welcome aboard!",
            metadata={"category": "welcome"},
            changelog="Refined greeting",
            placeholders=["name"],
            render_example="Hello Bob, welcome aboard!",
        )

        self.assertEqual(second.version, 2)
        latest = services.get_template(template.id)
        self.assertEqual(latest.active_version.version, 2)

        restored = services.restore_prompt_template_version(
            template_id=template.id, version=1, changelog="Rollback to v1"
        )
        self.assertEqual(restored.version, 3)
        refreshed = services.get_template(template.id)
        self.assertEqual(refreshed.active_version.version, 3)
