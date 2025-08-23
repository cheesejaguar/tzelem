"""
Rate limiting module for Tzelem Backend API.

This module provides configurable rate limiting using SlowAPI,
which is based on Flask-Limiter.
"""

import logging
from typing import Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from core.config import settings

logger = logging.getLogger(__name__)


def get_client_identifier(request: Request) -> str:
    """
    Get the client identifier for rate limiting.
    
    By default, uses IP address. Can be extended to use user ID
    or API key for authenticated endpoints.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Client identifier string
    """
    # For now, use IP address
    # In the future, this could check for authenticated user
    # and use user ID instead
    return get_remote_address(request)


def create_rate_limit_exceeded_handler() -> Callable:
    """
    Create a custom handler for rate limit exceeded errors.
    
    Returns:
        Handler function for rate limit exceeded errors
    """
    
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> Response:
        """Handle rate limit exceeded errors with proper response."""
        response_data = {
            "error": "Rate limit exceeded",
            "message": str(exc.detail),
            "retry_after": exc.retry_after if hasattr(exc, "retry_after") else 60,
        }
        
        # Log the rate limit violation
        client_id = get_client_identifier(request)
        logger.warning(
            f"Rate limit exceeded for {client_id} on {request.url.path}"
        )
        
        return JSONResponse(
            status_code=429,
            content=response_data,
            headers={
                "Retry-After": str(response_data["retry_after"]),
                "X-RateLimit-Limit": str(exc.limit) if hasattr(exc, "limit") else "100",
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(exc.reset) if hasattr(exc, "reset") else "",
            },
        )
    
    return rate_limit_handler


# Create the rate limiter instance
limiter = Limiter(
    key_func=get_client_identifier,
    default_limits=[f"{settings.rate_limit_requests}/{settings.rate_limit_window} seconds"]
    if settings.rate_limit_enabled
    else [],
    enabled=settings.rate_limit_enabled,
    swallow_errors=False,  # Don't silently ignore rate limit errors
    headers_enabled=True,  # Include rate limit headers in responses
)


# Pre-configured rate limit decorators for different endpoint types
def get_default_limit() -> str:
    """Get the default rate limit string."""
    return f"{settings.rate_limit_requests} per {settings.rate_limit_window} seconds"


def get_voice_limit() -> str:
    """Get the rate limit for voice endpoints."""
    return f"{settings.rate_limit_voice_create} per minute"


def get_mail_limit() -> str:
    """Get the rate limit for mail endpoints."""
    return f"{settings.rate_limit_mail_send} per minute"


def get_flow_limit() -> str:
    """Get the rate limit for flow execution endpoints."""
    return f"{settings.rate_limit_flow_execute} per minute"


def get_runs_limit() -> str:
    """Get the rate limit for run operation endpoints."""
    return f"{settings.rate_limit_runs} per minute"


# Export the limiter and handler
__all__ = [
    "limiter",
    "RateLimitExceeded",
    "create_rate_limit_exceeded_handler",
    "get_default_limit",
    "get_voice_limit",
    "get_mail_limit",
    "get_flow_limit",
    "get_runs_limit",
]