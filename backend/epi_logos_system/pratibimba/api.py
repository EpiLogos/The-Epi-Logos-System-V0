"""
Pratibimba API Endpoints
Session-based cloud sync for Personal Pratibimba (Redis)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

# Import shared Redis client
from shared.database import RedisClient

# Auth dependency - use existing auth module
from backend.epi_logos_system.auth.api import get_current_user
from backend.epi_logos_system.users.models.user import User

router = APIRouter(prefix="/api/pratibimba", tags=["pratibimba"])


# Dependency injection for Redis client
def get_redis_client(request: Request) -> RedisClient:
    """Get Redis client from app state (initialized on startup)"""
    return request.app.state.redis_client


class PratibimbaSyncRequest(BaseModel):
    """Request model for syncing Pratibimba to cloud"""
    userId: str
    data: str  # Encrypted Pratibimba data (base64 encoded)


class PratibimbaUpdateRequest(BaseModel):
    """Request model for updating Pratibimba during session"""
    userId: str
    data: str  # Encrypted partial update


class PratibimbaResponse(BaseModel):
    """Response model for Pratibimba data"""
    data: Optional[str] = None
    status: str
    expiresIn: Optional[int] = None
    message: Optional[str] = None


@router.post("/sync", response_model=PratibimbaResponse)
async def sync_pratibimba(
    request: PratibimbaSyncRequest,
    current_user: User = Depends(get_current_user),
    redis_client: RedisClient = Depends(get_redis_client)
):
    """
    Upload encrypted Pratibimba to Redis for active session
    TTL: 1 hour (session duration)
    """
    # Verify user can only sync their own Pratibimba
    if str(current_user.id) != request.userId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot sync other user's Pratibimba"
        )

    try:
        # Store with 1-hour TTL (session duration)
        session_ttl = 3600  # 1 hour in seconds
        redis_key = f"pratibimba:{request.userId}"

        success = redis_client.setex(redis_key, session_ttl, request.data)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to sync Pratibimba to Redis"
            )

        return PratibimbaResponse(
            status="synced",
            expiresIn=session_ttl,
            message="Pratibimba synced to cloud session"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync Pratibimba: {str(e)}"
        )


@router.patch("/update", response_model=PratibimbaResponse)
async def update_pratibimba(
    request: PratibimbaUpdateRequest,
    current_user: User = Depends(get_current_user),
    redis_client: RedisClient = Depends(get_redis_client)
):
    """
    Update encrypted Pratibimba in Redis during active session
    Used by sync queue processor for incremental updates
    """
    # Verify user can only update their own Pratibimba
    if str(current_user.id) != request.userId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update other user's Pratibimba"
        )

    try:
        redis_key = f"pratibimba:{request.userId}"

        # Check if Pratibimba exists in session
        existing = redis_client.get(redis_key)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pratibimba not in active session. Sync first."
            )

        # Update with same TTL as original
        ttl = redis_client.ttl(redis_key)
        if ttl > 0:
            redis_client.setex(redis_key, ttl, request.data)
        else:
            # Fallback: reset to 1 hour
            redis_client.setex(redis_key, 3600, request.data)

        return PratibimbaResponse(
            status="updated",
            expiresIn=ttl if ttl > 0 else 3600,
            message="Pratibimba updated in cloud session"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update Pratibimba: {str(e)}"
        )


@router.get("/{userId}", response_model=PratibimbaResponse)
async def get_pratibimba(
    userId: str,
    current_user: User = Depends(get_current_user),
    redis_client: RedisClient = Depends(get_redis_client)
):
    """
    Fetch encrypted Pratibimba from Redis during active session
    Used by agentic layer for personalization
    """
    # Allow user to access their own OR service accounts (for agentic access)
    is_service_account = getattr(current_user, 'is_service_account', False)
    if str(current_user.id) != userId and not is_service_account:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access other user's Pratibimba"
        )

    try:
        redis_key = f"pratibimba:{userId}"
        data = redis_client.get(redis_key)

        if not data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pratibimba not in active session"
            )

        # RedisClient returns string with decode_responses=True
        pratibimba_data = data

        ttl = redis_client.ttl(redis_key)

        return PratibimbaResponse(
            data=pratibimba_data,
            status="active",
            expiresIn=ttl if ttl > 0 else None,
            message="Pratibimba retrieved from cloud session"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve Pratibimba: {str(e)}"
        )


@router.delete("/{userId}", response_model=PratibimbaResponse)
async def purge_pratibimba(
    userId: str,
    current_user: User = Depends(get_current_user),
    redis_client: RedisClient = Depends(get_redis_client)
):
    """
    Manually purge Pratibimba from cloud (normally handled by TTL)
    User-initiated privacy control
    """
    # Verify user can only purge their own Pratibimba
    if str(current_user.id) != userId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot purge other user's Pratibimba"
        )

    try:
        redis_key = f"pratibimba:{userId}"
        deleted = redis_client.delete(redis_key)

        if not deleted:
            # Already purged or never existed
            return PratibimbaResponse(
                status="already_purged",
                message="Pratibimba not found in cloud session"
            )

        return PratibimbaResponse(
            status="purged",
            message="Pratibimba removed from cloud session"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to purge Pratibimba: {str(e)}"
        )


@router.get("/{userId}/status", response_model=PratibimbaResponse)
async def get_pratibimba_status(
    userId: str,
    current_user: User = Depends(get_current_user),
    redis_client: RedisClient = Depends(get_redis_client)
):
    """
    Check if Pratibimba is in active cloud session (without fetching data)
    Lightweight status check for frontend sync indicator
    """
    # Verify user can only check their own status
    if str(current_user.id) != userId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot check other user's Pratibimba status"
        )

    try:
        redis_key = f"pratibimba:{userId}"
        exists = redis_client.get(redis_key) is not None
        ttl = redis_client.ttl(redis_key) if exists else None

        return PratibimbaResponse(
            status="active" if exists else "inactive",
            expiresIn=ttl if ttl and ttl > 0 else None,
            message="Pratibimba in cloud session" if exists else "Pratibimba local only"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check Pratibimba status: {str(e)}"
        )
