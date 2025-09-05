"""
Health check endpoints for system monitoring.
Provides dependency status and system health information.
"""
import asyncio
import logging
import time
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from ..core.container import get_container, get_config
from ..middleware.performance import get_performance_metrics, request_metrics
# SessionService removed - using stateless JWT

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


class HealthChecker:
    """System health checker with dependency monitoring."""
    
    def __init__(self):
        """Initialize health checker."""
        self.startup_time = datetime.now(timezone.utc)
    
    async def check_mongodb(self) -> Dict[str, Any]:
        """Check MongoDB connection status."""
        try:
            from ..database.mongodb import get_mongodb_client
            mongodb = await get_mongodb_client()
            
            start_time = time.time()
            # Simple connection test
            result = await mongodb.ping()
            response_time = time.time() - start_time
            
            return {
                "status": "healthy" if result else "unhealthy",
                "response_time_ms": round(response_time * 1000, 2),
                "details": "MongoDB connection successful" if result else "MongoDB ping failed"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "response_time_ms": None,
                "details": f"MongoDB connection failed: {str(e)}"
            }
    
    async def check_redis(self) -> Dict[str, Any]:
        """Check Redis connection status."""
        try:
            container = get_container()
            # Session service removed - stateless JWT only
            
            start_time = time.time()
            # Test Redis connection via session service
            test_result = False  # Redis session removed
            response_time = time.time() - start_time
            
            return {
                "status": "healthy" if test_result else "unhealthy",
                "response_time_ms": round(response_time * 1000, 2),
                "details": "Redis connection successful" if test_result else "Redis ping failed"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "response_time_ms": None,
                "details": f"Redis connection failed: {str(e)}"
            }
    
    async def check_neo4j(self) -> Dict[str, Any]:
        """Check Neo4j connection status."""
        try:
            from ..database.neo4j_client import get_neo4j_client
            neo4j = get_neo4j_client()
            
            start_time = time.time()
            # Simple query to test connection
            result = await neo4j.execute_query("RETURN 1 as test")
            response_time = time.time() - start_time
            
            return {
                "status": "healthy",
                "response_time_ms": round(response_time * 1000, 2),
                "details": "Neo4j connection successful"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "response_time_ms": None,
                "details": f"Neo4j connection failed: {str(e)}"
            }
    
    async def check_external_services(self) -> Dict[str, Any]:
        """Check external service dependencies."""
        config = get_config()
        
        checks = {
            "google_oauth": {
                "status": "configured" if config.google_client_id and config.google_client_secret else "not_configured",
                "details": "Google OAuth credentials available" if config.google_client_id else "Google OAuth not configured"
            }
        }
        
        return checks
    
    async def get_system_info(self) -> Dict[str, Any]:
        """Get system information."""
        uptime = datetime.now(timezone.utc) - self.startup_time
        uptime_seconds = uptime.total_seconds()
        
        return {
            "startup_time": self.startup_time.isoformat(),
            "uptime_seconds": round(uptime_seconds, 2),
            "uptime_human": self._format_uptime(uptime_seconds),
            "environment": get_config().environment,
            "version": "0.1.0"  # Could be loaded from package.json or version file
        }
    
    def _format_uptime(self, seconds: float) -> str:
        """Format uptime in human readable format."""
        if seconds < 60:
            return f"{seconds:.1f} seconds"
        elif seconds < 3600:
            return f"{seconds/60:.1f} minutes"
        elif seconds < 86400:
            return f"{seconds/3600:.1f} hours"
        else:
            return f"{seconds/86400:.1f} days"


# Global health checker instance
health_checker = HealthChecker()


@router.get("/")
async def health_check():
    """Simple health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "epi-logos-backend"
    }


@router.get("/detailed")
async def detailed_health_check():
    """Comprehensive health check with dependency status."""
    try:
        # Run all health checks concurrently
        mongodb_check, redis_check, neo4j_check, external_checks, system_info = await asyncio.gather(
            health_checker.check_mongodb(),
            health_checker.check_redis(),
            health_checker.check_neo4j(),
            health_checker.check_external_services(),
            health_checker.get_system_info(),
            return_exceptions=True
        )
        
        # Handle any exceptions
        checks = {
            "mongodb": mongodb_check if not isinstance(mongodb_check, Exception) else {
                "status": "error", "details": str(mongodb_check)
            },
            "redis": redis_check if not isinstance(redis_check, Exception) else {
                "status": "error", "details": str(redis_check)
            },
            "neo4j": neo4j_check if not isinstance(neo4j_check, Exception) else {
                "status": "error", "details": str(neo4j_check)
            },
            "external_services": external_checks if not isinstance(external_checks, Exception) else {
                "status": "error", "details": str(external_checks)
            }
        }
        
        # Determine overall health
        unhealthy_services = [
            name for name, check in checks.items() 
            if isinstance(check, dict) and check.get("status") in ["unhealthy", "error"]
        ]
        
        overall_status = "unhealthy" if unhealthy_services else "healthy"
        
        response_data = {
            "status": overall_status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "system_info": system_info if not isinstance(system_info, Exception) else {"error": str(system_info)},
            "dependencies": checks,
            "unhealthy_services": unhealthy_services
        }
        
        status_code = 503 if overall_status == "unhealthy" else 200
        return JSONResponse(content=response_data, status_code=status_code)
        
    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        return JSONResponse(
            content={
                "status": "error",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "error": "Health check system failure",
                "details": str(e)
            },
            status_code=500
        )


@router.get("/metrics")
async def performance_metrics():
    """Get performance metrics."""
    try:
        metrics = get_performance_metrics()
        system_info = await health_checker.get_system_info()
        
        return {
            "status": "success",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "system_info": system_info,
            "performance_metrics": metrics
        }
        
    except Exception as e:
        logger.error(f"Failed to get metrics: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve performance metrics"
        )


@router.post("/metrics/reset")
async def reset_metrics():
    """Reset performance metrics (useful for testing)."""
    try:
        from ..middleware.performance import reset_performance_metrics
        reset_performance_metrics()
        
        return {
            "status": "success",
            "message": "Performance metrics reset successfully",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to reset metrics: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to reset performance metrics"
        )


@router.get("/readiness")
async def readiness_check():
    """Readiness probe for container orchestration."""
    try:
        # Check critical dependencies quickly
        mongodb_healthy = (await health_checker.check_mongodb())["status"] == "healthy"
        
        if mongodb_healthy:
            return {
                "status": "ready",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        else:
            return JSONResponse(
                content={
                    "status": "not_ready",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "reason": "Critical dependencies unavailable"
                },
                status_code=503
            )
            
    except Exception as e:
        logger.error(f"Readiness check failed: {e}", exc_info=True)
        return JSONResponse(
            content={
                "status": "not_ready",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "error": str(e)
            },
            status_code=503
        )


@router.get("/liveness")
async def liveness_check():
    """Liveness probe for container orchestration."""
    return {
        "status": "alive",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime": (await health_checker.get_system_info())["uptime_human"]
    }