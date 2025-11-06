"""
URL patterns for Common API.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Search
    path('search', views.SearchView.as_view(), name='common-search'),

    # Index management
    path('index/status', views.IndexStatusView.as_view(), name='common-index-status'),
    path('index/repair', views.IndexRepairView.as_view(), name='common-index-repair'),
    path('index/rebuild', views.IndexRebuildView.as_view(), name='common-index-rebuild'),

    # Schemas
    path('schemas/frontmatter', views.FrontMatterSchemaView.as_view(), name='common-schema-frontmatter'),
    path('schemas/index', views.IndexSchemaView.as_view(), name='common-schema-index'),

    # Validation
    path('validate/frontmatter', views.ValidateFrontMatterView.as_view(), name='common-validate-frontmatter'),

    # Health
    path('health', views.HealthView.as_view(), name='common-health'),
]
