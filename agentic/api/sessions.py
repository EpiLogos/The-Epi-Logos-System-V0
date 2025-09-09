"""
Session Metadata API

Clean REST endpoints for session information - separate from AG-UI chat protocol.
Provides thread_id to session_id mapping and session metadata.
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..agents.orchestrator.tools.http_clients_factory import create_enhanced_orchestrator_deps

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])


class SessionInfo(BaseModel):
    """Session information response model"""
    thread_id: str
    session_id: str
    created_at: Optional[str] = None
    last_activity: Optional[str] = None
    status: str = "active"
    user_id: Optional[str] = None
    persona: Optional[str] = None


@router.get("/{thread_id}")
async def get_session_info(thread_id: str) -> SessionInfo:
    """
    Get session information for a given thread_id.
    
    Returns both thread_id and session_id, plus session metadata.
    This is the proper way to get session info - not through AG-UI chat protocol.
    """
    try:
        # Create session client to look up session info
        deps = await create_enhanced_orchestrator_deps(
            session_id="lookup-session",
            user_id="api-user",
            current_persona="system"
        )
        
        if not deps.redis_client:
            raise HTTPException(status_code=503, detail="Session service unavailable")
        
        # Get session_id for this thread_id, create if doesn't exist
        session_id = await deps.redis_client.get_session_id_for_thread(thread_id)
        
        if not session_id:
            # Create new session for this thread_id
            session_id = await deps.redis_client.create_session(
                user_id="web-user",
                session_data={"source": "rest-api", "thread_id": thread_id},
                thread_id=thread_id
            )
            logger.info(f"🆕 Created new session {session_id} for thread: {thread_id}")
        
        # Get session details
        session_data = await deps.redis_client.get_session(session_id)
        
        if not session_data:
            # Session mapping exists but session data is missing - return basic info
            logger.warning(f"Thread mapping exists but session data missing for {session_id}")
            return SessionInfo(
                thread_id=thread_id,
                session_id=session_id,
                status="partial"
            )
        
        # Return complete session information
        return SessionInfo(
            thread_id=thread_id,
            session_id=session_id,
            created_at=session_data.get("created_at"),
            last_activity=session_data.get("last_activity"),
            status=session_data.get("status", "active"),
            user_id=session_data.get("user_id"),
            persona=session_data.get("persona")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session info for thread {thread_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/")
async def list_sessions() -> Dict[str, Any]:
    """
    List recent sessions (future enhancement).
    For now, returns basic endpoint info.
    """
    return {
        "endpoint": "/api/v1/sessions/{thread_id}",
        "description": "Get session information for thread_id",
        "status": "active"
    }