"""
Pydantic models for Graphiti MCP episodic memory service.

These models define the data structures for episodes, communities, and API requests/responses
with proper typing, validation, and serialization support for both MCP protocol and GraphQL.

Enhanced with QuaternalUnit support for QL alignment.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class EpisodeType(str, Enum):
    """Types of episodes that can be tracked."""
    USER_SESSION = "user_session"
    AGENT_RUMINATION = "agent_rumination"
    CONTEXT_FRAME = "context_frame"
    LEARNING_EVENT = "learning_event"
    COMMUNITY_FORMATION = "community_formation"


class QuaternalType(str, Enum):
    """Types of Quaternal Logic structures supported."""
    TWO_PART = "TWO_PART"
    THREE_PART = "THREE_PART"
    FOUR_PART = "FOUR_PART"
    FIVE_PART = "FIVE_PART"
    SIX_PART = "SIX_PART"
    SEVEN_PART = "SEVEN_PART"
    EIGHT_PART = "EIGHT_PART"
    NINE_PART = "NINE_PART"
    TEN_PART = "TEN_PART"
    TWELVE_PART = "TWELVE_PART"


class QuaternalStatus(str, Enum):
    """Lifecycle states for QuaternalUnits."""
    POTENTIAL = "POTENTIAL"
    REFINING = "REFINING"
    VALIDATED = "VALIDATED"


class SourceType(str, Enum):
    """Types of source references for QuaternalUnits."""
    LIGHTRAG_DOC = "lightrag_doc"
    NOTION_PAGE = "notion_page"
    NEO4J_NODE = "neo4j_node"
    MONGO_DOC = "mongo_doc"
    EPISODE = "episode"
    COMMUNITY = "community"


class SourceReference(BaseModel):
    """Reference to source content that contributed to a QuaternalUnit."""
    uuid: str = Field(..., description="Unique identifier of the source")
    source_type: SourceType = Field(..., description="Type of source system")
    summary: Optional[str] = Field(None, description="Brief summary of the source contribution")
    confidence: float = Field(1.0, description="Confidence in this source reference", ge=0.0, le=1.0)


class CrossCoordinateLink(BaseModel):
    """Link between QuaternalUnits across different Bimba coordinates."""
    target_qu_id: str = Field(..., description="UUID of the target QuaternalUnit")
    target_bimba_coordinate: str = Field(..., description="Bimba coordinate of the target")
    relationship_summary: str = Field(..., description="Description of the relationship")
    strength: float = Field(0.5, description="Relationship strength", ge=0.0, le=1.0)
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Link creation time")


class QuaternalEntity(BaseModel):
    """Entity within a QuaternalUnit structure."""
    name: str = Field(..., description="Entity name")
    ql_position: int = Field(..., description="Position within QL structure (0-based)")
    summary: Optional[str] = Field(None, description="Entity description")
    entity_id: Optional[str] = Field(None, description="Reference to Neo4j Entity node")
    confidence: float = Field(1.0, description="Confidence in this position assignment", ge=0.0, le=1.0)


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
    
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )


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
    
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )


class QuaternalUnit(BaseModel):
    """
    QuaternalUnit: A specialized Community representing a complete QL structure.
    
    This is the core data structure for QL-aligned episodic memory, representing
    a holistic epistemic unit that synthesizes information according to 
    Quaternal Logic principles.
    """
    id: str = Field(..., description="Unique QuaternalUnit identifier")
    group_id: str = Field(..., description="Multi-tenant group identifier")
    
    # QL Structure Definition
    quaternal_type: QuaternalType = Field(default=QuaternalType.FOUR_PART, description="QL structure type")
    status: QuaternalStatus = Field(default=QuaternalStatus.POTENTIAL, description="Lifecycle status")
    
    # Grounding and Context
    bimba_coordinate: str = Field(..., description="Primary Bimba coordinate grounding")
    summary: str = Field(..., description="Human-readable summary of the epistemic whole")
    
    # Source Evidence
    source_references: List[SourceReference] = Field(
        default_factory=list, 
        description="Evidence sources that contributed to this unit"
    )
    
    # QL Structure Components
    entities: List[QuaternalEntity] = Field(
        default_factory=list,
        description="Entities representing each QL position"
    )
    
    # Inter-coordinate Relationships
    cross_coordinate_links: List[CrossCoordinateLink] = Field(
        default_factory=list,
        description="Links to other QuaternalUnits across coordinates"
    )
    
    # Temporal Properties
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation time")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update time")
    validated_at: Optional[datetime] = Field(None, description="Validation timestamp")
    
    # Quality Metrics
    confidence_score: float = Field(0.5, description="Overall confidence in this unit", ge=0.0, le=1.0)
    completeness_score: float = Field(0.0, description="How complete the QL structure is", ge=0.0, le=1.0)
    coherence_score: float = Field(0.0, description="Internal coherence of the structure", ge=0.0, le=1.0)
    
    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    
    def get_expected_position_count(self) -> int:
        """Get the expected number of positions for this QuaternalUnit type."""
        type_counts = {
            QuaternalType.TWO_PART: 2,
            QuaternalType.THREE_PART: 3,
            QuaternalType.FOUR_PART: 4,
            QuaternalType.FIVE_PART: 5,
            QuaternalType.SIX_PART: 6,
            QuaternalType.SEVEN_PART: 7,
            QuaternalType.EIGHT_PART: 8,
            QuaternalType.NINE_PART: 9,
            QuaternalType.TEN_PART: 10,
            QuaternalType.TWELVE_PART: 12
        }
        return type_counts.get(self.quaternal_type, 4)
    
    def calculate_completeness_score(self) -> float:
        """Calculate how complete this QuaternalUnit structure is."""
        expected_positions = self.get_expected_position_count()
        if expected_positions == 0:
            return 1.0
        
        # Check if we have entities for all expected positions
        covered_positions = set(entity.ql_position for entity in self.entities)
        expected_positions_set = set(range(expected_positions))
        
        coverage = len(covered_positions.intersection(expected_positions_set)) / expected_positions
        return min(coverage, 1.0)
    
    def update_scores(self):
        """Update calculated scores based on current structure."""
        self.completeness_score = self.calculate_completeness_score()
        self.updated_at = datetime.utcnow()
    
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )


# Request/Response Models

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


class QuaternalUnitRequest(BaseModel):
    """Request model for creating QuaternalUnits."""
    group_id: str = Field(..., description="Multi-tenant group identifier")
    quaternal_type: QuaternalType = Field(default=QuaternalType.FOUR_PART, description="QL structure type")
    bimba_coordinate: str = Field(..., description="Primary Bimba coordinate grounding")
    summary: str = Field(..., description="Human-readable summary")
    
    # Optional initialization
    source_references: List[SourceReference] = Field(default_factory=list, description="Initial evidence")
    initial_entities: List[QuaternalEntity] = Field(default_factory=list, description="Initial entity mappings")


class QuaternalUnitUpdateRequest(BaseModel):
    """Request model for updating QuaternalUnits."""
    qu_id: str = Field(..., description="UUID of the QuaternalUnit to update")
    status: Optional[QuaternalStatus] = Field(None, description="New status")
    summary: Optional[str] = Field(None, description="Updated summary")
    
    # Entities to add/update
    entities_to_add: List[QuaternalEntity] = Field(default_factory=list, description="Entities to add")
    entities_to_remove: List[int] = Field(default_factory=list, description="QL positions to remove")
    
    # Cross-coordinate links
    cross_coordinate_links_to_add: List[CrossCoordinateLink] = Field(
        default_factory=list, 
        description="New cross-coordinate links"
    )
    
    # Source references
    source_references_to_add: List[SourceReference] = Field(
        default_factory=list,
        description="Additional source references"
    )


class QuaternalUnitResponse(BaseModel):
    """Response model for QuaternalUnit operations."""
    success: bool = Field(..., description="Operation success status")
    quaternal_unit: Optional[QuaternalUnit] = Field(None, description="Created/updated QuaternalUnit")
    message: Optional[str] = Field(None, description="Operation message")


class QuaternalUnitSearchRequest(BaseModel):
    """Request model for searching QuaternalUnits."""
    group_id: str = Field(..., description="Multi-tenant group identifier")
    query: Optional[str] = Field(None, description="Text search query")
    quaternal_types: Optional[List[QuaternalType]] = Field(None, description="Filter by QU types")
    status: Optional[List[QuaternalStatus]] = Field(None, description="Filter by status")
    bimba_coordinates: Optional[List[str]] = Field(None, description="Filter by coordinates")
    min_confidence: float = Field(0.0, description="Minimum confidence score", ge=0.0, le=1.0)
    min_completeness: float = Field(0.0, description="Minimum completeness score", ge=0.0, le=1.0)
    limit: int = Field(10, description="Maximum results to return", ge=1, le=100)


class QuaternalUnitSearchResponse(BaseModel):
    """Response model for QuaternalUnit search operations."""
    success: bool = Field(..., description="Search success status")
    quaternal_units: List[QuaternalUnit] = Field(default_factory=list, description="Found QuaternalUnits")
    total_count: int = Field(0, description="Total matching results")
    message: Optional[str] = Field(None, description="Search message")


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


# Enhanced search response that includes QuaternalUnits
class UnifiedSearchResponse(BaseModel):
    """Unified search response including episodes, communities, and QuaternalUnits."""
    success: bool = Field(..., description="Search success status")
    episodes: List[Episode] = Field(default_factory=list, description="Found episodes")
    communities: List[Community] = Field(default_factory=list, description="Found communities")
    quaternal_units: List[QuaternalUnit] = Field(default_factory=list, description="Found QuaternalUnits")
    total_count: int = Field(0, description="Total matching results")
    message: Optional[str] = Field(None, description="Search message")