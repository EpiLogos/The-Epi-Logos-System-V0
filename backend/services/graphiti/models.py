"""
Pydantic models for Graphiti MCP episodic memory service.

These models define the data structures for episodes, communities, and API requests/responses
with proper typing, validation, and serialization support for both MCP protocol and GraphQL.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class EpisodeType(str, Enum):
    """Types of episodes that can be tracked."""
    USER_SESSION = "user_session"
    AGENT_RUMINATION = "agent_rumination"
    CONTEXT_FRAME = "context_frame"
    LEARNING_EVENT = "learning_event"
    COMMUNITY_FORMATION = "community_formation"


class Episode(BaseModel):
    """Core episodic memory data structure."""
    id: str = Field(..., description="Unique episode identifier")
    group_id: str = Field(..., description="Multi-tenant group identifier")
    episode_type: EpisodeType = Field(..., description="Type of episode")
    content: str = Field(..., description="Episode content/description")
    context: Dict[str, Any] = Field(default_factory=dict, description="Additional context data")
    
    # Bi-temporal tracking
    occurred_at: datetime = Field(..., description="When the event actually occurred")
    ingested_at: datetime = Field(default_factory=datetime.utcnow, description="When the system recorded the event")
    
    # User and session tracking
    user_id: Optional[str] = Field(None, description="Associated user identifier")
    session_id: Optional[str] = Field(None, description="Session identifier for continuity")
    agent_id: Optional[str] = Field(None, description="Agent identifier for ruminations")
    
    # Graph relationships
    related_episodes: List[str] = Field(default_factory=list, description="Related episode IDs")
    community_id: Optional[str] = Field(None, description="Temporal community identifier")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class Community(BaseModel):
    """Temporal community structure for related episodes."""
    id: str = Field(..., description="Unique community identifier")
    group_id: str = Field(..., description="Multi-tenant group identifier")
    name: str = Field(..., description="Community name/description")
    episode_ids: List[str] = Field(default_factory=list, description="Episodes in this community")
    
    # QL-aligned community properties
    quaternary_position: Optional[int] = Field(None, description="QL position (#0-#5)")
    context_frame_type: Optional[str] = Field(None, description="Associated context frame")
    
    # Temporal properties
    formed_at: datetime = Field(default_factory=datetime.utcnow, description="Community formation time")
    last_activity: datetime = Field(default_factory=datetime.utcnow, description="Last episode activity")
    
    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional community metadata")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class EpisodeRequest(BaseModel):
    """Request model for creating episodes."""
    group_id: str = Field(..., description="Multi-tenant group identifier")
    episode_type: EpisodeType = Field(..., description="Type of episode")
    content: str = Field(..., description="Episode content/description")
    context: Dict[str, Any] = Field(default_factory=dict, description="Additional context data")
    
    # Optional tracking fields
    user_id: Optional[str] = Field(None, description="Associated user identifier")
    session_id: Optional[str] = Field(None, description="Session identifier for continuity")
    agent_id: Optional[str] = Field(None, description="Agent identifier for ruminations")
    occurred_at: Optional[datetime] = Field(None, description="When the event actually occurred (defaults to now)")


class EpisodeResponse(BaseModel):
    """Response model for episode operations."""
    success: bool = Field(..., description="Operation success status")
    episode: Optional[Episode] = Field(None, description="Created/updated episode")
    message: Optional[str] = Field(None, description="Operation message")


class CommunityRequest(BaseModel):
    """Request model for community operations."""
    group_id: str = Field(..., description="Multi-tenant group identifier")
    name: str = Field(..., description="Community name/description")
    episode_ids: List[str] = Field(default_factory=list, description="Initial episodes")
    quaternary_position: Optional[int] = Field(None, description="QL position (#0-#5)")
    context_frame_type: Optional[str] = Field(None, description="Associated context frame")


class CommunityResponse(BaseModel):
    """Response model for community operations."""
    success: bool = Field(..., description="Operation success status")
    community: Optional[Community] = Field(None, description="Created/updated community")
    message: Optional[str] = Field(None, description="Operation message")


class SearchRequest(BaseModel):
    """Request model for searching episodes and communities."""
    group_id: str = Field(..., description="Multi-tenant group identifier")
    query: Optional[str] = Field(None, description="Text search query")
    episode_types: Optional[List[EpisodeType]] = Field(None, description="Filter by episode types")
    user_id: Optional[str] = Field(None, description="Filter by user")
    session_id: Optional[str] = Field(None, description="Filter by session")
    agent_id: Optional[str] = Field(None, description="Filter by agent")
    start_date: Optional[datetime] = Field(None, description="Filter episodes after this date")
    end_date: Optional[datetime] = Field(None, description="Filter episodes before this date")
    limit: int = Field(10, description="Maximum results to return", ge=1, le=100)


class SearchResponse(BaseModel):
    """Response model for search operations."""
    success: bool = Field(..., description="Search success status")
    episodes: List[Episode] = Field(default_factory=list, description="Found episodes")
    communities: List[Community] = Field(default_factory=list, description="Found communities")
    total_count: int = Field(0, description="Total matching results")
    message: Optional[str] = Field(None, description="Search message")