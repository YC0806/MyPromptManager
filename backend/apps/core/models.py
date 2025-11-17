"""
Django models for audit logging.
Note: No database models for prompts - they're stored in Git.
Note: No custom User model - using local setup without authentication.
"""
from django.db import models


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
