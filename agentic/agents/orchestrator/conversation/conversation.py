"""
Conversation history manager using MongoDB (epilogos_db).

Stores per-turn interactions and can reconstruct Pydantic AI-compatible
message_history for agent runs.

Environment:
- `MONGODB_URI`, `MONGODB_DATABASE` defaulting to `epilogos_db`
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from datetime import datetime, timezone

from shared.database.mongodb_client import MongoDBClient


class ConversationManager:
    """Mongo-backed conversation history manager."""

    def __init__(self, mongo_client: Optional[MongoDBClient] = None) -> None:
        self._mongo = mongo_client or MongoDBClient()
        self._db = self._mongo.get_database()
        self._coll = self._db.get_collection("conversations")
        # Indexes for fast lookup and ordering
        try:
            self._coll.create_index([("session_id", 1), ("created_at", 1)], background=True)
            self._coll.create_index([("user_id", 1), ("created_at", 1)], background=True)
        except Exception:
            # Non-fatal during local dev
            pass

    async def add_interaction(
        self,
        *,
        session_id: str,
        user_message: str,
        agent_response: str,
        persona: str = "system",
        user_id: Optional[str] = None,
        context_used: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        pydantic_messages: Optional[Any] = None,
    ) -> Any:
        """Store a single user<->assistant interaction."""
        doc = {
            "session_id": session_id,
            "user_id": user_id,
            "persona": persona,
            "user_message": user_message,
            "agent_response": agent_response,
            "context_used": context_used or {},
            "metadata": metadata or {},
            "created_at": datetime.now(timezone.utc),
        }
        
        # Store the actual Pydantic AI messages if provided
        if pydantic_messages:
            try:
                from pydantic_core import to_jsonable_python
                doc["pydantic_messages"] = to_jsonable_python(pydantic_messages)
            except Exception:
                pass  # Fallback to just storing the basic interaction
                
        return self._coll.insert_one(doc)

    async def get_turns(self, session_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        cursor = self._coll.find({"session_id": session_id}).sort("created_at", 1)
        if limit:
            cursor = cursor.limit(limit)
        return list(cursor)

    async def clear_session(self, session_id: str) -> int:
        res = self._coll.delete_many({"session_id": session_id})
        return int(res.deleted_count)

    async def get_message_history(self, session_id: str, max_turns: int = 10) -> List[Dict[str, str]]:
        """Return a simplified message history list suitable for Pydantic AI.

        The history is returned as a flat list alternating user/assistant messages:
        [{"role":"user","content":"..."}, {"role":"assistant","content":"..."}, ...]
        """
        turns = await self.get_turns(session_id, limit=max_turns)
        history: List[Dict[str, str]] = []
        for t in turns:
            if t.get("user_message"):
                history.append({"role": "user", "content": t["user_message"]})
            if t.get("agent_response"):
                history.append({"role": "assistant", "content": t["agent_response"]})
        return history

    async def get_pydantic_message_history(self, session_id: str, max_turns: int = 10):
        """Return message history in proper Pydantic AI format.
        
        This loads the actual stored Pydantic AI messages from previous agent runs.
        """
        try:
            # Import Pydantic AI messages here to avoid circular imports
            from pydantic_ai.messages import ModelMessagesTypeAdapter
            
            # Get conversation turns from database
            turns = await self.get_turns(session_id, limit=max_turns)
            
            if not turns:
                return []
            
            # Collect all Pydantic AI messages from stored turns
            all_messages = []
            for turn in turns:
                if turn.get("pydantic_messages"):
                    # Deserialize the stored Pydantic AI messages
                    stored_messages = ModelMessagesTypeAdapter.validate_python(turn["pydantic_messages"])
                    all_messages.extend(stored_messages)
            
            return all_messages
            
        except ImportError:
            # Fallback to empty history if Pydantic AI not available
            import logging
            logging.warning("Pydantic AI not available, conversation history disabled")
            return []
        except Exception as e:
            # Log error and return empty history
            import logging
            logging.error(f"Error loading Pydantic AI message history: {e}")
            return []

