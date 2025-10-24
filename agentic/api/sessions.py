"""
Session Metadata API

Clean REST endpoints for session information - separate from AG-UI chat protocol.
Provides thread_id to session_id mapping and session metadata.
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agentic.agents.orchestrator.tools.http_clients_factory import create_enhanced_orchestrator_deps

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


# -------- Minimal Thread History Endpoints (Conversation-Oriented) --------

class ThreadSummary(BaseModel):
    thread_id: str
    title: Optional[str] = None
    last_message: Optional[str] = None
    created_at: Optional[str] = None
    last_activity: Optional[str] = None
    persona: Optional[str] = None
    model: Optional[str] = None


class ThreadMessagesResponse(BaseModel):
    thread_id: str
    messages: List[Dict[str, str]]  # [{ role, content }]


class CreateThreadRequest(BaseModel):
    user_id: str
    persona: Optional[str] = None
    model: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None  # Etymology context tags, coordinate metadata


class CreateThreadResponse(BaseModel):
    thread_id: str
    created_at: str


@router.get("/threads")
async def list_user_threads(user_id: str, limit: int = 50, page: int = 1, context: Optional[str] = None) -> Dict[str, Any]:
    """List recent threads (conversations) for a user.

    This aggregates Mongo conversation turns by session_id (which aligns with thread_id in AG-UI usage).

    Args:
        context: Optional coordinate filter (e.g., "#5-5" for etymology, "#1" for Paramasiva)
    """
    try:
        deps = await create_enhanced_orchestrator_deps(
            session_id="list-threads",
            user_id=user_id or "web-user",
            current_persona="system"
        )
        if not deps.mongodb_client:
            raise HTTPException(status_code=503, detail="Conversation service unavailable")

        coll = deps.mongodb_client._coll  # conversations collection

        skip = max(0, (page - 1) * max(1, limit))
        # Build match filter with optional context filter
        match_filter = {"user_id": user_id}
        if context:
            match_filter["context"] = context

        pipeline = [
            {"$match": match_filter},
            {"$sort": {"created_at": -1}},
            {"$group": {
                "_id": "$session_id",
                "created_at": {"$last": "$created_at"},
                "last_activity": {"$first": "$created_at"},
                "first_user": {"$last": "$user_message"},
                "last_message": {"$first": {"$ifNull": ["$agent_response", "$user_message"]}},
                "persona": {"$last": "$persona"}
            }},
            {"$sort": {"last_activity": -1}},
            {"$skip": skip},
            {"$limit": max(1, limit)}
        ]

        items: List[ThreadSummary] = []
        for row in coll.aggregate(pipeline):
            items.append(ThreadSummary(
                thread_id=row.get("_id"),
                title=(row.get("first_user") or "Untitled"),
                last_message=row.get("last_message"),
                created_at=(row.get("created_at").isoformat() if row.get("created_at") else None),
                last_activity=(row.get("last_activity").isoformat() if row.get("last_activity") else None),
                persona=row.get("persona")
            ))

        return {"threads": [i.model_dump() for i in items]}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing threads for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/threads/{thread_id}/messages")
async def get_thread_messages(thread_id: str, limit: int = 200) -> ThreadMessagesResponse:
    """Return simplified message history for a thread (role/content)."""
    try:
        deps = await create_enhanced_orchestrator_deps(
            session_id="get-thread-messages",
            user_id="web-user",
            current_persona="system"
        )
        if not deps.mongodb_client:
            raise HTTPException(status_code=503, detail="Conversation service unavailable")

        history = await deps.mongodb_client.get_message_history(thread_id, max_turns=limit)
        return ThreadMessagesResponse(thread_id=thread_id, messages=history)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting messages for thread {thread_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/threads")
async def create_thread(req: CreateThreadRequest) -> CreateThreadResponse:
    """Create a new thread (conversation) and return its id."""
    try:
        deps = await create_enhanced_orchestrator_deps(
            session_id="create-thread",
            user_id=req.user_id or "web-user",
            current_persona=req.persona or "system"
        )
        if not deps.redis_client:
            raise HTTPException(status_code=503, detail="Session service unavailable")

        import uuid
        thread_id = f"thread-{uuid.uuid4()}"
        now = datetime.utcnow().isoformat()
        # Create session payload with mapping so metadata exists for the thread
        session_data = {
            "source": "rest-api",
            "thread_id": thread_id,
            "persona": req.persona or "system",
            "model": req.model or ""
        }
        # Add metadata if provided (e.g., {"context": "#5-5", "type": "etymology"})
        if req.metadata:
            session_data["metadata"] = req.metadata

        await deps.redis_client.create_session(
            user_id=req.user_id or "web-user",
            session_data=session_data,
            thread_id=thread_id
        )
        return CreateThreadResponse(thread_id=thread_id, created_at=now)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating thread: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/threads/{thread_id}")
async def delete_thread(thread_id: str) -> Dict[str, bool]:
    """Delete a thread's conversation history. Mapping cleanup is best‑effort (no-op if unavailable)."""
    try:
        deps = await create_enhanced_orchestrator_deps(
            session_id="delete-thread",
            user_id="web-user",
            current_persona="system"
        )
        # Clear conversation turns in Mongo
        if deps.mongodb_client:
            try:
                await deps.mongodb_client.clear_session(thread_id)
            except Exception as e:
                logger.warning(f"Conversation clear failed for {thread_id}: {e}")
        # Best-effort: leave redis mapping intact; consider TTL expiry
        return {"deleted": True}
    except Exception as e:
        logger.error(f"Error deleting thread {thread_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
