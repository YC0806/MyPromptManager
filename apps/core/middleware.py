"""
Custom middleware for authentication and audit logging.
"""
from apps.core.models import AuditLog


class AuditLogMiddleware:
    """
    Middleware to log API operations.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Log operations that modify data
        if request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
            # Extract resource info from path
            path_parts = request.path.strip('/').split('/')

            # Determine action
            action_map = {
                'POST': 'create',
                'PUT': 'update',
                'DELETE': 'delete',
                'PATCH': 'patch',
            }

            # Create audit log
            try:
                AuditLog.objects.create(
                    user=request.user if request.user.is_authenticated else None,
                    action=f"{action_map.get(request.method, 'unknown')}_{path_parts[-1] if path_parts else 'unknown'}",
                    resource_type=path_parts[1] if len(path_parts) > 1 else 'unknown',
                    resource_id=path_parts[2] if len(path_parts) > 2 else '',
                    details={
                        'method': request.method,
                        'path': request.path,
                        'status_code': response.status_code,
                    },
                    ip_address=self._get_client_ip(request),
                )
            except Exception:
                # Don't fail request if audit logging fails
                pass

        return response

    @staticmethod
    def _get_client_ip(request):
        """Extract client IP from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
