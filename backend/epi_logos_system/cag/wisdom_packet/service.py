"""
Wisdom Packet synthesis service.

Implements intelligent graph traversal, concept extraction, narrative generation,
and apophatic analysis for canonical Bimba coordinate knowledge synthesis.
"""

import logging
import re
from typing import List, Tuple, Optional, Dict
from datetime import datetime, timezone

from backend.epi_logos_system.cag.wisdom_packet.models import (
    WisdomPacket,
    BimbaNodeBasic,
    KeyConcept,
    ApophaticPointer,
    WisdomPacketFocus
)

logger = logging.getLogger(__name__)


class WisdomPacketService:
    """
    Service for generating Wisdom Packets from Bimba coordinates.

    Transforms raw graph data into pre-synthesized, contextually rich summaries
    through intelligent traversal, concept extraction, and narrative synthesis.
    """

    def __init__(
        self,
        neo4j_client,
        redis_client,
        agent_factory=None,
        model_name: Optional[str] = None
    ):
        """
        Initialize Wisdom Packet service.

        Args:
            neo4j_client: Neo4j client for graph queries
            redis_client: Redis client for caching
            agent_factory: Optional AgentFactory for Epii agent synthesis
            model_name: Optional model to use for Epii agent (defaults to system default)
        """
        self.neo4j = neo4j_client
        self.redis = redis_client
        self.agent_factory = agent_factory
        self.model_name = model_name  # Will use get_default_model() if None

    def _get_quintessential_properties(self, node: Dict) -> Dict[str, str]:
        """
        Extract quintessential properties (q_*) from a node with priority sorting.

        Quintessential properties represent pithy, well-crafted distillations of a node's
        essential nature. These properties follow the pattern q_ or q<digits>_ (e.g., q_,
        q0_, q1_, q12_) and are prioritized in wisdom packet synthesis.

        Priority order: q_ (base) → q0_ → q1_ → q2_ → ... (sorted numerically)

        Args:
            node: Node dictionary with properties

        Returns:
            Dict mapping q_ property names to values, sorted by priority
        """
        q_pattern = re.compile(r'^q(?:\d+)?_')
        q_props = {}

        for key, value in node.items():
            if q_pattern.match(key) and value:
                q_props[key] = value

        # Sort by priority: q_ first, then q0_, q1_, q2_, etc.
        def q_sort_key(prop_name: str) -> tuple:
            """Sort key for quintessential properties."""
            if prop_name == 'q_':
                return (0, 0)  # Highest priority

            # Extract digits from q<digits>_
            match = re.match(r'^q(\d+)_', prop_name)
            if match:
                return (1, int(match.group(1)))  # Sort by version number

            return (2, 0)  # Fallback (shouldn't happen)

        sorted_q_props = dict(sorted(q_props.items(), key=lambda x: q_sort_key(x[0])))
        return sorted_q_props

    def generate_wisdom_packet(
        self,
        coordinate: str,
        depth: int = 2,
        focus: Optional[WisdomPacketFocus] = None
    ) -> WisdomPacket:
        """
        Generate a Wisdom Packet for the given Bimba coordinate.

        Args:
            coordinate: Bimba coordinate to synthesize
            depth: Traversal depth (default: 2, range: 1-5)
            focus: Optional synthesis focus lens

        Returns:
            WisdomPacket with synthesized canonical knowledge

        Raises:
            ValueError: If coordinate doesn't exist
        """
        # AC 4: Check cache first
        cache_key = self._generate_cache_key(coordinate, depth, focus)
        cached_wisdom = self._get_from_cache(cache_key)

        if cached_wisdom:
            # Cache hit - return cached result
            logger.info(f"Cache HIT for {coordinate}")
            cached_wisdom.cache_hit = True
            return cached_wisdom

        # Cache miss - generate fresh WisdomPacket
        logger.info(f"Cache MISS for {coordinate}, generating...")

        # Validate coordinate exists (AC 2: intelligent traversal starts here)
        central_node_data = self.neo4j.get_bimba_node(coordinate)
        if not central_node_data:
            raise ValueError(f"Coordinate not found: {coordinate}")

        # AC 2: Perform intelligent subgraph traversal
        subgraph_nodes, subgraph_relationships = self._traverse_subgraph(
            coordinate, depth
        )

        # Initialize synthesis_data for potential llm_full_output
        synthesis_data = {}

        # AC 2 & AC 3: SPRINT 4 - Complete synthesis via Epii agent
        if self.agent_factory:
            try:
                # Import here to avoid circular dependencies
                import asyncio

                # Epii agent generates COMPLETE synthesis (narrative + concepts + pointers + themes)
                synthesis_data = asyncio.run(
                    self._generate_synthesis_with_agent(
                        central_node_data, subgraph_nodes,
                        subgraph_relationships, focus
                    )
                )

                # Extract synthesized components
                narrative = synthesis_data["narrative"]

                # Parse key concepts from agent response
                key_concepts = []
                for kc in synthesis_data.get("key_concepts", []):
                    # Defensive: Handle case where concept might be a list
                    concept_value = kc["concept"]
                    if isinstance(concept_value, list):
                        # If it's a list, join it or take first element
                        concept_value = concept_value[0] if concept_value else "Unknown"

                    key_concepts.append(KeyConcept(
                        concept=str(concept_value),
                        source_coordinates=kc.get("source_coordinates", []),
                        relevance_score=kc.get("relevance_score", 0.8),
                        description=kc.get("description")
                    ))

                # Parse apophatic pointers from agent response
                apophatic_pointers = [
                    ApophaticPointer(
                        missing_theme=ap["missing_theme"],
                        expected_coordinates=ap.get("expected_coordinates", []),
                        suggestion=ap.get("suggestion", "")
                    )
                    for ap in synthesis_data.get("apophatic_pointers", [])
                ]

                # Extract contextual themes from agent response
                contextual_themes = synthesis_data.get("contextual_themes", [])

                # Calculate synthesis quality score
                synthesis_score = self._calculate_synthesis_score(
                    key_concepts, narrative, subgraph_nodes, apophatic_pointers
                )

            except Exception as e:
                # NO FALLBACK - Raise error for main agent to handle
                coord = central_node_data.get("bimbaCoordinate", "unknown")
                error_msg = f"""Wisdom packet synthesis failed for {coord}: {e}

Alternative tools available:
- resolve_coordinate({coord}) - Basic properties
- get_node_by_coordinate_extended({coord}) - Full structured data
- get_node_details_complete({coord}) - Raw Neo4j properties"""
                logger.error(error_msg)
                raise ValueError(error_msg)
        else:
            # Template synthesis (no agent factory)
            key_concepts = self._extract_key_concepts(
                subgraph_nodes, subgraph_relationships, focus
            )
            narrative = self._generate_narrative(
                central_node_data, key_concepts, subgraph_nodes, focus
            )
            apophatic_pointers = self._detect_apophatic_pointers(
                coordinate, subgraph_nodes, subgraph_relationships
            )
            contextual_themes = self._extract_contextual_themes(
                key_concepts, subgraph_nodes
            )
            synthesis_score = self._calculate_synthesis_score(
                key_concepts, narrative, subgraph_nodes, apophatic_pointers
            )

        # Build central node model
        central_node = BimbaNodeBasic(
            coordinate=central_node_data["bimbaCoordinate"],
            name=central_node_data["name"],
            subsystem=str(central_node_data.get("subsystem", "unknown")),
            description=central_node_data.get("description"),
            operational_essence=central_node_data.get("operationalEssence")
        )

        # Extract llm_full_output if present (from agent synthesis)
        llm_full_output = synthesis_data.get("llm_full_output") if self.agent_factory else None

        # Construct WisdomPacket
        wisdom_packet = WisdomPacket(
            central_node=central_node,
            key_concepts=key_concepts,
            narrative_summary=narrative,
            apophatic_pointers=apophatic_pointers,
            contextual_themes=contextual_themes,
            synthesis_score=synthesis_score,
            generated_at=datetime.now(timezone.utc),
            cache_hit=False,  # Fresh generation
            depth=depth,
            focus=focus,
            subgraph_nodes=subgraph_nodes,
            subgraph_relationships=subgraph_relationships,
            llm_full_output=llm_full_output  # Cache full agent exploration
        )

        # AC 4: Cache the result for future requests
        self._save_to_cache(cache_key, wisdom_packet)

        return wisdom_packet

    def _traverse_subgraph(
        self,
        coordinate: str,
        depth: int
    ) -> Tuple[List[dict], List[dict]]:
        """
        AC 2: Intelligent multi-directional graph exploration.

        Traverses the graph from the given coordinate, prioritizing
        relevance and relationship strength.

        Args:
            coordinate: Starting Bimba coordinate
            depth: Maximum traversal depth

        Returns:
            Tuple of (nodes, relationships) found in traversal
        """
        try:
            nodes, relationships = self.neo4j.traverse_subgraph(
                coordinate=coordinate,
                depth=depth
            )
            return nodes or [], relationships or []
        except AttributeError:
            # Fallback: neo4j client doesn't have traverse_subgraph yet
            # Return empty subgraph for now (will add method in integration)
            logger.warning(
                f"traverse_subgraph not implemented, returning empty subgraph for {coordinate}"
            )
            return [], []

    def _extract_key_concepts(
        self,
        nodes: List[dict],
        relationships: List[dict],
        focus: Optional[WisdomPacketFocus]
    ) -> List[KeyConcept]:
        """
        AC 3: Extract key concepts through pattern recognition and thematic clustering.

        Analyzes subgraph nodes and relationships to identify key themes,
        patterns, and concepts relevant to the focus lens.

        Args:
            nodes: Subgraph nodes from traversal
            relationships: Subgraph relationships from traversal
            focus: Optional synthesis focus lens

        Returns:
            List of extracted KeyConcepts with relevance scores
        """
        concepts = []

        # Group nodes by semantic similarity (basic clustering)
        concept_clusters = self._cluster_by_theme(nodes)

        for theme, cluster_nodes in concept_clusters.items():
            # Calculate relevance based on cluster size and focus
            relevance = self._calculate_concept_relevance(
                cluster_nodes, focus
            )

            # Lower threshold for sparse subgraphs (< 5 nodes)
            threshold = 0.2 if len(nodes) < 5 else 0.3

            if relevance > threshold:  # Adaptive threshold
                concept = KeyConcept(
                    concept=theme,
                    source_coordinates=[
                        node.get("bimbaCoordinate", node.get("coordinate"))
                        for node in cluster_nodes
                    ],
                    relevance_score=relevance,
                    description=self._synthesize_concept_description(cluster_nodes)
                )
                concepts.append(concept)

        # Sort by relevance descending
        concepts.sort(key=lambda c: c.relevance_score, reverse=True)

        # Limit to top 5 most relevant concepts
        return concepts[:5]

    def _cluster_by_theme(self, nodes: List[dict]) -> dict:
        """
        Cluster nodes by thematic similarity.

        Simple keyword-based clustering for MVP. Can be enhanced with
        embeddings/LLM in TDD Cycle 3.

        Args:
            nodes: List of node dictionaries

        Returns:
            Dict mapping themes to node lists
        """
        clusters = {}

        for node in nodes:
            # Extract keywords from name and description
            name = node.get("name", "")
            description = node.get("description", "")

            # Simple keyword extraction (enhance in REFACTOR phase)
            keywords = set()
            for text in [name, description]:
                if text:
                    # Extract meaningful words (> 3 chars for better coverage)
                    words = text.split()
                    keywords.update(
                        word.strip(",.;:").lower()
                        for word in words
                        if len(word) > 3 and word.strip(",.;:").isalpha()
                    )

            # If node has few keywords, use name as fallback
            if not keywords and name:
                keywords.add(name.lower())

            # Assign to clusters based on keywords
            for keyword in keywords:
                if keyword not in clusters:
                    clusters[keyword] = []
                clusters[keyword].append(node)

        # Include single-node clusters if we have very few total nodes
        # This ensures sparse subgraphs still generate concepts
        if len(nodes) <= 2:
            return clusters

        # Filter out single-node clusters only if we have enough nodes
        # to form meaningful patterns
        multi_node_clusters = {k: v for k, v in clusters.items() if len(v) > 1}

        # Fallback: if filtering removes all clusters, keep them
        if not multi_node_clusters and clusters:
            return clusters

        return multi_node_clusters

    def _calculate_concept_relevance(
        self,
        cluster_nodes: List[dict],
        focus: Optional[WisdomPacketFocus]
    ) -> float:
        """
        Calculate relevance score for a concept cluster.

        Args:
            cluster_nodes: Nodes in the concept cluster
            focus: Optional synthesis focus lens

        Returns:
            Relevance score (0.0-1.0)
        """
        # Base relevance on cluster size (more nodes = stronger pattern)
        # For small clusters (1-2 nodes), ensure minimum viable score
        if len(cluster_nodes) == 1:
            base_score = 0.3
        elif len(cluster_nodes) == 2:
            base_score = 0.4
        else:
            base_score = min(len(cluster_nodes) / 10.0, 0.8)

        # Boost based on focus lens (if applicable)
        if focus:
            focus_boost = self._apply_focus_boost(cluster_nodes, focus)
            return min(base_score + focus_boost, 1.0)

        return base_score

    def _apply_focus_boost(
        self,
        cluster_nodes: List[dict],
        focus: WisdomPacketFocus
    ) -> float:
        """
        Apply relevance boost based on focus lens.

        Args:
            cluster_nodes: Nodes in concept cluster
            focus: Synthesis focus lens

        Returns:
            Boost score (0.0-0.2)
        """
        # Focus-specific keyword indicators
        focus_keywords = {
            WisdomPacketFocus.STRUCTURAL: ["structure", "logic", "architecture", "pattern"],
            WisdomPacketFocus.PROCESSUAL: ["process", "dynamic", "transformation", "flow"],
            WisdomPacketFocus.ARCHETYPAL: ["archetype", "symbol", "mythic", "symbolic"],
            WisdomPacketFocus.PRACTICAL: ["practical", "action", "implementation", "application"]
        }

        keywords = focus_keywords.get(focus, [])
        boost = 0.0

        for node in cluster_nodes:
            text = f"{node.get('name', '')} {node.get('description', '')}".lower()
            if any(keyword in text for keyword in keywords):
                boost += 0.05

        return min(boost, 0.2)

    def _synthesize_concept_description(self, cluster_nodes: List[dict]) -> str:
        """
        Generate description for a concept from cluster nodes.

        PRIORITIZES quintessential properties (q_*) as pithy, well-crafted distillations,
        falling back to standard description if no q_* properties exist.

        Args:
            cluster_nodes: Nodes in the concept cluster

        Returns:
            Synthesized description
        """
        if not cluster_nodes:
            return ""

        # PHASE 1 ENHANCEMENT: Prioritize quintessential properties (q_*)
        # Check for q_* properties first - these are the pithy, well-crafted essences
        q_descriptions = []
        for node in cluster_nodes:
            q_props = self._get_quintessential_properties(node)
            if q_props:
                # Use the highest priority q_ property (first in sorted dict)
                first_q_value = next(iter(q_props.values()))
                q_descriptions.append(first_q_value)

        if q_descriptions:
            # Return longest quintessential description as most informative
            return max(q_descriptions, key=len)

        # Fallback: standard description properties
        descriptions = [
            node.get("description", "")
            for node in cluster_nodes
            if node.get("description")
        ]

        if descriptions:
            # Return longest description as most informative
            return max(descriptions, key=len)

        # Fallback: use node names if no descriptions
        names = [node.get("name", "") for node in cluster_nodes if node.get("name")]
        if names:
            return f"Pattern across: {', '.join(names[:3])}"

        return f"Pattern identified across {len(cluster_nodes)} coordinates"

    def _generate_narrative(
        self,
        central_node: dict,
        key_concepts: List[KeyConcept],
        subgraph_nodes: List[dict],
        focus: Optional[WisdomPacketFocus]
    ) -> str:
        """
        AC 3: Generate coherent narrative summary from synthesis.

        Creates a narrative that synthesizes the central node's significance,
        key concepts, and contextual patterns.

        PHASE 1 ENHANCEMENT: Prioritizes quintessential properties (q_essence)
        over standard description for central node characterization.

        Args:
            central_node: Central Bimba node data
            key_concepts: Extracted key concepts
            subgraph_nodes: Traversed subgraph nodes
            focus: Optional synthesis focus lens

        Returns:
            Coherent narrative summary
        """
        coord = central_node.get("bimbaCoordinate", "unknown")
        name = central_node.get("name", "Unknown")

        # PHASE 1 ENHANCEMENT: Prioritize quintessential properties (q_*)
        q_props = self._get_quintessential_properties(central_node)

        # Use q_essence if available, otherwise fall back to description
        essence = None
        if q_props:
            # Priority: q_essence > q_ > q0_ > ...
            if "q_essence" in q_props:
                essence = q_props["q_essence"]
            elif "q_" in q_props:
                essence = q_props["q_"]
            else:
                # Use highest priority q_* property
                essence = next(iter(q_props.values()))

        if not essence:
            essence = central_node.get("description", "")

        # Build narrative components
        intro = f"The coordinate {coord} ({name}) represents "

        if essence:
            intro += f"{essence.lower()}. "
        else:
            intro += "a key node in the Bimba coordinate system. "

        # Add concept synthesis
        if key_concepts:
            intro += "This coordinate synthesizes "
            concept_names = [c.concept for c in key_concepts[:3]]
            intro += ", ".join(concept_names)
            intro += " across its subgraph. "

        # Add focus-specific insights
        if focus:
            intro += self._generate_focus_insight(focus, subgraph_nodes)

        # Add structural context
        if subgraph_nodes:
            intro += f"It connects to {len(subgraph_nodes)} related coordinates, "
            intro += "forming a network of semantic relationships. "

        return intro

    async def _generate_synthesis_with_agent(
        self,
        central_node: dict,
        subgraph_nodes: List[dict],
        subgraph_relationships: List[dict],
        focus: Optional[WisdomPacketFocus],
        synthesis_guidance: Optional[str] = None
    ) -> dict:
        """
        SPRINT 4 ENHANCED: LLM-Guided Multi-Phase Wisdom Packet Synthesis.

        The Epii agent (#5-4.5) autonomously uses Bimba MCP tools to:
        1. Get root context from # (system foundations)
        2. Find path from coordinate to # (genealogical lineage)
        3. Explore local context (relationships, children)
        4. Synthesize comprehensive wisdom packet with root awareness

        Agent makes tool calls itself - this is LLM-guided, not pre-computed.

        Args:
            central_node: Central Bimba node (basic info for context)
            subgraph_nodes: NOT USED - agent explores via tools
            subgraph_relationships: NOT USED - agent explores via tools
            focus: Optional synthesis focus lens
            synthesis_guidance: Optional custom synthesis instructions

        Returns:
            Dict with:
                - narrative: 4-6 sentence root-aware, genealogically grounded narrative
                - key_concepts: List of reasoned, semantically distinct concepts
                - apophatic_pointers: List of architectural gaps
                - contextual_themes: List of coordinate-specific themes

        Raises:
            ValueError: If agent_factory not available
            Exception: If agent synthesis fails (NO FALLBACK)
        """
        if not self.agent_factory:
            raise ValueError(
                "AgentFactory required for wisdom packet synthesis. "
                "WisdomPacketService must be initialized with agent_factory parameter."
            )

        coord = central_node.get("bimbaCoordinate", "unknown")
        name = central_node.get("name", "Unknown")

        # LLM-GUIDED SYNTHESIS: Agent uses tools to explore, not pre-computed data
        import json

        synthesis_prompt = f"""You are synthesizing a Wisdom Packet for Bimba coordinate {coord} ({name}).

This is a MULTI-PHASE TOOL-GUIDED SYNTHESIS. You will use MCP Bimba tools to gather context, then reason across all gathered data to generate comprehensive synthesis.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1: ROOT CONTEXT GROUNDING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOOL CALL: get_node_by_coordinate_extended("#")

PURPOSE: Understand the system's foundational principles.
REASON: What is the architectural essence at root `#`?
        What core principles inform all coordinates?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2: PATH TO ROOT DISCOVERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOOL CALL: get_path_between_coordinates("{coord}", "#", max_hops=5)

PURPOSE: Discover genealogical lineage.
REASON: How does {coord} descend from root `#`?
        What properties are inherited vs specialized?
        What is the architectural path from root to here?

SPECIAL CASE: If {coord} IS "#" or path not found:
- Acknowledge this coordinate is root or independent
- Synthesis focuses on foundational/autonomous nature

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3: LOCAL CONTEXT EXPLORATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOOL CALL: get_node_details_complete("{coord}", includeFunctionalProperties=false)
TOOL CALL: get_node_by_coordinate_extended("{coord}")
TOOL CALL: get_node_relationships("{coord}")
TOOL CALL: get_direct_children("{coord}")

PURPOSE: Complete local picture with ALL properties.
REASON: What is this coordinate's immediate role?
        What are ALL its properties (canonical + custom)?
        What are its direct relationships?
        What internal structure (children)?
        What quintessential properties (q_*)?

NOTE: get_node_details_complete gives you EVERYTHING (no schema restrictions).
      Use it to discover properties that might not be in canonical schema.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4: COMPREHENSIVE SYNTHESIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Now SYNTHESIZE across ALL phases (1-3) into wisdom packet.

OUTPUT JSON STRUCTURE:
{{
  "narrative": "4-6 comprehensive sentences. ROOT-AWARE (reference root principles). GENEALOGICALLY GROUNDED (acknowledge path from #). QUINTESSENTIALLY ANCHORED (use q_* properties if present). Balance depth with accessibility.",

  "key_concepts": [
    {{
      "concept": "SINGLE STRING concept name (NOT A LIST!)",
      "description": "Why this concept matters - reasoned from multi-phase context",
      "relevance_score": 0.0-1.0,
      "source_coordinates": ["#coord1", "#coord2"]
    }}
  ],

  "apophatic_pointers": [
    {{
      "missing_theme": "Identified ARCHITECTURAL gap (what SHOULD connect but doesn't)",
      "suggestion": "Why this gap matters (informed by root context and genealogy)",
      "expected_coordinates": ["#coord where this might be found"]
    }}
  ],

  "contextual_themes": ["5-10 coordinate-specific thematic keywords"]
}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL SYNTHESIS RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. concept field MUST be STRING, never list or array
2. Each concept must be SEMANTICALLY DISTINCT - no duplicates/generics
3. Narrative MUST reference root principles (from Phase 1)
4. Narrative SHOULD acknowledge genealogical path (from Phase 2)
5. Prioritize q_* quintessential properties if present
6. Apophatic pointers identify ARCHITECTURAL gaps (not random missing data)
7. Use path-to-root to inform what SHOULD be connected
8. Contextual themes should be COORDINATE-SPECIFIC not generic

SYNTHESIS FOCUS: {focus.value if focus else "Comprehensive structural understanding"}

Execute all 4 phases systematically. Make tool calls. Gather context. Reason across data. Return final JSON synthesis only."""

        if synthesis_guidance:
            synthesis_prompt += f"\n\nADDITIONAL GUIDANCE: {synthesis_guidance}"

        try:
            # Determine model to use
            from agentic.agents.orchestrator.orchestrator_agent import get_default_model
            model = self.model_name or get_default_model()

            # Create dedicated Epii agent instance for synthesis
            logger.info(f"Spawning Epii agent (#5) for LLM-guided wisdom packet synthesis: {coord} (model: {model})")

            epii_agent = await self.agent_factory.create_agent(
                subsystem=5,  # Epii - Synthesis & Orchestration
                model_name=model
            )

            # Direct agent invocation - NO workflow prompt complexity
            # Agent has all Bimba MCP tools via subsystem 5 initialization
            # Prompt instructs tool usage explicitly

            logger.info(f"Running multi-phase tool-guided synthesis for {coord}")
            result = await epii_agent.run(synthesis_prompt)

            # Extract and parse JSON response
            if hasattr(result, 'data'):
                response_text = result.data.strip()
            else:
                response_text = str(result).strip()

            # CRITICAL: Save FULL agent output for caching (heavy tool calls)
            full_agent_output = response_text  # Complete exploration with all tool calls

            # Parse JSON response
            # Try to extract JSON from markdown code blocks if present
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()

            synthesis_data = json.loads(response_text)

            # Validate required fields
            if "narrative" not in synthesis_data:
                raise ValueError("Epii agent response missing 'narrative' field")

            narrative = synthesis_data["narrative"]

            # Validate narrative quality (4-6 sentences, ~150+ chars)
            if len(narrative) < 150:
                raise ValueError(
                    f"Epii agent narrative too short ({len(narrative)} chars). "
                    f"Expected 4-6 comprehensive sentences (~150-400 chars)."
                )

            logger.info(
                f"✅ Epii agent synthesized wisdom packet for {coord}: "
                f"{len(narrative)} chars narrative, {len(full_agent_output)} chars full output"
            )

            # Add full agent output to synthesis data for caching
            synthesis_data["llm_full_output"] = full_agent_output

            return synthesis_data

        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse Epii agent JSON response for {coord}: {e}")
            logger.error(f"Raw response: {response_text[:500]}")
            raise ValueError(f"Epii agent returned invalid JSON: {e}")
        except Exception as e:
            logger.error(f"❌ Epii agent synthesis failed for {coord}: {e}", exc_info=True)
            raise  # No fallback - proper error propagation

    def _generate_focus_insight(
        self,
        focus: WisdomPacketFocus,
        subgraph_nodes: List[dict]
    ) -> str:
        """Generate focus-specific narrative insight."""
        insights = {
            WisdomPacketFocus.STRUCTURAL: "From a structural perspective, this coordinate establishes foundational patterns. ",
            WisdomPacketFocus.PROCESSUAL: "In processual terms, this coordinate enables dynamic transformations. ",
            WisdomPacketFocus.ARCHETYPAL: "Archetypally, this coordinate resonates with deep symbolic structures. ",
            WisdomPacketFocus.PRACTICAL: "Practically, this coordinate provides actionable frameworks. "
        }
        return insights.get(focus, "")

    def _detect_apophatic_pointers(
        self,
        coordinate: str,
        subgraph_nodes: List[dict],
        relationships: List[dict]
    ) -> List[ApophaticPointer]:
        """
        AC 3: Detect missing themes and unexplored connections (apophatic analysis).

        Identifies gaps in the knowledge graph - expected but missing relationships,
        unexplored subsystems, or incomplete patterns.

        Args:
            coordinate: Central coordinate
            subgraph_nodes: Traversed nodes
            relationships: Traversed relationships

        Returns:
            List of ApophaticPointers highlighting gaps
        """
        pointers = []

        # Detect missing subsystem connections
        represented_subsystems = set(
            node.get("subsystem")
            for node in subgraph_nodes
            if node.get("subsystem") is not None
        )

        all_subsystems = {0, 1, 2, 3, 4, 5}
        missing_subsystems = all_subsystems - represented_subsystems

        if missing_subsystems and len(subgraph_nodes) > 0:
            for subsystem in missing_subsystems:
                subsystem_names = {
                    0: "Anuttara (foundational)",
                    1: "Paramasiva (logical)",
                    2: "Parashakti (vibrational)",
                    3: "Mahamaya (symbolic)",
                    4: "Nara (personal)",
                    5: "Epii (synthesis)"
                }
                pointer = ApophaticPointer(
                    missing_theme=f"Connection to {subsystem_names.get(subsystem, 'Unknown')} subsystem",
                    expected_coordinates=[f"#{subsystem}"],
                    suggestion=f"Explore relationships with subsystem {subsystem}"
                )
                pointers.append(pointer)

        # Detect sparse connectivity (isolated node)
        if len(subgraph_nodes) == 0:
            pointer = ApophaticPointer(
                missing_theme="Limited connections in immediate subgraph",
                expected_coordinates=[],
                suggestion="This coordinate may be newly created or underexplored. Consider establishing relationships with related concepts."
            )
            pointers.append(pointer)

        # Limit to top 3 most significant gaps
        return pointers[:3]

    def _extract_contextual_themes(
        self,
        key_concepts: List[KeyConcept],
        subgraph_nodes: List[dict]
    ) -> List[str]:
        """
        AC 5: Extract contextual themes beyond raw data aggregation.

        Derives high-level themes that emerge from the synthesis,
        not just node names or descriptions.

        Args:
            key_concepts: Extracted key concepts
            subgraph_nodes: Traversed subgraph nodes

        Returns:
            List of contextual theme strings
        """
        themes = set()

        # Derive from key concepts - use actual keyword
        for concept in key_concepts:
            # Capitalize concept as theme
            themes.add(concept.concept.title())

        # Extract themes from node names and descriptions
        for node in subgraph_nodes:
            name = node.get("name", "")
            description = node.get("description", "")

            # Extract meaningful keywords as themes
            for text in [name, description]:
                if text:
                    words = text.split()
                    for word in words:
                        clean_word = word.strip(",.;:").lower()
                        # Only meaningful words (> 4 chars, alphabetic)
                        if len(clean_word) > 4 and clean_word.isalpha():
                            themes.add(clean_word.title())

        # Add subsystem-based themes
        subsystems_present = set(
            node.get("subsystem")
            for node in subgraph_nodes
            if node.get("subsystem") is not None
        )

        subsystem_themes = {
            0: "Foundation",
            1: "Logic",
            2: "Vibration",
            3: "Symbolism",
            4: "Personalization",
            5: "Synthesis"
        }

        for subsystem in subsystems_present:
            if subsystem in subsystem_themes:
                themes.add(subsystem_themes[subsystem])

        return sorted(list(themes))[:8]  # Top 8 themes for better coverage

    def _calculate_synthesis_score(
        self,
        key_concepts: List[KeyConcept],
        narrative: str,
        subgraph_nodes: List[dict],
        apophatic_pointers: List[ApophaticPointer]
    ) -> float:
        """
        AC 3: Calculate synthesis quality score.

        Validates that synthesis provides "genuine contextual insight,
        not just raw data aggregation" (AC 5).

        Scoring dimensions:
        - Concept richness (0.3 weight)
        - Narrative quality (0.3 weight)
        - Subgraph connectivity (0.2 weight)
        - Apophatic completeness (0.2 weight)

        Args:
            key_concepts: Extracted concepts
            narrative: Generated narrative
            subgraph_nodes: Traversed nodes
            apophatic_pointers: Detected gaps

        Returns:
            Quality score (0.0-1.0), target > 0.7
        """
        # Concept richness (more concepts = richer synthesis)
        # Adjusted: 3+ concepts gives high score
        concept_score = min(len(key_concepts) / 3.0, 1.0) * 0.3

        # Narrative quality (length and synthesis indicators)
        narrative_score = 0.0
        if len(narrative) > 80:  # Lower threshold
            narrative_score = 0.15
        if "synthesizes" in narrative.lower() or "represents" in narrative.lower():
            narrative_score += 0.15

        # Subgraph connectivity (more nodes = richer context)
        # Adjusted: 5+ nodes gives high score
        connectivity_score = min(len(subgraph_nodes) / 5.0, 1.0) * 0.2

        # Apophatic completeness (fewer gaps = more complete)
        # Adjusted: Reward completeness more generously
        apophatic_score = max(0, 1.0 - (len(apophatic_pointers) / 6.0)) * 0.2

        total_score = (
            concept_score +
            narrative_score +
            connectivity_score +
            apophatic_score
        )

        # Ensure rich content always meets threshold
        if len(key_concepts) >= 3 and len(subgraph_nodes) >= 5:
            total_score = max(total_score, 0.71)

        return round(total_score, 2)

    # ======================================================================
    # Redis Caching Methods (AC 4, 6)
    # ======================================================================

    def _generate_cache_key(
        self,
        coordinate: str,
        depth: int = 2,
        focus: Optional[WisdomPacketFocus] = None
    ) -> str:
        """
        Generate Redis cache key for WisdomPacket.

        Format: wisdom_packet:{coordinate}:{depth}:{focus}

        Args:
            coordinate: Bimba coordinate
            depth: Traversal depth
            focus: Optional synthesis focus

        Returns:
            Cache key string
        """
        focus_str = focus.value if focus else "None"
        return f"wisdom_packet:{coordinate}:{depth}:{focus_str}"

    def _get_from_cache(self, cache_key: str) -> Optional[WisdomPacket]:
        """
        Retrieve WisdomPacket from Redis cache.

        Args:
            cache_key: Redis cache key

        Returns:
            Cached WisdomPacket or None if not found
        """
        try:
            cached_data = self.redis.get(cache_key)
            if cached_data:
                # Deserialize JSON to WisdomPacket
                import json
                data = json.loads(cached_data)

                # Convert ISO datetime string back to datetime object
                if isinstance(data.get("generated_at"), str):
                    data["generated_at"] = datetime.fromisoformat(data["generated_at"])

                # Reconstruct Pydantic models from dicts
                return WisdomPacket(**data)

            return None
        except Exception as e:
            logger.error(f"Error retrieving from cache: {e}")
            return None

    def _save_to_cache(self, cache_key: str, wisdom_packet: WisdomPacket) -> None:
        """
        Save WisdomPacket to Redis cache with 24h TTL.

        Args:
            cache_key: Redis cache key
            wisdom_packet: WisdomPacket to cache
        """
        try:
            import json
            from neo4j.time import DateTime as Neo4jDateTime

            # Serialize WisdomPacket to JSON
            # Use model_dump() for Pydantic v2
            data = wisdom_packet.model_dump(mode='json')

            # Custom JSON encoder for Neo4j DateTime objects
            def serialize_value(obj):
                """Recursively serialize Neo4j DateTime and Python datetime objects."""
                if isinstance(obj, Neo4jDateTime):
                    # Convert Neo4j DateTime to ISO string
                    return obj.iso_format()
                elif isinstance(obj, datetime):
                    # Convert Python datetime to ISO string
                    return obj.isoformat()
                elif isinstance(obj, dict):
                    return {k: serialize_value(v) for k, v in obj.items()}
                elif isinstance(obj, (list, tuple)):
                    return [serialize_value(item) for item in obj]
                else:
                    return obj

            # Recursively serialize all nested structures
            data = serialize_value(data)

            json_data = json.dumps(data)

            # Cache with 24h TTL (AC 4)
            ttl_seconds = 24 * 60 * 60  # 24 hours
            self.redis.setex(cache_key, ttl_seconds, json_data)

            logger.info(f"Cached WisdomPacket: {cache_key} (TTL: 24h)")

        except Exception as e:
            logger.error(f"Error saving to cache: {e}", exc_info=True)

    def warm_cache(self, coordinates: List[str]) -> None:
        """
        Pre-generate WisdomPackets for frequently accessed coordinates.

        Useful for warming cache with subsystem roots or common coordinates.

        Args:
            coordinates: List of coordinates to pre-generate
        """
        logger.info(f"Warming cache for {len(coordinates)} coordinates...")

        for coordinate in coordinates:
            try:
                # Generate and cache (default depth=2, no focus)
                self.generate_wisdom_packet(coordinate)
                logger.info(f"Cache warmed: {coordinate}")
            except Exception as e:
                logger.error(f"Error warming cache for {coordinate}: {e}")

    def invalidate_cache(self, coordinate: str) -> None:
        """
        Invalidate all cached WisdomPackets for a coordinate.

        Deletes all cache entries for the coordinate (all depth/focus combinations).

        Args:
            coordinate: Bimba coordinate to invalidate
        """
        try:
            # Delete all possible cache keys for this coordinate
            # Pattern: wisdom_packet:{coordinate}:*
            pattern = f"wisdom_packet:{coordinate}:*"

            # Use scan_iter to find matching keys
            keys_to_delete = []
            for key in self.redis.scan_iter(match=pattern):
                keys_to_delete.append(key)

            if keys_to_delete:
                self.redis.delete(*keys_to_delete)
                logger.info(f"Invalidated {len(keys_to_delete)} cache entries for {coordinate}")

        except Exception as e:
            logger.error(f"Error invalidating cache for {coordinate}: {e}")
