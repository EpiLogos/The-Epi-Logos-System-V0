"""
Conversations API (Backend)

Provides durable conversation persistence and retrieval using hybrid architecture:
- conversation_threads: Fast retrieval with embedded message arrays
- conversation_turns: Individual turn documents for analytics

This is the only layer that talks to Mongo for conversation history,
in line with the tri‑laminar architecture.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import logging

from shared.database.conversation_service import ConversationService
from shared.database.conversation_models import ThreadSummary

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


def get_conversation_service() -> ConversationService:
    """Dependency injection for ConversationService"""
    return ConversationService()


class TurnCreate(BaseModel):
    user_id: str
    thread_id: str
    persona: Optional[str] = Field(default="system")
    model: Optional[str] = None
    user_message: str
    assistant_text: str
    timing_ms: Optional[int] = None
    context: Optional[str] = None  # Coordinate context (e.g., "#5-5" for etymology)


@router.post("/turn")
async def create_turn(
    turn: TurnCreate,
    service: ConversationService = Depends(get_conversation_service)
) -> Dict[str, Any]:
    """
    Create conversation turn with dual-write to both collections.

    Writes to:
    - conversation_threads (embedded array)
    - conversation_turns (individual document)
    """
    try:
        result = await service.add_turn(
            thread_id=turn.thread_id,
            user_id=turn.user_id,
            user_message=turn.user_message,
            agent_response=turn.assistant_text,
            persona=(turn.persona or "system").lower(),
            context=turn.context,
            metadata={"execution_time_ms": turn.timing_ms or 0}
        )

        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to persist turn"))

        return {
            "success": True,
            "id": result.get("turn_id"),
            "thread_id": result.get("thread_id"),
            "turn_number": result.get("turn_number")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to persist turn: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to persist turn: {e}")


class ThreadCreate(BaseModel):
    user_id: str


class SessionMetadataUpdate(BaseModel):
    """Metadata to store in Redis session"""
    context: Optional[str] = None
    etymology_session_id: Optional[str] = None
    coordinate_context: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@router.post("/threads")
async def create_thread(payload: ThreadCreate) -> Dict[str, Any]:
    """Create a new thread by returning a new thread_id. No DB write required here."""
    import uuid
    thread_id = f"thread-{uuid.uuid4()}"
    return {"thread_id": thread_id, "created_at": datetime.now(timezone.utc).isoformat()}


@router.post("/sessions/{thread_id}/metadata")
async def set_session_metadata(thread_id: str, payload: SessionMetadataUpdate) -> Dict[str, Any]:
    """
    Set metadata for a Redis session.

    This allows the orchestrator to access context information (like Etymology Session context)
    via RunContext dependencies.
    """
    try:
        from shared.database.redis_client import RedisClient
        redis_client = RedisClient()

        # Get existing session or create new metadata dict
        existing = redis_client.get_session(thread_id) or {}
        metadata_dict = existing.get("metadata", {})

        # Update with new fields
        if payload.context:
            metadata_dict["context"] = payload.context
        if payload.etymology_session_id:
            metadata_dict["etymology_session_id"] = payload.etymology_session_id
        if payload.coordinate_context:
            metadata_dict["coordinate_context"] = payload.coordinate_context
        if payload.metadata:
            metadata_dict.update(payload.metadata)

        # Write back to Redis
        session_data = {
            "session_id": thread_id,
            "metadata": metadata_dict,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        redis_client.create_session(thread_id, session_data, ttl=86400)  # 24 hour TTL

        return {
            "success": True,
            "thread_id": thread_id,
            "metadata": metadata_dict
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set session metadata: {e}")


@router.delete("/threads/{thread_id}")
async def delete_thread(
    thread_id: str,
    service: ConversationService = Depends(get_conversation_service)
) -> Dict[str, Any]:
    """
    Delete thread with CASCADE: messages + session linkage update.

    Cleanup steps:
    1. Delete from both conversation_threads and conversation_turns
    2. Remove thread_id from parent Etymology Session's thread_ids array
    3. Invalidate Redis caches

    Returns deletion status and parent session info.
    """
    try:
        from shared.database.mongodb_client import MongoDBClient

        db = MongoDBClient().get_database()

        # Step 1: Find parent Etymology Session (if exists)
        sessions_coll = db.get_collection("etymology_sessions")
        parent_session = sessions_coll.find_one({"thread_ids": thread_id})

        # Step 2: Delete thread from BOTH collections
        result = await service.delete_thread(thread_id)

        # Step 3: Remove thread_id from parent session's array (if exists)
        session_updated = False
        parent_session_id = None

        if parent_session:
            parent_session_id = parent_session["session_id"]

            # Remove thread_id from session's thread_ids array
            sessions_coll.update_one(
                {"session_id": parent_session_id},
                {
                    "$pull": {"thread_ids": thread_id},
                    "$set": {"last_activity": datetime.now(timezone.utc)}
                }
            )

            # Invalidate Redis cache for parent session
            from shared.database.redis_client import RedisClient
            redis = RedisClient()
            redis.delete(f"ea:session:{parent_session_id}")

            session_updated = True
            logger.info(f"Removed thread {thread_id} from session {parent_session_id}")

        # Step 4: Clear thread's Redis metadata
        from shared.database.redis_client import RedisClient
        redis = RedisClient()
        redis.delete(f"session:{thread_id}")

        logger.info(
            f"✅ Thread {thread_id} deleted: {result.get('turns_deleted', 0)} messages, "
            f"session_updated={session_updated}"
        )

        return {
            "deleted": True,
            "count": result.get("turns_deleted", 0),
            "session_updated": session_updated,
            "parent_session_id": parent_session_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete thread {thread_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete thread: {e}")


@router.get("/threads")
async def list_threads(
    user_id: str,
    limit: int = 50,
    page: int = 1,
    context: Optional[str] = None,
    service: ConversationService = Depends(get_conversation_service)
) -> Dict[str, Any]:
    """
    List threads for a user (fast - no aggregation needed).

    Reads from conversation_threads collection directly.
    """
    try:
        threads = await service.list_threads(
            user_id=user_id,
            limit=limit,
            page=page,
            context=context
        )

        return {
            "success": True,
            "threads": [t.model_dump() for t in threads]
        }
    except Exception as e:
        logger.error(f"Failed to list threads: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list threads: {e}")


@router.get("/threads/{thread_id}/messages")
async def get_thread_messages(
    thread_id: str,
    limit: int = 200,
    service: ConversationService = Depends(get_conversation_service)
) -> Dict[str, Any]:
    """
    Get thread messages in role/content format (fast retrieval).

    Reads from conversation_threads collection.
    """
    try:
        messages = await service.get_thread_messages(thread_id, limit=limit)
        return {
            "success": True,
            "thread_id": thread_id,
            "messages": messages
        }
    except Exception as e:
        logger.error(f"Failed to get messages: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get messages: {e}")


class ThreadTitleUpdate(BaseModel):
    """Update request for thread title/summary"""
    title: str = Field(..., description="Thread title/summary (3-6 words ideal)")


@router.patch("/threads/{thread_id}/title")
async def update_thread_title(
    thread_id: str,
    payload: ThreadTitleUpdate,
    service: ConversationService = Depends(get_conversation_service)
) -> Dict[str, Any]:
    """
    Update thread title/summary.

    Stores title in conversation_threads metadata.
    """
    try:
        result = await service.update_thread_title(thread_id, payload.title)

        if not result.get("success"):
            raise HTTPException(status_code=404, detail=result.get("error", "Thread not found"))

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update thread title: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update thread title: {e}")


@router.post("/threads/{thread_id}/generate-title")
async def generate_thread_title(
    thread_id: str,
    service: ConversationService = Depends(get_conversation_service)
) -> Dict[str, Any]:
    """
    Generate thread title from first user message.

    Creates a concise summary for the thread based on the user's
    initial prompt. Automatically updates the thread title in metadata.
    """
    try:
        # Get thread
        thread = await service.get_thread(thread_id)

        if not thread:
            return {
                "success": False,
                "message": "Thread not found"
            }

        # Get first user message
        first_user_msg = next((m for m in thread.messages if m.role == "user"), None)

        if not first_user_msg:
            return {
                "success": False,
                "message": "No user message found to generate title from"
            }

        user_message = first_user_msg.content

        # Skip if onboarding marker
        if user_message.startswith("__INIT_"):
            return {
                "success": False,
                "message": "Skipped onboarding message"
            }

        # Generate concise title using simple extraction
        # TODO: Call orchestrator agent for AI-generated summary
        words = user_message.split()[:8]  # Take first 8 words
        title = " ".join(words)
        if len(user_message.split()) > 8:
            title += "..."

        # Update thread title
        result = await service.update_thread_title(thread_id, title)

        if not result.get("success"):
            return {
                "success": False,
                "message": result.get("error", "Failed to update title")
            }

        return {
            "success": True,
            "thread_id": thread_id,
            "title": title,
            "message": "Thread title generated successfully"
        }

    except Exception as e:
        logger.error(f"Failed to generate thread title: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate thread title: {e}")
