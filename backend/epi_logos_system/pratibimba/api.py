"""
Pratibimba API Endpoints
Session-based cloud sync for Personal Pratibimba (Redis)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import json
from datetime import datetime

# Redis client (to be imported from shared infrastructure)
try:
    from redis import Redis
    redis_client = Redis.from_url(os.getenv("REDIS_CLOUD_URL", "redis://localhost:6379"))
except Exception as e:
    print(f"Warning: Redis not available: {e}")
    redis_client = None

# Auth dependency - use existing auth module
from backend.epi_logos_system.auth.api import get_current_user
from backend.epi_logos_system.users.models.user import User

router = APIRouter(prefix="/api/pratibimba", tags=["pratibimba"])


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
    current_user: User = Depends(get_current_user)
):
    """
    Upload encrypted Pratibimba to Redis for active session
    TTL: 1 hour (session duration)
    """
    if not redis_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Redis service not available"
        )

    # Verify user can only sync their own Pratibimba
    if current_user.id != request.userId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot sync other user's Pratibimba"
        )

    try:
        # Store with 1-hour TTL (session duration)
        session_ttl = 3600  # 1 hour in seconds
        redis_key = f"pratibimba:{request.userId}"

        redis_client.setex(
            redis_key,
            session_ttl,
            request.data
        )

        return PratibimbaResponse(
            status="synced",
            expiresIn=session_ttl,
            message="Pratibimba synced to cloud session"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync Pratibimba: {str(e)}"
        )


@router.patch("/update", response_model=PratibimbaResponse)
async def update_pratibimba(
    request: PratibimbaUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Update encrypted Pratibimba in Redis during active session
    Used by sync queue processor for incremental updates
    """
    if not redis_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Redis service not available"
        )

    # Verify user can only update their own Pratibimba
    if current_user.id != request.userId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update other user's Pratibimba"
        )

    try:
        redis_key = f"pratibimba:{request.userId}"

        # Check if Pratibimba exists in session
        if not redis_client.exists(redis_key):
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
    current_user: User = Depends(get_current_user)
):
    """
    Fetch encrypted Pratibimba from Redis during active session
    Used by agentic layer for personalization
    """
    if not redis_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Redis service not available"
        )

    # Allow user to access their own OR service accounts (for agentic access)
    is_service_account = getattr(current_user, 'is_service_account', False)
    if current_user.id != userId and not is_service_account:
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

        # Decode bytes to string
        pratibimba_data = data.decode('utf-8') if isinstance(data, bytes) else data

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
    current_user: User = Depends(get_current_user)
):
    """
    Manually purge Pratibimba from cloud (normally handled by TTL)
    User-initiated privacy control
    """
    if not redis_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Redis service not available"
        )

    # Verify user can only purge their own Pratibimba
    if current_user.id != userId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot purge other user's Pratibimba"
        )

    try:
        redis_key = f"pratibimba:{userId}"
        deleted = redis_client.delete(redis_key)

        if deleted == 0:
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
    current_user: User = Depends(get_current_user)
):
    """
    Check if Pratibimba is in active cloud session (without fetching data)
    Lightweight status check for frontend sync indicator
    """
    if not redis_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Redis service not available"
        )

    # Verify user can only check their own status
    if current_user.id != userId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot check other user's Pratibimba status"
        )

    try:
        redis_key = f"pratibimba:{userId}"
        exists = redis_client.exists(redis_key)
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
