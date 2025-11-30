"""
URL patterns for unified API.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Prompts
    path('prompts', views.PromptsListView.as_view(), name='prompts-list'),
    path('prompts/<str:prompt_id>', views.PromptDetailView.as_view(), name='prompt-detail'),
    path('prompts/<str:prompt_id>/versions', views.PromptVersionsView.as_view(), name='prompt-versions'),
    path('prompts/<str:prompt_id>/versions/<str:version_id>', views.PromptVersionDetailView.as_view(), name='prompt-version-detail'),

    # Templates
    path('templates', views.TemplatesListView.as_view(), name='templates-list'),
    path('templates/<str:template_id>', views.TemplateDetailView.as_view(), name='template-detail'),
    path('templates/<str:template_id>/versions', views.TemplateVersionsView.as_view(), name='template-versions'),
    path('templates/<str:template_id>/versions/<str:version_id>', views.TemplateVersionDetailView.as_view(), name='template-version-detail'),

    # Chats (includes AI conversation histories from browser extension)
    path('chats', views.ChatsListView.as_view(), name='chats-list'),
    path('chats/<str:chat_id>', views.ChatDetailView.as_view(), name='chat-detail'),
    path('chats/<str:chat_id>/messages', views.ChatMessagesView.as_view(), name='chat-messages'),

    # Search (from common API)
    path('search', views.SearchView.as_view(), name='search'),

    # Index management
    path('index/status', views.IndexStatusView.as_view(), name='index-status'),
    path('index/rebuild', views.IndexRebuildView.as_view(), name='index-rebuild'),

    # DOM Providers for browser extension
    path('providers', views.DomProvidersView.as_view(), name='providers-list'),
    path('providers/<str:provider_id>', views.DomProviderDetailView.as_view(), name='provider-detail'),
]
