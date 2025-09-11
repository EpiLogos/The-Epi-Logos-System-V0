"""
Performance monitoring middleware for FastAPI.
Tracks request timing, adds correlation IDs, and structured logging.
"""
import time
import uuid
import logging
from typing import Callable, Dict, Any
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class PerformanceMiddleware(BaseHTTPMiddleware):
    """Middleware for request performance monitoring and correlation tracking."""
    
    def __init__(self, app, min_response_time_log: float = 0.1):
        """
        Initialize performance middleware.
        
        Args:
            app: FastAPI application instance
            min_response_time_log: Minimum response time in seconds to log as warning
        """
        super().__init__(app)
        self.min_response_time_log = min_response_time_log
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with performance monitoring."""
        # Generate correlation ID
        correlation_id = str(uuid.uuid4())
        request.state.correlation_id = correlation_id
        
        # Start timing
        start_time = time.time()
        
        # Extract request info
        method = request.method
        url = str(request.url)
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Log request start
        logger.info(
            f"Request started",
            extra={
                "correlation_id": correlation_id,
                "method": method,
                "url": url,
                "client_ip": client_ip,
                "user_agent": user_agent,
                "event_type": "request_start"
            }
        )
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate timing
            process_time = time.time() - start_time
            
            # Add performance headers
            response.headers["X-Process-Time"] = str(process_time)
            response.headers["X-Correlation-ID"] = correlation_id
            
            # Record metrics
            from urllib.parse import urlparse
            parsed_url = urlparse(url)
            request_metrics.record_request(
                method=method,
                path=parsed_url.path,
                status_code=response.status_code,
                response_time=process_time
            )
            
            # Log response
            log_level = logging.WARNING if process_time > self.min_response_time_log else logging.INFO
            logger.log(
                log_level,
                f"Request completed in {process_time:.4f}s",
                extra={
                    "correlation_id": correlation_id,
                    "method": method,
                    "url": url,
                    "status_code": response.status_code,
                    "process_time": process_time,
                    "client_ip": client_ip,
                    "event_type": "request_complete"
                }
            )
            
            return response
            
        except Exception as exc:
            # Calculate timing for failed requests
            process_time = time.time() - start_time
            
            # Log error
            logger.error(
                f"Request failed after {process_time:.4f}s: {str(exc)}",
                extra={
                    "correlation_id": correlation_id,
                    "method": method,
                    "url": url,
                    "process_time": process_time,
                    "client_ip": client_ip,
                    "error": str(exc),
                    "event_type": "request_error"
                },
                exc_info=True
            )
            
            # Return error response with correlation ID
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "Internal server error",
                    "error_code": "INTERNAL_SERVER_ERROR",
                    "correlation_id": correlation_id
                },
                headers={"X-Correlation-ID": correlation_id}
            )
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request."""
        # Check for forwarded headers first
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fallback to client connection
        if hasattr(request, "client") and request.client:
            return request.client.host
        
        return "unknown"


class RequestMetrics:
    """Request metrics collector for performance analysis."""
    
    def __init__(self):
        """Initialize metrics collector."""
        self.request_count = 0
        self.total_response_time = 0.0
        self.slow_requests = 0
        self.error_count = 0
        self.endpoint_metrics: Dict[str, Dict[str, Any]] = {}
    
    def record_request(
        self, 
        method: str, 
        path: str, 
        status_code: int, 
        response_time: float
    ):
        """Record request metrics."""
        self.request_count += 1
        self.total_response_time += response_time
        
        if response_time > 1.0:  # Slow request threshold
            self.slow_requests += 1
        
        if status_code >= 400:
            self.error_count += 1
        
        # Track per-endpoint metrics
        endpoint_key = f"{method} {path}"
        if endpoint_key not in self.endpoint_metrics:
            self.endpoint_metrics[endpoint_key] = {
                "count": 0,
                "total_time": 0.0,
                "errors": 0,
                "avg_response_time": 0.0
            }
        
        endpoint_metrics = self.endpoint_metrics[endpoint_key]
        endpoint_metrics["count"] += 1
        endpoint_metrics["total_time"] += response_time
        
        if status_code >= 400:
            endpoint_metrics["errors"] += 1
        
        # Update average
        endpoint_metrics["avg_response_time"] = (
            endpoint_metrics["total_time"] / endpoint_metrics["count"]
        )
    
    def get_summary(self) -> Dict[str, Any]:
        """Get performance metrics summary."""
        avg_response_time = (
            self.total_response_time / self.request_count 
            if self.request_count > 0 else 0.0
        )
        
        error_rate = (
            self.error_count / self.request_count * 100 
            if self.request_count > 0 else 0.0
        )
        
        slow_request_rate = (
            self.slow_requests / self.request_count * 100 
            if self.request_count > 0 else 0.0
        )
        
        return {
            "total_requests": self.request_count,
            "average_response_time": round(avg_response_time, 4),
            "error_rate_percent": round(error_rate, 2),
            "slow_request_rate_percent": round(slow_request_rate, 2),
            "total_errors": self.error_count,
            "slow_requests": self.slow_requests,
            "endpoint_metrics": self.endpoint_metrics
        }
    
    def reset(self):
        """Reset all metrics."""
        self.request_count = 0
        self.total_response_time = 0.0
        self.slow_requests = 0
        self.error_count = 0
        self.endpoint_metrics.clear()


# Global metrics instance
request_metrics = RequestMetrics()


def get_performance_metrics() -> Dict[str, Any]:
    """Get current performance metrics."""
    return request_metrics.get_summary()


def reset_performance_metrics():
    """Reset performance metrics."""
    request_metrics.reset()
    logger.info("Performance metrics reset")