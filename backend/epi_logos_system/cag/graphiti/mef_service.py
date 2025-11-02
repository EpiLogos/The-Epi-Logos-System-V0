"""
MEF (Meta-Epistemic Framework) Resonance Analysis Service.

Implements Bimba resonance discovery through 6-lens cognitive framework
via Parashakti agent delegation. Creates BimbaResonance nodes with EA+Episodic
labels for etymology archaeology sessions.

Story 08.13 - MEF Resonance Analysis via Parashakti Agent

Architecture:
- Loads community context from Neo4j
- Creates Parashakti agent with DeepSeek model (64K context, reasoning-capable)
- Builds MEF prompt with community context + workflow task
- Invokes agent and parses MEF analysis results
- Stores BimbaResonance nodes with EA+Episodic labels
- Creates relationships: (community)-[:RESONATES_WITH]->(resonance)-[:TARGETS]->(coord)
"""

import logging
import uuid
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


async def run_mef_analysis(
    community_id: str,
    service: 'GraphitiService'
) -> Dict[str, Any]:
    """
    Run MEF (Meta-Epistemic Framework) resonance analysis on etymology community.

    Loads community context, invokes Parashakti agent with MEF workflow,
    parses results, and stores BimbaResonance nodes.

    Args:
        community_id: Etymology community UUID to analyze
        service: GraphitiService instance for Neo4j access

    Returns:
        Dict with success status, resonances created, reasoning summary, and metadata

    Raises:
        Exception: If community not found or agent invocation fails
    """
    try:
        logger.info(f"🔬 MEF Analysis: Starting for community {community_id}")

        # Step 1: Load community context from Neo4j
        community_query = """
        MATCH (c:Entity:EA:Community {uuid: $community_id})
        RETURN c.name as name,
               c.words as words,
               c.pie_root as pie_root,
               c.semantic_pattern as semantic_pattern,
               c.quaternal_type as quaternal_type,
               c.group_id as group_id,
               c.etymology_session_id as etymology_session_id,
               c.suggestion_resonance as suggestion_resonance
        """

        records, _, _ = service.neo4j_client.execute_query(
            community_query,
            {"community_id": community_id}
        )

        if not records:
            logger.error(f"❌ Community {community_id} not found")
            return {
                "success": False,
                "error": f"Community {community_id} not found"
            }

        community_data = dict(records[0])
        etymology_session_id = community_data.get("etymology_session_id")

        logger.info(
            f"✅ Loaded community: {community_data.get('name')} "
            f"(words={community_data.get('words')}, PIE={community_data.get('pie_root')})"
        )

        # Step 2: Create Parashakti agent with DeepSeek model
        from agentic.agents.constellation import create_parashakti_agent
        from agentic.agents.orchestrator.orchestrator_agent import OrchestratorDeps
        from agentic.clients.bimba_graphql_client import BimbaGraphQLClient
        from shared.database.redis_client import RedisClient
        from shared.database.mongodb_client import MongoDBClient

        bimba_client = BimbaGraphQLClient()
        redis_client = RedisClient()
        mongodb_client = MongoDBClient()

        parashakti_agent = await create_parashakti_agent(
            model="deepseek:deepseek-chat",  # 64K context, reasoning-capable
            bimba_client=bimba_client,
            redis_client=redis_client
        )

        logger.info("✅ Created Parashakti agent with DeepSeek model")

        # Step 3: Load MEF workflow from Prakasa (#5-4.2 coordinate properties)
        # NO FALLBACK - Prakasa is the single source of truth
        logger.info("📚 Loading MEF workflow from Prakasa coordinate #5-4.2...")
        workflow_props = await _load_mef_workflow_from_prakasa(bimba_client)

        if not workflow_props:
            logger.error("❌ Failed to load MEF workflow from Prakasa - ABORTING (no fallback)")
            return {
                "success": False,
                "error": "MEF workflow not available from Prakasa coordinate #5-4.2",
                "community_id": community_id
            }

        logger.info(f"✅ Loaded MEF workflow from Prakasa (version {workflow_props.get('version', 'unknown')})")

        # Agent already has MEF capability in system prompt via Prakasa
        # Just send lightweight community data + brief instruction
        mef_prompt = _build_lightweight_mef_prompt(community_data)

        logger.info(f"📝 Built lightweight MEF prompt ({len(mef_prompt)} chars)")

        # Step 4: Create minimal deps for agent invocation
        deps = OrchestratorDeps(
            user_id=community_data.get("group_id", "system"),
            session_id=etymology_session_id or "mef_analysis",
            bimba_client=bimba_client,
            redis_client=redis_client,
            conversation_service=mongodb_client,
            state={}
        )

        # Step 5: Invoke agent with MEF prompt
        logger.info("🚀 Invoking Parashakti agent for MEF analysis...")

        agent_response = await parashakti_agent.run(mef_prompt, deps=deps)

        # Get usage stats (usage is a method, not a property)
        usage_info = agent_response.usage() if hasattr(agent_response, 'usage') else None
        total_tokens = usage_info.total_tokens if usage_info else 'N/A'

        logger.info(f"✅ Agent invocation complete (tokens={total_tokens})")
        logger.debug(f"Agent response type: {type(agent_response)}")

        # Step 6: Parse agent response (Pydantic AI returns .output, not .data)
        mef_analysis = agent_response.output if hasattr(agent_response, 'output') else agent_response.data

        logger.debug(f"MEF analysis type: {type(mef_analysis)}")
        logger.debug(f"MEF analysis preview: {str(mef_analysis)[:500]}")

        # If agent returned string (plain text), try to parse as JSON
        if isinstance(mef_analysis, str):
            logger.warning("⚠️ Agent returned string instead of dict, attempting JSON parse...")

            # Agent wrapped response in markdown code block - extract JSON
            if "```json" in mef_analysis:
                logger.info("📝 Extracting JSON from markdown code block...")
                # Extract content between ```json and ```
                json_start = mef_analysis.find("```json") + 7
                json_end = mef_analysis.find("```", json_start)
                if json_end > json_start:
                    mef_analysis = mef_analysis[json_start:json_end].strip()
                    logger.info(f"✂️ Extracted JSON block ({len(mef_analysis)} chars)")

            try:
                mef_analysis = json.loads(mef_analysis)
                logger.info("✅ Successfully parsed string response as JSON")
            except json.JSONDecodeError as e:
                logger.error(f"❌ Failed to parse agent response as JSON: {e}")
                logger.error(f"Full response length: {len(mef_analysis)} chars")
                logger.error(f"Raw response (first 1000 chars): {mef_analysis[:1000]}")
                logger.error(f"Raw response (last 500 chars): {mef_analysis[-500:]}")
                return {
                    "success": False,
                    "error": f"Agent returned unparseable response: {str(e)}",
                    "raw_response": mef_analysis[:500]
                }

        if not isinstance(mef_analysis, dict):
            logger.error(f"❌ Agent returned non-dict response: {type(mef_analysis)}")
            return {
                "success": False,
                "error": "Agent returned invalid response format"
            }

        # Extract reasoning summary
        reasoning_summary = mef_analysis.get("reasoning_summary", "No reasoning summary provided")

        # Extract DeepSeek reasoning chain from messages
        deepseek_reasoning = []
        try:
            if hasattr(agent_response, 'all_messages'):
                all_messages = agent_response.all_messages()
                for msg in all_messages:
                    # DeepSeek reasoning appears in model response messages
                    if hasattr(msg, 'content') and isinstance(msg.content, str):
                        # Look for <think></think> tags in DeepSeek responses
                        if '<think>' in msg.content:
                            think_start = msg.content.find('<think>') + 7
                            think_end = msg.content.find('</think>')
                            if think_end > think_start:
                                reasoning_text = msg.content[think_start:think_end].strip()
                                deepseek_reasoning.append(reasoning_text)
                                logger.info(f"🧠 Captured DeepSeek reasoning ({len(reasoning_text)} chars)")
        except Exception as e:
            logger.warning(f"⚠️ Could not extract DeepSeek reasoning: {e}")

        # Combine reasoning segments or use fallback
        deepseek_reasoning_text = "\n\n".join(deepseek_reasoning) if deepseek_reasoning else "DeepSeek reasoning chain not available"

        logger.info(f"📊 Reasoning summary: {reasoning_summary[:100]}...")

        # Step 7: Extract and store resonances
        bimba_resonances = mef_analysis.get("bimba_resonances", [])

        if not bimba_resonances:
            logger.warning("⚠️ No Bimba resonances detected in MEF analysis")
            logger.info(f"📊 Full analysis output: {json.dumps(mef_analysis, indent=2)}")
            # CHANGED: Don't early return - still log the analysis for debugging
            # Users want to see what the agent analyzed even if 0 resonances
            # return {
            #     "success": True,
            #     "resonances_created": 0,
            #     "reasoning_summary": reasoning_summary,
            #     "deepseek_reasoning": deepseek_reasoning,
            #     "message": "MEF analysis completed but no resonances detected"
            # }

        # Step 8: Store each resonance
        stored_count = 0
        for resonance in bimba_resonances:
            try:
                success = await store_bimba_resonance(
                    community_id=community_id,
                    resonance=resonance,
                    mef_analysis=mef_analysis,
                    deepseek_reasoning=deepseek_reasoning_text,
                    service=service,
                    etymology_session_id=etymology_session_id
                )

                if success:
                    stored_count += 1
                    logger.info(
                        f"✅ Stored resonance {stored_count}/{len(bimba_resonances)}: "
                        f"{resonance.get('coordinate')} (strength={resonance.get('resonance_strength')})"
                    )
            except Exception as e:
                logger.error(f"❌ Failed to store resonance {resonance.get('coordinate')}: {e}")

        logger.info(f"🎉 MEF Analysis complete: {stored_count}/{len(bimba_resonances)} resonances stored")

        return {
            "success": True,
            "resonances_created": stored_count,
            "reasoning_summary": reasoning_summary,
            "deepseek_reasoning": deepseek_reasoning_text,
            "total_resonances_detected": len(bimba_resonances),
            "community_id": community_id
        }

    except Exception as e:
        logger.error(f"❌ MEF analysis failed for community {community_id}: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "community_id": community_id
        }


def _build_mef_prompt(community_data: Dict[str, Any]) -> str:
    """
    Build MEF analysis prompt for Parashakti agent.

    Constructs prompt with community context and MEF workflow instructions.

    Args:
        community_data: Community data from Neo4j (name, words, PIE root, etc.)

    Returns:
        Formatted MEF analysis prompt string
    """
    words = community_data.get("words", [])
    pie_root = community_data.get("pie_root", "Unknown")
    semantic_pattern = community_data.get("semantic_pattern", "")
    quaternal_type = community_data.get("quaternal_type", "UNKNOWN")
    suggestion_resonance = community_data.get("suggestion_resonance")

    prompt = f"""
# MEF Resonance Analysis Task

Analyze the following etymology community through the **6-lens Meta-Epistemic Framework** and discover resonant Bimba coordinates.

## Community Context

**Name:** {community_data.get('name', 'Unknown')}
**Words:** {', '.join(words) if words else 'None'}
**PIE Root:** {pie_root}
**Semantic Pattern:** {semantic_pattern}
**Quaternal Structure:** {quaternal_type}
{f"**Suggested Resonance:** {suggestion_resonance}" if suggestion_resonance else ""}

## MEF Analysis Instructions

Analyze this etymology through the **6 MEF lenses**:

1. **Archetypal-Numerical (#2-1-0)**: What archetypal numbers govern this etymology? What Adam/Eve (structural/generative) charges appear?
2. **Causal (#2-1-1)**: How did this meaning emerge? What causal patterns drive semantic shifts?
3. **Logical (#2-1-2)**: What logical contradictions or paradoxes appear? How does tetralemma resolve tensions?
4. **Processual (#2-1-3)**: How did this word evolve through time? What stages of becoming appear?
5. **Meta-Epistemic (#2-1-4)**: How do we know this etymology? What epistemic structures underlie our understanding?
6. **Divine-Scalar (#2-1-5)**: What divine patterns manifest? How does meaning ascend/descend consciousness scales?

## Tools Available

You have access to 3 MEF tools for Bimba resonance discovery:

- `semantic_coordinate_discovery_tool(query, max_results=7)` - Find coordinates by concept/meaning
- `get_direct_children_tool(bimba_coordinate)` - Explore architectural hierarchy
- `get_node_relationships_tool(coordinate)` - Traverse canonical semantic relations

**Use these tools strategically** to discover resonances across lenses.

## Output Format

Return your analysis as a structured dictionary with:

```python
{{
    "reasoning_summary": "2-3 sentence summary of MEF analysis process and key insights",
    "bimba_resonances": [
        {{
            "coordinate": "#X-Y-Z",
            "resonance_type": "archetypal_numerical" | "causal" | "logical" | "processual" | "meta_epistemic" | "divine_scalar" | "multi_lens",
            "resonance_strength": 0.0-1.0,  # confidence score
            "description": "Why this coordinate resonates with the etymology (2-3 sentences)",
            "detected_via_lens": "lens_name",  # which MEF lens detected this
            "detected_via_tool": "tool_name",  # which tool was used
            "mef_archetypal": {{...}} or None,  # lens-specific insights (if applicable)
            "mef_causal": {{...}} or None,
            "mef_logical": {{...}} or None,
            "mef_processual": {{...}} or None,
            "mef_meta_epistemic": {{...}} or None,
            "mef_divine_scalar": {{...}} or None
        }},
        // ... more resonances
    ]
}}
```

**IMPORTANT:**
- Aim for 3-7 resonances (quality over quantity)
- Balance tool usage across semantic, structural, and canonical discovery
- Provide substantive descriptions (not placeholders)
- Resonance strength should be meaningful (not random)
- Include lens-specific insights in `mef_*` properties

Begin your MEF analysis now.
""".strip()

    return prompt


async def _load_mef_workflow_from_prakasa(bimba_client: 'BimbaGraphQLClient') -> Optional[Dict[str, Any]]:
    """
    Load MINIMAL MEF properties from Prakasa coordinate #5-4.2.

    Agent's system prompt already contains full MEF capability via Prakasa.
    We only need version for validation - don't load massive workflow props.

    Args:
        bimba_client: BimbaGraphQLClient for coordinate queries

    Returns:
        Dict with minimal validation data or None if loading fails
    """
    try:
        # Query #5-4.2 for MINIMAL validation only
        result = await bimba_client.get_functional_properties(
            coordinate="#5-4.2",
            property_prefix="f_workflow_mefAnalysis_version"  # Load ONLY version for validation
        )

        if not result.get("success"):
            logger.error(f"❌ Failed to get functional properties from #5-4.2: {result.get('error')}")
            return None

        all_props = result.get("properties", {})
        version = all_props.get("f_workflow_mefAnalysis_version", "1.0.0")

        if not version:
            logger.warning("⚠️ No MEF workflow version found in #5-4.2")
            return None

        logger.info(f"📦 Validated MEF workflow from Prakasa (version {version})")

        return {"version": version}

    except Exception as e:
        logger.error(f"❌ Error loading MEF workflow from Prakasa: {e}", exc_info=True)
        return None


def _build_lightweight_mef_prompt(community_data: Dict[str, Any]) -> str:
    """
    Build lightweight MEF analysis prompt (agent has MEF capability in system prompt already).

    Agent's system prompt from Prakasa #5-4.2 already contains full MEF workflow.
    This is just the user message with community data.

    Args:
        community_data: Community data from Neo4j

    Returns:
        Lightweight prompt with community context only
    """
    words = community_data.get("words", [])
    pie_root = community_data.get("pie_root", "Unknown")
    semantic_pattern = community_data.get("semantic_pattern", "")
    quaternal_type = community_data.get("quaternal_type", "UNKNOWN")
    suggestion_resonance = community_data.get("suggestion_resonance")

    # LIGHTWEIGHT: Agent already knows MEF from system prompt
    prompt = f"""Analyze this etymology community using your MEF capability:

**Community:** {community_data.get('name', 'Unknown')}
**Words:** {', '.join(words) if words else 'None'}
**PIE Root:** {pie_root}
**Semantic Pattern:** {semantic_pattern}
**Quaternal Type:** {quaternal_type}
{f"**Suggested Resonance:** {suggestion_resonance}" if suggestion_resonance else ""}

Apply 2-3 MEF lenses (choose most relevant for this etymology).

**Tool Usage Strategy:**
Use `semantic_coordinate_discovery_tool` with VARYING alpha values (3 calls total):
1. alpha=0.3 → Lexical/structural resonance (word forms, phonetic patterns)
2. alpha=0.6 → Balanced semantic+lexical (default)
3. alpha=0.9 → Pure semantic resonance (conceptual meaning)

Discover 3-7 Bimba coordinate resonances across these alpha ranges.

Provide detailed reasoning - explain HOW the etymology resonates with each coordinate through the lens perspective.

Return ONLY raw JSON (no markdown, no code blocks):
{{
    "reasoning_summary": "2-3 sentences explaining your MEF analysis approach and key insights",
    "bimba_resonances": [
        {{
            "coordinate": "#X-Y",
            "resonance_type": "lens_name",
            "resonance_strength": 0.0-1.0,
            "description": "2-3 sentences explaining WHY this coordinate resonates through the MEF lens",
            "detected_via_lens": "lens_name",
            "detected_via_tool": "tool_name",
            "mef_archetypal": {{"key_insight": "archetypal pattern if applicable"}},
            "mef_causal": {{"key_insight": "causal pattern if applicable"}},
            "mef_logical": {{"key_insight": "logical pattern if applicable"}},
            "mef_processual": {{"key_insight": "processual pattern if applicable"}},
            "mef_meta_epistemic": {{"key_insight": "meta-epistemic pattern if applicable"}},
            "mef_divine_scalar": {{"key_insight": "divine-scalar pattern if applicable"}}
        }}
    ]
}}

Include lens insight objects ONLY for lenses you actually applied. Set others to null.""".strip()

    return prompt


async def store_bimba_resonance(
    community_id: str,
    resonance: Dict[str, Any],
    mef_analysis: Dict[str, Any],
    deepseek_reasoning: str,
    service: 'GraphitiService',
    etymology_session_id: Optional[str] = None
) -> bool:
    """
    Store a single BimbaResonance node with EA+Episodic labels.

    Creates BimbaResonance node and relationships:
    - (community)-[:RESONATES_WITH]->(resonance)-[:TARGETS]->(coord)

    CRITICAL: BimbaResonance nodes MUST have BOTH :EA and :Episodic labels.

    Args:
        community_id: Etymology community UUID
        resonance: Resonance dict from MEF analysis
        mef_analysis: Full MEF analysis dict (for reasoning summary)
        deepseek_reasoning: DeepSeek reasoning chain
        service: GraphitiService instance
        etymology_session_id: Etymology session UUID for session queries

    Returns:
        True if storage successful, False otherwise
    """
    try:
        resonance_id = str(uuid.uuid4())
        coordinate = resonance.get("coordinate")

        if not coordinate:
            logger.error("❌ Resonance missing coordinate field")
            return False

        # Serialize MEF lens insights as JSON strings
        mef_archetypal = json.dumps(resonance.get("mef_archetypal")) if resonance.get("mef_archetypal") else None
        mef_causal = json.dumps(resonance.get("mef_causal")) if resonance.get("mef_causal") else None
        mef_logical = json.dumps(resonance.get("mef_logical")) if resonance.get("mef_logical") else None
        mef_processual = json.dumps(resonance.get("mef_processual")) if resonance.get("mef_processual") else None
        mef_meta_epistemic = json.dumps(resonance.get("mef_meta_epistemic")) if resonance.get("mef_meta_epistemic") else None
        mef_divine_scalar = json.dumps(resonance.get("mef_divine_scalar")) if resonance.get("mef_divine_scalar") else None

        # Create BimbaResonance node with EA+Episodic labels (CRITICAL)
        store_query = """
        MATCH (community:Entity:EA:Community {uuid: $community_id})
        MATCH (coord:BimbaNode {bimbaCoordinate: $coordinate})

        CREATE (resonance:BimbaResonance:EA:Episodic {
            uuid: $resonance_id,
            resonance_type: $resonance_type,
            resonance_strength: $resonance_strength,
            description: $description,
            detected_via_lens: $detected_via_lens,
            detected_via_tool: $detected_via_tool,
            reasoning_summary: $reasoning_summary,
            deepseek_reasoning_chain: $deepseek_reasoning_chain,
            etymology_session_id: $etymology_session_id,
            mef_archetypal: $mef_archetypal,
            mef_causal: $mef_causal,
            mef_logical: $mef_logical,
            mef_processual: $mef_processual,
            mef_meta_epistemic: $mef_meta_epistemic,
            mef_divine_scalar: $mef_divine_scalar,
            detected_at: $detected_at,
            ns: 'episodic'
        })

        CREATE (community)-[:RESONATES_WITH]->(resonance)
        CREATE (resonance)-[:TARGETS]->(coord)

        RETURN resonance
        """

        params = {
            "community_id": community_id,
            "coordinate": coordinate,
            "resonance_id": resonance_id,
            "resonance_type": resonance.get("resonance_type", "unknown"),
            "resonance_strength": float(resonance.get("resonance_strength", 0.5)),
            "description": resonance.get("description", ""),
            "detected_via_lens": resonance.get("detected_via_lens", ""),
            "detected_via_tool": resonance.get("detected_via_tool", ""),
            "reasoning_summary": mef_analysis.get("reasoning_summary", ""),
            "deepseek_reasoning_chain": deepseek_reasoning,
            "etymology_session_id": etymology_session_id,
            "mef_archetypal": mef_archetypal,
            "mef_causal": mef_causal,
            "mef_logical": mef_logical,
            "mef_processual": mef_processual,
            "mef_meta_epistemic": mef_meta_epistemic,
            "mef_divine_scalar": mef_divine_scalar,
            "detected_at": datetime.now(timezone.utc).isoformat()
        }

        service.neo4j_client.execute_query(store_query, params)

        logger.info(
            f"✅ Stored BimbaResonance {resonance_id}: "
            f"{coordinate} (type={params['resonance_type']}, strength={params['resonance_strength']})"
        )

        return True

    except Exception as e:
        logger.error(f"❌ Failed to store BimbaResonance for {coordinate}: {e}", exc_info=True)
        return False


async def clear_existing_resonances(
    community_id: str,
    service: 'GraphitiService'
) -> int:
    """
    Clear existing BimbaResonance nodes for re-analysis workflow.

    Deletes all BimbaResonance nodes linked to the specified community.

    Args:
        community_id: Etymology community UUID
        service: GraphitiService instance

    Returns:
        Number of resonances deleted
    """
    try:
        clear_query = """
        MATCH (community:Entity:EA:Community {uuid: $community_id})
             -[:RESONATES_WITH]->(resonance:BimbaResonance:EA:Episodic)
        DETACH DELETE resonance
        RETURN count(resonance) as deleted
        """

        records, _, _ = service.neo4j_client.execute_query(
            clear_query,
            {"community_id": community_id}
        )

        deleted_count = records[0]["deleted"] if records else 0

        logger.info(f"🧹 Cleared {deleted_count} existing resonances for community {community_id}")

        return deleted_count

    except Exception as e:
        logger.error(f"❌ Failed to clear resonances for {community_id}: {e}")
        return 0


async def create_mef_constraints_and_indexes(neo4j_client) -> None:
    """
    Create Neo4j constraints and indexes for BimbaResonance nodes.

    Creates:
    - Unique constraint on BimbaResonance.uuid
    - Index on resonance_strength for strength-based queries
    - Index on resonance_type for type filtering
    - Index on etymology_session_id for session queries

    Args:
        neo4j_client: Neo4jClient instance

    Raises:
        Exception: If constraint/index creation fails
    """
    try:
        logger.info("📐 Creating MEF constraints and indexes...")

        # Unique constraint on uuid
        constraint_query = """
        CREATE CONSTRAINT bimba_resonance_uuid_unique IF NOT EXISTS
        FOR (r:BimbaResonance) REQUIRE r.uuid IS UNIQUE
        """
        neo4j_client.execute_query(constraint_query, {})
        logger.info("✅ Created unique constraint on BimbaResonance.uuid")

        # Index on resonance_strength
        strength_index_query = """
        CREATE INDEX bimba_resonance_strength_idx IF NOT EXISTS
        FOR (r:BimbaResonance) ON (r.resonance_strength)
        """
        neo4j_client.execute_query(strength_index_query, {})
        logger.info("✅ Created index on BimbaResonance.resonance_strength")

        # Index on resonance_type
        type_index_query = """
        CREATE INDEX bimba_resonance_type_idx IF NOT EXISTS
        FOR (r:BimbaResonance) ON (r.resonance_type)
        """
        neo4j_client.execute_query(type_index_query, {})
        logger.info("✅ Created index on BimbaResonance.resonance_type")

        # Index on etymology_session_id
        session_index_query = """
        CREATE INDEX bimba_resonance_session_idx IF NOT EXISTS
        FOR (r:BimbaResonance) ON (r.etymology_session_id)
        """
        neo4j_client.execute_query(session_index_query, {})
        logger.info("✅ Created index on BimbaResonance.etymology_session_id")

        logger.info("🎉 MEF constraints and indexes created successfully")

    except Exception as e:
        logger.error(f"❌ Failed to create MEF constraints/indexes: {e}")
        raise
