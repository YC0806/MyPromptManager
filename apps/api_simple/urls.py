"""
URL patterns for Simple API.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Prompt timeline and content
    path('prompts/<str:prompt_id>/timeline', views.TimelineView.as_view(), name='simple-prompt-timeline'),
    path('prompts/<str:prompt_id>/content', views.ContentView.as_view(), name='simple-prompt-content'),
    path('prompts/<str:prompt_id>/save', views.SaveDraftView.as_view(), name='simple-prompt-save'),
    path('prompts/<str:prompt_id>/publish', views.PublishView.as_view(), name='simple-prompt-publish'),
    path('prompts/<str:prompt_id>/compare', views.CompareView.as_view(), name='simple-prompt-compare'),
    path('prompts/<str:prompt_id>/rollback', views.RollbackView.as_view(), name='simple-prompt-rollback'),

    # Template timeline and content
    path('templates/<str:template_id>/timeline', views.TimelineView.as_view(), name='simple-template-timeline'),
    path('templates/<str:template_id>/content', views.ContentView.as_view(), name='simple-template-content'),
    path('templates/<str:template_id>/save', views.SaveDraftView.as_view(), name='simple-template-save'),
    path('templates/<str:template_id>/publish', views.PublishView.as_view(), name='simple-template-publish'),
    path('templates/<str:template_id>/compare', views.CompareView.as_view(), name='simple-template-compare'),
    path('templates/<str:template_id>/rollback', views.RollbackView.as_view(), name='simple-template-rollback'),

    # Chat timeline and content
    path('chats/<str:chat_id>/timeline', views.TimelineView.as_view(), name='simple-chat-timeline'),
    path('chats/<str:chat_id>/content', views.ContentView.as_view(), name='simple-chat-content'),
    path('chats/<str:chat_id>/save', views.SaveDraftView.as_view(), name='simple-chat-save'),
    path('chats/<str:chat_id>/publish', views.PublishView.as_view(), name='simple-chat-publish'),
    path('chats/<str:chat_id>/compare', views.CompareView.as_view(), name='simple-chat-compare'),
    path('chats/<str:chat_id>/rollback', views.RollbackView.as_view(), name='simple-chat-rollback'),
]
