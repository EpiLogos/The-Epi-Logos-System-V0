"""
Data models for Wisdom Packet synthesis.

Defines Pydantic models for WisdomPacket, KeyConcept, ApophaticPointer,
and related types used in canonical knowledge synthesis.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class WisdomPacketFocus(str, Enum):
    """Focus lens for Wisdom Packet synthesis."""
    STRUCTURAL = "STRUCTURAL"  # Logical and architectural patterns
    PROCESSUAL = "PROCESSUAL"  # Dynamic and transformational aspects
    ARCHETYPAL = "ARCHETYPAL"  # Symbolic and mythic dimensions
    PRACTICAL = "PRACTICAL"    # Actionable and implementable aspects


class BimbaNodeBasic(BaseModel):
    """Basic Bimba node information for central node."""
    coordinate: str = Field(..., description="Bimba coordinate")
    name: str = Field(..., description="Node name")
    subsystem: str = Field(..., description="Subsystem number (0-5)")
    description: Optional[str] = Field(None, description="Node description")
    operational_essence: Optional[str] = Field(None, description="Operational essence")


class KeyConcept(BaseModel):
    """A key concept extracted from subgraph traversal."""
    concept: str = Field(..., description="Concept name or theme")
    source_coordinates: List[str] = Field(default_factory=list, description="Source coordinates")
    relevance_score: float = Field(..., ge=0.0, le=1.0, description="Relevance score")
    description: Optional[str] = Field(None, description="Concept description")


class ApophaticPointer(BaseModel):
    """A pointer to missing themes or unexplored connections."""
    missing_theme: str = Field(..., description="Description of missing theme")
    expected_coordinates: List[str] = Field(default_factory=list, description="Expected related coordinates")
    suggestion: str = Field(..., description="Suggestion for exploration")


class WisdomPacket(BaseModel):
    """
    Pre-synthesized, contextually rich summary for a Bimba coordinate.

    Provides canonical knowledge synthesis with intelligent traversal,
    concept extraction, narrative generation, and apophatic analysis.
    """

    # Core fields (AC 3)
    central_node: BimbaNodeBasic = Field(..., description="Central Bimba node")
    key_concepts: List[KeyConcept] = Field(default_factory=list, description="Extracted key concepts")
    narrative_summary: str = Field(..., description="Coherent narrative summary")
    apophatic_pointers: List[ApophaticPointer] = Field(default_factory=list, description="Missing themes/connections")
    contextual_themes: List[str] = Field(default_factory=list, description="Derived contextual themes")

    # Quality and metadata
    synthesis_score: float = Field(..., ge=0.0, le=1.0, description="Synthesis quality score")
    generated_at: datetime = Field(..., description="Generation timestamp")
    cache_hit: bool = Field(default=False, description="Whether result came from cache")

    # Query parameters
    depth: int = Field(default=2, ge=1, le=5, description="Traversal depth")
    focus: Optional[WisdomPacketFocus] = Field(None, description="Synthesis focus lens")

    # Internal fields (for synthesis)
    subgraph_nodes: List[dict] = Field(default_factory=list, description="Traversed subgraph nodes")
    subgraph_relationships: List[dict] = Field(default_factory=list, description="Traversed relationships")

    # LLM exploration output (full agent run for heavy calls)
    llm_full_output: Optional[str] = Field(None, description="Complete agent exploration output (cached for performance)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "central_node": {
                    "coordinate": "#1-2-3",
                    "name": "Quaternal Logic Framework",
                    "subsystem": "1",
                    "description": "The fundamental QL processing framework"
                },
                "key_concepts": [
                    {
                        "concept": "Logical Structure",
                        "source_coordinates": ["#1-2-3-1", "#1-2-3-2"],
                        "relevance_score": 0.92,
                        "description": "Pattern of logical organization"
                    }
                ],
                "narrative_summary": "This coordinate synthesizes the foundational logic...",
                "apophatic_pointers": [
                    {
                        "missing_theme": "Practical applications",
                        "expected_coordinates": ["#4"],
                        "suggestion": "Explore Nara subsystem for practical implementations"
                    }
                ],
                "contextual_themes": ["Logic", "Structure", "Foundation"],
                "synthesis_score": 0.85,
                "generated_at": "2025-10-23T12:00:00Z",
                "cache_hit": False,
                "depth": 2,
                "focus": "STRUCTURAL"
            }
        }
    }
