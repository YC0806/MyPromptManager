import shutil
import tempfile
from pathlib import Path

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class PromptApiTests(APITestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp(prefix="prompt-storage-api-")
        self.addCleanup(lambda: shutil.rmtree(self.temp_dir, ignore_errors=True))
        self.override = override_settings(PROMPT_STORAGE_ROOT=Path(self.temp_dir))
        self.override.enable()
        self.user = User.objects.create_user(
            username="tester", email="tester@example.com", password="securepass123"
        )
        self.client.force_authenticate(self.user)

    def tearDown(self):
        self.override.disable()

    def test_create_prompt_and_add_version(self):
        list_url = reverse("prompt-list")
        payload = {
            "name": "API Prompt",
            "description": "Created via API",
            "content": "Initial content",
            "metadata": {"intent": "demo"},
            "tags": ["api"],
            "changelog": "Initial publish",
        }
        response = self.client.post(list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        prompt_id = response.data["id"]
        self.assertEqual(response.data["active_version"]["version"], 1)

        version_url = reverse("prompt-version-list")
        response = self.client.post(
            version_url,
            {
                "prompt": prompt_id,
                "content": "Second content",
                "metadata": {"intent": "demo", "revision": 2},
                "changelog": "Second iteration",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        detail_url = reverse("prompt-detail", args=[prompt_id])
        detail = self.client.get(detail_url)
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertEqual(detail.data["active_version"]["version"], 2)
        self.assertEqual(
            detail.data["active_version"]["metadata"]["revision"], 2
        )

        restore_url = reverse("prompt-version-restore", args=[f"{prompt_id}:v1"])
        response = self.client.post(
            restore_url, {"changelog": "Rolling back"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        refreshed = self.client.get(detail_url)
        self.assertEqual(refreshed.data["active_version"]["version"], 3)
