"""
URL patterns for Detail API.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Prompt history and diff
    path('prompts/<str:prompt_id>/history', views.HistoryView.as_view(), name='detail-history'),
    path('prompts/<str:prompt_id>/diff', views.DiffView.as_view(), name='detail-diff'),
    path('prompts/<str:prompt_id>/raw', views.RawContentView.as_view(), name='detail-raw'),

    # Releases
    path('prompts/<str:prompt_id>/releases', views.ReleasesView.as_view(), name='detail-releases'),

    # Git operations
    path('git/branches', views.GitBranchesView.as_view(), name='detail-git-branches'),
    path('git/checkout', views.GitCheckoutView.as_view(), name='detail-git-checkout'),
    path('git/tag', views.GitTagView.as_view(), name='detail-git-tag'),
]
