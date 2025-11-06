"""
URL patterns for Simple API.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Timeline and content
    path('prompts/<str:prompt_id>/timeline', views.TimelineView.as_view(), name='simple-timeline'),
    path('prompts/<str:prompt_id>/content', views.ContentView.as_view(), name='simple-content'),

    # Draft and publish
    path('prompts/<str:prompt_id>/save', views.SaveDraftView.as_view(), name='simple-save'),
    path('prompts/<str:prompt_id>/publish', views.PublishView.as_view(), name='simple-publish'),

    # Compare and rollback
    path('prompts/<str:prompt_id>/compare', views.CompareView.as_view(), name='simple-compare'),
    path('prompts/<str:prompt_id>/rollback', views.RollbackView.as_view(), name='simple-rollback'),
]
