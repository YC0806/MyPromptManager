"""
Django models for audit logging and search indexing.
Note: Prompts/templates/chats are stored in files - database only used for indexing.
Note: No custom User model - using local setup without authentication.
"""
from django.db import models
import json


class IndexedItem(models.Model):
    """
    Database index for prompts, templates, and chats.
    Stores searchable metadata for fast lookups.
    Actual content lives in files.
    """
    # Core fields
    id = models.CharField(max_length=26, primary_key=True, help_text="ULID")
    item_type = models.CharField(max_length=20, db_index=True, choices=[
        ('prompt', 'Prompt'),
        ('template', 'Template'),
        ('chat', 'Chat'),
    ])
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
    slug = models.CharField(max_length=200)
    # Store labels as JSON for SQLite compatibility
    labels_json = models.TextField(default='[]', help_text="JSON array of labels")
    author = models.CharField(max_length=200, blank=True, default="")
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField(db_index=True)

    # Version fields (for prompts/templates)
    version_count = models.IntegerField(default=0)
    head_version_id = models.CharField(max_length=26, null=True, blank=True)
    head_version_number = models.CharField(max_length=50, null=True, blank=True)

    # File tracking
    file_path = models.CharField(max_length=500)
    sha = models.CharField(max_length=64, default="latest")

    # Chat-specific fields
    provider = models.CharField(max_length=100, null=True, blank=True)
    model = models.CharField(max_length=200, null=True, blank=True)
    conversation_id = models.CharField(max_length=200, null=True, blank=True)
    turn_count = models.IntegerField(default=0)

    class Meta:
        db_table = 'indexed_items'
        ordering = ['-updated_at', '-id']
        indexes = [
            # Primary lookup index
            models.Index(fields=['item_type', '-updated_at', '-id'], name='idx_type_updated'),
            # Slug uniqueness per type
            models.Index(fields=['item_type', 'slug'], name='idx_type_slug'),
            # Author filter
            models.Index(fields=['author'], name='idx_author'),
            # Provider filter (for chats)
            models.Index(fields=['provider'], name='idx_provider'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['item_type', 'slug'],
                name='unique_type_slug'
            )
        ]

    @property
    def labels(self):
        """Get labels as list."""
        if not self.labels_json:
            return []
        try:
            return json.loads(self.labels_json)
        except (json.JSONDecodeError, TypeError):
            return []

    @labels.setter
    def labels(self, value):
        """Set labels from list."""
        if value is None:
            self.labels_json = '[]'
        else:
            self.labels_json = json.dumps(value)

    def __str__(self):
        return f"{self.item_type}:{self.slug} ({self.id})"


class AuditLog(models.Model):
    """
    Audit log for tracking operations.
    For local use, user field is optional.
    """
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    username = models.CharField(max_length=150, null=True, blank=True, help_text="Git username for local tracking")
    action = models.CharField(max_length=100, db_index=True)
    resource_type = models.CharField(max_length=50)
    resource_id = models.CharField(max_length=100, db_index=True)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.timestamp} - {self.action} on {self.resource_type}:{self.resource_id}"
