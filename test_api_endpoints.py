#!/usr/bin/env python
"""
Test script for API endpoints to verify prompt/template distinction.
"""
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.test import RequestFactory
from apps.api_detail.views import HistoryView, DiffView, RawContentView, ReleasesView
from apps.api_simple.views import TimelineView, ContentView, SaveDraftView, PublishView, CompareView, RollbackView
from apps.api_common.views import SearchView


def test_detail_api():
    """Test Detail API endpoints."""
    print("\n=== Testing Detail API ===")
    factory = RequestFactory()

    # Test HistoryView with prompt_id
    view = HistoryView.as_view()
    request = factory.get('/v1/detail/prompts/test-id/history')
    try:
        response = view(request, prompt_id='test-id')
        print(f"✓ HistoryView with prompt_id: accepts prompt_id parameter")
    except Exception as e:
        print(f"✗ HistoryView with prompt_id failed: {e}")

    # Test HistoryView with template_id
    try:
        response = view(request, template_id='test-id')
        print(f"✓ HistoryView with template_id: accepts template_id parameter")
    except Exception as e:
        print(f"✗ HistoryView with template_id failed: {e}")

    # Test DiffView
    view = DiffView.as_view()
    request = factory.get('/v1/detail/prompts/test-id/diff?from=v1.0.0&to=v1.1.0')
    try:
        response = view(request, prompt_id='test-id')
        print(f"✓ DiffView with prompt_id: accepts prompt_id parameter")
    except Exception as e:
        print(f"✗ DiffView with prompt_id failed: {e}")

    try:
        response = view(request, template_id='test-id')
        print(f"✓ DiffView with template_id: accepts template_id parameter")
    except Exception as e:
        print(f"✗ DiffView with template_id failed: {e}")

    # Test RawContentView
    view = RawContentView.as_view()
    request = factory.get('/v1/detail/prompts/test-id/raw')
    try:
        response = view(request, prompt_id='test-id')
        print(f"✓ RawContentView GET with prompt_id: accepts prompt_id parameter")
    except Exception as e:
        print(f"✗ RawContentView GET with prompt_id failed: {e}")

    try:
        response = view(request, template_id='test-id')
        print(f"✓ RawContentView GET with template_id: accepts template_id parameter")
    except Exception as e:
        print(f"✗ RawContentView GET with template_id failed: {e}")

    # Test ReleasesView
    view = ReleasesView.as_view()
    request = factory.get('/v1/detail/prompts/test-id/releases')
    try:
        response = view(request, prompt_id='test-id')
        print(f"✓ ReleasesView with prompt_id: accepts prompt_id parameter")
    except Exception as e:
        print(f"✗ ReleasesView with prompt_id failed: {e}")

    try:
        response = view(request, template_id='test-id')
        print(f"✓ ReleasesView with template_id: accepts template_id parameter")
    except Exception as e:
        print(f"✗ ReleasesView with template_id failed: {e}")


def test_simple_api():
    """Test Simple API endpoints."""
    print("\n=== Testing Simple API ===")
    factory = RequestFactory()

    # Test TimelineView
    view = TimelineView.as_view()
    request = factory.get('/v1/simple/prompts/test-id/timeline')
    try:
        response = view(request, prompt_id='test-id')
        print(f"✓ TimelineView with prompt_id: accepts prompt_id parameter")
    except Exception as e:
        print(f"✗ TimelineView with prompt_id failed: {e}")

    try:
        response = view(request, template_id='test-id')
        print(f"✓ TimelineView with template_id: accepts template_id parameter")
    except Exception as e:
        print(f"✗ TimelineView with template_id failed: {e}")

    # Test ContentView
    view = ContentView.as_view()
    request = factory.get('/v1/simple/prompts/test-id/content')
    try:
        response = view(request, prompt_id='test-id')
        print(f"✓ ContentView with prompt_id: accepts prompt_id parameter")
    except Exception as e:
        print(f"✗ ContentView with prompt_id failed: {e}")

    try:
        response = view(request, template_id='test-id')
        print(f"✓ ContentView with template_id: accepts template_id parameter")
    except Exception as e:
        print(f"✗ ContentView with template_id failed: {e}")

    # Test SaveDraftView
    view = SaveDraftView.as_view()
    request = factory.post('/v1/simple/prompts/test-id/save',
                          data={'content': '---\nid: test\n---\nTest'},
                          content_type='application/json')
    try:
        response = view(request, prompt_id='test-id')
        print(f"✓ SaveDraftView with prompt_id: accepts prompt_id parameter")
    except Exception as e:
        print(f"✗ SaveDraftView with prompt_id failed: {e}")

    try:
        response = view(request, template_id='test-id')
        print(f"✓ SaveDraftView with template_id: accepts template_id parameter")
    except Exception as e:
        print(f"✗ SaveDraftView with template_id failed: {e}")

    # Test PublishView
    view = PublishView.as_view()
    request = factory.post('/v1/simple/prompts/test-id/publish',
                          data={'base_sha': 'abc123'},
                          content_type='application/json')
    try:
        response = view(request, prompt_id='test-id')
        print(f"✓ PublishView with prompt_id: accepts prompt_id parameter")
    except Exception as e:
        print(f"✗ PublishView with prompt_id failed: {e}")

    try:
        response = view(request, template_id='test-id')
        print(f"✓ PublishView with template_id: accepts template_id parameter")
    except Exception as e:
        print(f"✗ PublishView with template_id failed: {e}")

    # Test CompareView
    view = CompareView.as_view()
    request = factory.get('/v1/simple/prompts/test-id/compare?from=v1.0.0&to=v1.1.0')
    try:
        response = view(request, prompt_id='test-id')
        print(f"✓ CompareView with prompt_id: accepts prompt_id parameter")
    except Exception as e:
        print(f"✗ CompareView with prompt_id failed: {e}")

    try:
        response = view(request, template_id='test-id')
        print(f"✓ CompareView with template_id: accepts template_id parameter")
    except Exception as e:
        print(f"✗ CompareView with template_id failed: {e}")

    # Test RollbackView
    view = RollbackView.as_view()
    request = factory.post('/v1/simple/prompts/test-id/rollback',
                          data={'to_version': 'v1.0.0'},
                          content_type='application/json')
    try:
        response = view(request, prompt_id='test-id')
        print(f"✓ RollbackView with prompt_id: accepts prompt_id parameter")
    except Exception as e:
        print(f"✗ RollbackView with prompt_id failed: {e}")

    try:
        response = view(request, template_id='test-id')
        print(f"✓ RollbackView with template_id: accepts template_id parameter")
    except Exception as e:
        print(f"✗ RollbackView with template_id failed: {e}")


def test_common_api():
    """Test Common API endpoints."""
    print("\n=== Testing Common API ===")
    factory = RequestFactory()

    # Test SearchView with type filter
    view = SearchView.as_view()

    # Search all
    request = factory.get('/v1/search')
    try:
        response = view(request)
        print(f"✓ SearchView without type filter: works")
    except Exception as e:
        print(f"✗ SearchView without type filter failed: {e}")

    # Search prompts only
    request = factory.get('/v1/search?type=prompt')
    try:
        response = view(request)
        print(f"✓ SearchView with type=prompt: works")
    except Exception as e:
        print(f"✗ SearchView with type=prompt failed: {e}")

    # Search templates only
    request = factory.get('/v1/search?type=template')
    try:
        response = view(request)
        print(f"✓ SearchView with type=template: works")
    except Exception as e:
        print(f"✗ SearchView with type=template failed: {e}")


def test_url_patterns():
    """Test URL patterns."""
    print("\n=== Testing URL Patterns ===")
    from django.urls import resolve, reverse

    # Test Detail API URLs
    try:
        url = reverse('detail-prompt-history', kwargs={'prompt_id': 'test-id'})
        print(f"✓ detail-prompt-history URL: {url}")
    except Exception as e:
        print(f"✗ detail-prompt-history URL failed: {e}")

    try:
        url = reverse('detail-template-history', kwargs={'template_id': 'test-id'})
        print(f"✓ detail-template-history URL: {url}")
    except Exception as e:
        print(f"✗ detail-template-history URL failed: {e}")

    # Test Simple API URLs
    try:
        url = reverse('simple-prompt-timeline', kwargs={'prompt_id': 'test-id'})
        print(f"✓ simple-prompt-timeline URL: {url}")
    except Exception as e:
        print(f"✗ simple-prompt-timeline URL failed: {e}")

    try:
        url = reverse('simple-template-timeline', kwargs={'template_id': 'test-id'})
        print(f"✓ simple-template-timeline URL: {url}")
    except Exception as e:
        print(f"✗ simple-template-timeline URL failed: {e}")

    # Test Common API URLs
    try:
        url = reverse('common-search')
        print(f"✓ common-search URL: {url}")
    except Exception as e:
        print(f"✗ common-search URL failed: {e}")


def main():
    """Run all tests."""
    print("=" * 60)
    print("API Endpoint Tests - Prompt/Template Distinction")
    print("=" * 60)

    test_url_patterns()
    test_detail_api()
    test_simple_api()
    test_common_api()

    print("\n" + "=" * 60)
    print("Tests completed!")
    print("=" * 60)


if __name__ == '__main__':
    main()
