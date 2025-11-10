"""
Custom exceptions and exception handler following RFC7807.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


class BasePromptException(Exception):
    """Base exception for prompt manager."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'A server error occurred.'
    default_type = 'about:blank'

    def __init__(self, detail=None, **kwargs):
        self.detail = detail or self.default_detail
        self.extra = kwargs


class ConflictError(BasePromptException):
    """Resource conflict (409)."""
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'Resource conflict detected.'


class BadRequestError(BasePromptException):
    """Bad request error (400)."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Bad request.'


class ValidationError(BasePromptException):
    """Semantic validation error (422)."""
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = 'Validation failed.'


class IndexLockError(BasePromptException):
    """Index is locked (423)."""
    status_code = status.HTTP_423_LOCKED
    default_detail = 'Index is currently locked.'


class ResourceNotFoundError(BasePromptException):
    """Resource not found (404)."""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Resource not found.'


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns RFC7807 compliant responses.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        return response

    # Handle our custom exceptions
    if isinstance(exc, BasePromptException):
        data = {
            'type': exc.extra.get('type', exc.default_type),
            'title': exc.__class__.__name__,
            'status': exc.status_code,
            'detail': exc.detail,
        }
        data.update(exc.extra)
        return Response(data, status=exc.status_code, content_type='application/problem+json')

    return None
