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
from backend.epi_logos_system.shared.container import get_container, get_config
from backend.epi_logos_system.shared.middleware import get_performance_metrics, request_metrics
# SessionService removed - using stateless JWT

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


class HealthChecker:
    """System health checker with dependency monitoring."""
    
    def __init__(self):
        """Initialize health checker."""
        self.startup_time = datetime.now(timezone.utc)
    
    async def check_mongodb(self) -> Dict[str, Any]:
        """Check MongoDB connection status."""
        try:
            from shared.database import MongoDBClient
            mongodb = MongoDBClient()

            start_time = time.time()
            # Simple connection test
            result = mongodb.test_connection()
            response_time = time.time() - start_time

            return {
                "status": "healthy" if result else "unhealthy",
                "response_time_ms": round(response_time * 1000, 2),
                "details": "MongoDB connection successful" if result else "MongoDB connection failed"
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
            from shared.database import RedisClient

            start_time = time.time()
            # Test Redis connection with ping
            redis_client = RedisClient()
            test_result = redis_client.ping()
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
            from shared.database import Neo4jClient
            # REPLACED_RELATIVE_IMPORTconfig.environment import get_config

            config = get_config()
            neo4j = Neo4jClient(
                uri=config.neo4j_uri,
                username=config.neo4j_username,
                password=config.neo4j_password,
                database=config.neo4j_database
            )

            start_time = time.time()
            # Use the test_connection method
            result = neo4j.test_connection()
            response_time = time.time() - start_time

            return {
                "status": "healthy" if result else "unhealthy",
                "response_time_ms": round(response_time * 1000, 2),
                "details": "Neo4j connection successful" if result else "Neo4j connection failed"
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

        google_configured = config.google_client_id and config.google_client_secret

        return {
            "status": "healthy" if google_configured else "warning",
            "details": "Google OAuth credentials available" if google_configured else "Google OAuth not configured",
            "services": {
                "google_oauth": "configured" if google_configured else "not_configured"
            }
        }
    
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
async def basic_health_check():
    """Basic health check endpoint for Docker and monitoring."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "epi-logos-backend",
        "layer": "Backend (Deep Engine Room)"
    }


async def _perform_comprehensive_health_check():
    """Internal implementation for comprehensive health check."""
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
        unhealthy_services = []
        for name, check in checks.items():
            if isinstance(check, dict):
                status = check.get("status")
                logger.info(f"Health check {name}: status={status}, check={check}")
                if status in ["unhealthy", "error"]:
                    unhealthy_services.append(name)

        overall_status = "unhealthy" if unhealthy_services else "healthy"
        logger.info(f"Overall health status: {overall_status}, unhealthy services: {unhealthy_services}")

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

@router.get("/detailed")
async def detailed_health_check():
    """Comprehensive health check with dependency status."""
    return await _perform_comprehensive_health_check()

@router.get("/comprehensive")
async def comprehensive_health_check():
    """Comprehensive health check with dependency status."""
    return await _perform_comprehensive_health_check()


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
        from backend.epi_logos_system.shared.middleware import reset_performance_metrics
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