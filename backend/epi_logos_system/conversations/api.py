"""
Conversations API (Backend)

Provides durable conversation persistence and retrieval. This is the only
layer that talks to Mongo for conversation history, in line with the
tri‑laminar architecture.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from shared.database.mongodb_client import MongoDBClient
from pymongo import DESCENDING

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


class TurnCreate(BaseModel):
    user_id: str
    thread_id: str
    persona: Optional[str] = Field(default="system")
    model: Optional[str] = None
    user_message: str
    assistant_text: str
    timing_ms: Optional[int] = None


@router.post("/turn")
async def create_turn(turn: TurnCreate) -> Dict[str, Any]:
    try:
        db = MongoDBClient().get_database()
        coll = db.get_collection("conversations")
        doc = {
            "session_id": turn.thread_id,
            "user_id": turn.user_id,
            "persona": (turn.persona or "system").lower(),
            "user_message": turn.user_message,
            "agent_response": turn.assistant_text,
            "metadata": {"execution_time_ms": turn.timing_ms or 0},
            "created_at": datetime.now(timezone.utc),
        }
        res = coll.insert_one(doc)
        return {"success": True, "id": str(res.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to persist turn: {e}")


class ThreadCreate(BaseModel):
    user_id: str


@router.post("/threads")
async def create_thread(payload: ThreadCreate) -> Dict[str, Any]:
    """Create a new thread by returning a new thread_id. No DB write required here."""
    import uuid
    thread_id = f"thread-{uuid.uuid4()}"
    return {"thread_id": thread_id, "created_at": datetime.now(timezone.utc).isoformat()}


@router.delete("/threads/{thread_id}")
async def delete_thread(thread_id: str) -> Dict[str, Any]:
    """Delete all turns for a thread."""
    try:
        db = MongoDBClient().get_database()
        coll = db.get_collection("conversations")
        res = coll.delete_many({"session_id": thread_id})
        return {"deleted": True, "count": res.deleted_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete thread: {e}")


@router.get("/threads")
async def list_threads(user_id: str, limit: int = 50, page: int = 1) -> Dict[str, Any]:
    try:
        db = MongoDBClient().get_database()
        coll = db.get_collection("conversations")
        skip = max(0, (page - 1) * max(1, limit))
        pipeline = [
            {"$match": {"user_id": user_id}},
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
        items: List[Dict[str, Any]] = []
        for row in coll.aggregate(pipeline):
            items.append({
                "thread_id": row.get("_id"),
                "title": row.get("first_user") or "Untitled",
                "last_message": row.get("last_message"),
                "created_at": row.get("created_at").isoformat() if row.get("created_at") else None,
                "last_activity": row.get("last_activity").isoformat() if row.get("last_activity") else None,
                "persona": row.get("persona")
            })
        return {"threads": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list threads: {e}")


@router.get("/threads/{thread_id}/messages")
async def get_thread_messages(thread_id: str, limit: int = 200) -> Dict[str, Any]:
    try:
        db = MongoDBClient().get_database()
        coll = db.get_collection("conversations")
        cursor = (
            coll.find({"session_id": thread_id}).sort("created_at", 1)
        )
        messages: List[Dict[str, str]] = []
        count = 0
        async_limit = max(1, limit)
        for t in cursor:
            if t.get("user_message"):
                messages.append({"role": "user", "content": t["user_message"]})
                count += 1
                if count >= async_limit:
                    break
            if t.get("agent_response"):
                messages.append({"role": "assistant", "content": t["agent_response"]})
                count += 1
                if count >= async_limit:
                    break
        return {"thread_id": thread_id, "messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get messages: {e}")
