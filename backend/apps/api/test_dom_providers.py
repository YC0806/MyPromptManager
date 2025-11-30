from django.test import TestCase
from rest_framework.test import APIClient

from backend.apps.api.dom_providers import dom_provider_store


class DomProviderApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_list_returns_version_and_configs(self):
        response = self.client.get('/v1/providers')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['version'], dom_provider_store.version)
        self.assertGreater(len(data['providers']), 0)
        self.assertEqual(response['Access-Control-Allow-Origin'], '*')

    def test_version_short_circuit(self):
        response = self.client.get('/v1/providers', {'version': dom_provider_store.version})
        self.assertEqual(response.status_code, 304)
        self.assertEqual(response['Access-Control-Allow-Origin'], '*')

    def test_host_filtering(self):
        response = self.client.get('/v1/providers', {'host': 'claude.ai'})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(all(cfg['id'] == 'Claude' for cfg in data['providers']))

    def test_path_filtering(self):
        response = self.client.get('/v1/providers', {'path': '/chat/1234'})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(any(cfg['id'] == 'Claude' for cfg in data['providers']))

    def test_detail_endpoint(self):
        response = self.client.get('/v1/providers/ChatGPT')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['id'], 'ChatGPT')
        self.assertEqual(data['version'], dom_provider_store.version)

    def test_detail_not_found_for_mismatched_filters(self):
        response = self.client.get('/v1/providers/ChatGPT', {'host': 'example.com'})
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response['Access-Control-Allow-Origin'], '*')
