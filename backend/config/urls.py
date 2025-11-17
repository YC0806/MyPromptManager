"""
URL configuration for MyPromptManager project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Unified API (replaces simple/detail dual architecture)
    path('v1/', include('backend.apps.api.urls')),
]
