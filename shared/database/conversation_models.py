"""
Conversation Models for Hybrid Architecture

Defines data models for the dual-collection conversation storage:
- conversation_threads: Fast retrieval with embedded message arrays
- conversation_turns: Individual turn documents for analytics

Migration from old schema:
- session_id → thread_id (field rename)
- conversations → conversation_turns (collection rename)
- NEW: conversation_threads collection
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class MessageTurn(BaseModel):
    """Single message turn in a conversation thread"""
    
    turn_number: int = Field(..., description="Sequential turn number in thread")
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(..., description="Message timestamp")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Turn metadata (execution_time_ms, etc)")
    context_used: Optional[Dict[str, Any]] = Field(default=None, description="Agent context used for this turn")
    pydantic_messages: Optional[List[Any]] = Field(default=None, description="Serialized Pydantic AI messages")


class ConversationThread(BaseModel):
    """Conversation thread with embedded message array (fast retrieval)"""
    
    thread_id: str = Field(..., description="Thread identifier (thread-{uuid})")
    user_id: str = Field(..., description="User identifier")
    persona: str = Field(default="system", description="Agent persona")
    etymology_session_id: Optional[str] = Field(default=None, description="Parent etymology session (if applicable)")
    context: Optional[str] = Field(default=None, description="Coordinate context (e.g., '#5-5')")
    messages: List[MessageTurn] = Field(default_factory=list, description="Embedded message array")
    created_at: datetime = Field(..., description="Thread creation timestamp")
    last_activity: datetime = Field(..., description="Last message timestamp")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Thread metadata (title, etc)")

    class Config:
        json_schema_extra = {
            "example": {
                "thread_id": "thread-abc123",
                "user_id": "user-456",
                "persona": "epii",
                "etymology_session_id": "session-xyz",
                "context": "#5-5",
                "messages": [
                    {
                        "turn_number": 1,
                        "role": "user",
                        "content": "What is etymology?",
                        "timestamp": "2025-01-15T10:00:00Z",
                        "metadata": None,
                        "context_used": None,
                        "pydantic_messages": None
                    },
                    {
                        "turn_number": 2,
                        "role": "assistant",
                        "content": "Etymology is the study of word origins...",
                        "timestamp": "2025-01-15T10:00:02Z",
                        "metadata": {"execution_time_ms": 1500},
                        "context_used": {"tools_used": ["bimba_search"]},
                        "pydantic_messages": []
                    }
                ],
                "created_at": "2025-01-15T10:00:00Z",
                "last_activity": "2025-01-15T10:00:02Z",
                "metadata": {
                    "thread_title": "Etymology exploration",
                    "title_updated_at": "2025-01-15T10:05:00Z"
                }
            }
        }


class ConversationTurn(BaseModel):
    """Individual turn document (analytics and search)"""
    
    thread_id: str = Field(..., description="Thread identifier (renamed from session_id)")
    user_id: str = Field(..., description="User identifier")
    turn_number: int = Field(..., description="Sequential turn number")
    user_message: str = Field(..., description="User message content")
    agent_response: str = Field(..., description="Agent response content")
    persona: str = Field(default="system", description="Agent persona")
    context: Optional[str] = Field(default=None, description="Coordinate context")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Turn metadata")
    context_used: Optional[Dict[str, Any]] = Field(default=None, description="Agent context")
    pydantic_messages: Optional[List[Any]] = Field(default=None, description="Serialized Pydantic AI messages")
    created_at: datetime = Field(..., description="Turn timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "thread_id": "thread-abc123",
                "user_id": "user-456",
                "turn_number": 1,
                "user_message": "What is etymology?",
                "agent_response": "Etymology is the study of word origins...",
                "persona": "epii",
                "context": "#5-5",
                "metadata": {"execution_time_ms": 1500},
                "context_used": {"tools_used": ["bimba_search"]},
                "pydantic_messages": [],
                "created_at": "2025-01-15T10:00:02Z"
            }
        }


class ThreadSummary(BaseModel):
    """Thread summary for list views"""
    
    thread_id: str
    title: Optional[str] = None
    last_message: Optional[str] = None
    created_at: Optional[str] = None
    last_activity: Optional[str] = None
    persona: Optional[str] = None
    message_count: int = 0

