"""
URL patterns for Detail API.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Prompt history and diff
    path('prompts/<str:prompt_id>/history', views.HistoryView.as_view(), name='detail-prompt-history'),
    path('prompts/<str:prompt_id>/diff', views.DiffView.as_view(), name='detail-prompt-diff'),
    path('prompts/<str:prompt_id>/raw', views.RawContentView.as_view(), name='detail-prompt-raw'),
    path('prompts/<str:prompt_id>/releases', views.ReleasesView.as_view(), name='detail-prompt-releases'),

    # Template history and diff
    path('templates/<str:template_id>/history', views.HistoryView.as_view(), name='detail-template-history'),
    path('templates/<str:template_id>/diff', views.DiffView.as_view(), name='detail-template-diff'),
    path('templates/<str:template_id>/raw', views.RawContentView.as_view(), name='detail-template-raw'),
    path('templates/<str:template_id>/releases', views.ReleasesView.as_view(), name='detail-template-releases'),

    # Chat history and diff
    path('chats/<str:chat_id>/history', views.HistoryView.as_view(), name='detail-chat-history'),
    path('chats/<str:chat_id>/diff', views.DiffView.as_view(), name='detail-chat-diff'),
    path('chats/<str:chat_id>/raw', views.RawContentView.as_view(), name='detail-chat-raw'),
    path('chats/<str:chat_id>/releases', views.ReleasesView.as_view(), name='detail-chat-releases'),

    # Git operations
    path('git/branches', views.GitBranchesView.as_view(), name='detail-git-branches'),
    path('git/checkout', views.GitCheckoutView.as_view(), name='detail-git-checkout'),
    path('git/tag', views.GitTagView.as_view(), name='detail-git-tag'),
]
