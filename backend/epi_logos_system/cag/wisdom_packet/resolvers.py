"""
GraphQL resolvers for Wisdom Packet synthesis.

Implements getWisdomPacket query using Strawberry GraphQL.
"""

import strawberry
from typing import List, Optional
from datetime import datetime

from backend.epi_logos_system.cag.wisdom_packet.service import (
    WisdomPacketService,
    WisdomPacketFocus as ServiceFocus
)
from shared.database import Neo4jClient, RedisClient


# GraphQL enum for synthesis focus
@strawberry.enum
class WisdomPacketFocus(strawberry.Enum):
    STRUCTURAL = "STRUCTURAL"
    PROCESSUAL = "PROCESSUAL"
    ARCHETYPAL = "ARCHETYPAL"
    PRACTICAL = "PRACTICAL"


@strawberry.type
class BimbaNodeBasic:
    """Basic Bimba node information."""
    coordinate: str
    name: str
    subsystem: str
    description: Optional[str] = None
    operational_essence: Optional[str] = strawberry.field(name="operationalEssence", default=None)


@strawberry.type
class KeyConcept:
    """Key concept extracted from subgraph."""
    concept: str
    source_coordinates: List[str] = strawberry.field(name="sourceCoordinates")
    relevance_score: float = strawberry.field(name="relevanceScore")
    description: Optional[str] = None


@strawberry.type
class ApophaticPointer:
    """Apophatic pointer to missing themes."""
    missing_theme: str = strawberry.field(name="missingTheme")
    expected_coordinates: List[str] = strawberry.field(name="expectedCoordinates")
    suggestion: str


@strawberry.type
class WisdomPacket:
    """Pre-synthesized Wisdom Packet for a Bimba coordinate."""

    # Core synthesis components
    central_node: BimbaNodeBasic = strawberry.field(name="centralNode")
    key_concepts: List[KeyConcept] = strawberry.field(name="keyConcepts")
    narrative_summary: str = strawberry.field(name="narrativeSummary")
    apophatic_pointers: List[ApophaticPointer] = strawberry.field(name="apophaticPointers")
    contextual_themes: List[str] = strawberry.field(name="contextualThemes")

    # Quality and metadata
    synthesis_score: float = strawberry.field(name="synthesisScore")
    generated_at: str = strawberry.field(name="generatedAt")
    cache_hit: bool = strawberry.field(name="cacheHit")

    # Query parameters
    depth: int
    focus: Optional[WisdomPacketFocus] = None


def get_wisdom_packet_resolver(
    coordinate: str,
    depth: int = 2,
    focus: Optional[WisdomPacketFocus] = None,
    force_regenerate: bool = False
) -> Optional[WisdomPacket]:
    """
    Resolver for getWisdomPacket query.

    Args:
        coordinate: Bimba coordinate to synthesize
        depth: Traversal depth (1-5, default: 2)
        focus: Optional synthesis focus lens
        force_regenerate: Bypass cache and regenerate fresh packet

    Returns:
        WisdomPacket with synthesized canonical knowledge
    """
    # Initialize clients
    neo4j_client = Neo4jClient()
    redis_client = RedisClient()

    # Initialize service
    service = WisdomPacketService(neo4j_client, redis_client)

    # Convert GraphQL enum to service enum
    service_focus = None
    if focus:
        service_focus = ServiceFocus[focus.value]

    # Invalidate cache if force_regenerate requested
    if force_regenerate:
        service.invalidate_cache(coordinate)

    # Generate WisdomPacket (will use cache unless invalidated)
    try:
        wisdom_packet = service.generate_wisdom_packet(
            coordinate,
            depth=depth,
            focus=service_focus
        )

        # Convert service model to GraphQL type
        return WisdomPacket(
            central_node=BimbaNodeBasic(
                coordinate=wisdom_packet.central_node.coordinate,
                name=wisdom_packet.central_node.name,
                subsystem=wisdom_packet.central_node.subsystem,
                description=wisdom_packet.central_node.description,
                operational_essence=wisdom_packet.central_node.operational_essence
            ),
            key_concepts=[
                KeyConcept(
                    concept=kc.concept,
                    source_coordinates=kc.source_coordinates,
                    relevance_score=kc.relevance_score,
                    description=kc.description
                )
                for kc in wisdom_packet.key_concepts
            ],
            narrative_summary=wisdom_packet.narrative_summary,
            apophatic_pointers=[
                ApophaticPointer(
                    missing_theme=ap.missing_theme,
                    expected_coordinates=ap.expected_coordinates,
                    suggestion=ap.suggestion
                )
                for ap in wisdom_packet.apophatic_pointers
            ],
            contextual_themes=wisdom_packet.contextual_themes,
            synthesis_score=wisdom_packet.synthesis_score,
            generated_at=wisdom_packet.generated_at.isoformat(),
            cache_hit=wisdom_packet.cache_hit,
            depth=wisdom_packet.depth,
            focus=WisdomPacketFocus[focus.value] if focus else None
        )

    except ValueError as e:
        # Coordinate not found
        return None
    except Exception as e:
        # Log error and return None
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error generating WisdomPacket for {coordinate}: {e}")
        return None
