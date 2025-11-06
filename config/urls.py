"""
URL configuration for MyPromptManager project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('v1/simple/', include('apps.api_simple.urls')),
    path('v1/detail/', include('apps.api_detail.urls')),
    path('v1/', include('apps.api_common.urls')),
]
