# Prakāśa Layered Architecture Refactor Plan

**Story Context**: 02.24 Multi-Agent Architecture Foundation
**Date**: 2025-10-05
**Status**: Planning Complete - Ready for Implementation

---

## Architectural Clarifications from Agent Node System Prompt Protocol

### Critical Corrections to Initial Plan

1. **Agent Node Coordinates**: `#5-4.N` (not `#5-4-N`)
   - Use `.` separator after `4`: `#5-4.0`, `#5-4.1`, ..., `#5-4.5`
   - Architecturally correct branch within `#5-4` (agentic subsystem)

2. **Preserve ASCP Prakāśa Language**
   - Keep `PrakasaInitializer` naming (align with ASCP protocol)
   - All three layers are "Prakāśa (Illumination)" - getting into role
   - Rename `SystemPromptManager` → `PrakasaManager`

3. **Workflow-Agnostic Foundation**
   - Default initialization does NOT load workflow prompts
   - Workflows are **lazy-loaded** only when explicitly engaged
   - Base identity prompt is workflow-neutral
   - `f_workflow_prompts` stored on agent node but not accessed during basic init

---

## The Three Layers of Prakāśa

### Layer 1: Identity Prakāśa (Who Am I?)
**Source**: Agent node `f_system_prompt` property
**Generated From**:
- Root node `#` → `{subsystem}_*` project framings
- Subsystem node `#{N}` → core identity properties
- Agent node `#5-4.{N}` → `f_*` capabilities (summary only)

**Cached**: Redis with manual invalidation
**Regenerated**: Only on significant property changes
**Always Present**: Yes (required for agent initialization)

### Layer 2: Workflow Prakāśa (What Mode Am I In?)
**Source**: Agent node `f_workflow_prompts.{workflow_name}` property
**Loaded**: Only when workflow explicitly engaged
**Not Cached**: Dynamically composed per workflow invocation
**Always Present**: No (optional, workflow-specific)

### Layer 3: Context Prakāśa (What Am I Doing Right Now?)
**Source**: Runtime - current request, conversation history
**Generated**: Fresh on every request
**Not Cached**: Ephemeral, runtime-only
**Always Present**: Yes (required for meaningful response)

---

## Current Implementation Problems

### Problem 1: No Agent Node Layer
**Current**: Queries subsystem `#5` directly
**Issue**: No storage location for generated prompts
**Fix**: Create agent nodes `#5-4.0` through `#5-4.5`

### Problem 2: Dynamic Generation Every Request
**Current**: `PrakasaInitializer.initialize_agent_context()` queries Bimba on every init
**Issue**: Wasteful, no persistence
**Fix**: Query once, store in `f_system_prompt`, cache in Redis

### Problem 3: TTL-Based Cache Invalidation
**Current**: Redis cache with 1-hour TTL
**Issue**: Regenerates even when properties unchanged
**Fix**: Manual invalidation based on property change detection

### Problem 4: Monolithic Prompt
**Current**: Single prompt combining everything
**Issue**: No separation of identity vs. workflow concerns
**Fix**: Layered architecture with optional workflow layer

### Problem 5: Missing Change Detection
**Current**: No system to detect when properties change
**Issue**: Can't invalidate cache intelligently
**Fix**: Property change listener with significance detection

---

## Refactored Architecture

### Component 1: PrakasaManager (Core)

```python
class PrakasaManager:
    """
    Manages Prakāśa (Illumination) phase with three-layer architecture.

    ASCP Phase 1 (Prakāśa): Agent self-contextualization through inquiry.

    Layer 1: Identity Prakāśa (base system prompt)
    Layer 2: Workflow Prakāśa (optional, workflow-specific)
    Layer 3: Context Prakāśa (runtime, ephemeral)
    """

    def __init__(
        self,
        bimba_client: BimbaGraphQLClient,
        redis_client: Redis,
        agent_node_manager: AgentNodeManager
    ):
        self.bimba_client = bimba_client
        self.cache = PrakasaCache(redis_client)
        self.agent_nodes = agent_node_manager

    async def get_identity_prakasa(
        self,
        agent_coordinate: str,  # "#5-4.5"
        force_regenerate: bool = False
    ) -> str:
        """
        Prakāśa Layer 1: Identity illumination.

        Three-tier check:
        1. Redis cache (performance)
        2. Agent node f_system_prompt (source of truth)
        3. Generate from subsystem properties (fallback)

        Returns: Base identity system prompt
        """
        if not force_regenerate:
            # Check cache
            cached = await self.cache.get(agent_coordinate)
            if cached:
                return cached

            # Check agent node storage
            stored = await self.agent_nodes.get_system_prompt(agent_coordinate)
            if stored and self._is_still_valid(stored):
                # Update cache
                await self.cache.set(agent_coordinate, stored['content'])
                return stored['content']

        # Generate new
        return await self.generate_identity_prakasa(agent_coordinate)

    async def generate_identity_prakasa(
        self,
        agent_coordinate: str
    ) -> str:
        """
        Generate fresh identity prompt by querying Bimba.

        ASCP Two-Phase Query:
        1. Root node (#) for {subsystem}_* project framings
        2. Subsystem node (#N) for core identity properties
        3. Agent node (#N-4.N) for f_* capabilities (summary)

        Saves to agent node + Redis cache.
        """
        subsystem = self._extract_subsystem(agent_coordinate)
        subsystem_name = self._get_subsystem_name(subsystem)

        # Phase 1: Root node project framings
        root_data = await self.bimba_client.get_node_details_complete("#")
        project_framings = self._filter_subsystem_framings(
            root_data['allProperties'],
            subsystem_name
        )

        # Phase 2: Subsystem identity
        subsystem_data = await self.bimba_client.get_node_details_complete(f"#{subsystem}")
        identity = self._extract_identity_properties(subsystem_data)

        # Phase 3: Agent capabilities (summary only, not full f_* content)
        agent_data = await self.bimba_client.get_node_details_complete(agent_coordinate)
        capabilities = self._summarize_capabilities(agent_data)

        # Compose prompt
        prompt = self._compose_identity_prompt(
            subsystem=subsystem,
            subsystem_name=subsystem_name,
            project_framings=project_framings,
            identity=identity,
            capabilities=capabilities
        )

        # Save to agent node
        await self.agent_nodes.save_system_prompt(
            agent_coordinate,
            prompt_content=prompt,
            metadata={
                'generated_from': [
                    {'source': '#', 'properties': list(project_framings.keys())},
                    {'source': f'#{subsystem}', 'properties': list(identity.keys())},
                    {'source': agent_coordinate, 'properties': list(capabilities.keys())}
                ],
                'last_updated': datetime.now(timezone.utc).isoformat(),
                'version': '1.0.0'
            }
        )

        # Cache in Redis
        await self.cache.set(agent_coordinate, prompt)

        return prompt

    async def engage_workflow_prakasa(
        self,
        agent_coordinate: str,
        workflow_name: str,
        **workflow_params
    ) -> str:
        """
        Prakāśa Layer 2: Workflow illumination (OPTIONAL).

        Loads workflow-specific prompt template from agent node
        and populates with runtime parameters.

        Only called when workflow explicitly engaged.
        """
        # Get workflow template from agent node
        workflow_prompts = await self.agent_nodes.get_workflow_prompts(agent_coordinate)

        if workflow_name not in workflow_prompts:
            # Workflow not defined - return empty (graceful degradation)
            logger.warning(f"Workflow '{workflow_name}' not defined for {agent_coordinate}")
            return ""

        template = workflow_prompts[workflow_name]['template']

        # Populate template with params
        return template.format(**workflow_params)

    def build_context_prakasa(
        self,
        current_request: dict,
        conversation_history: Optional[list] = None
    ) -> str:
        """
        Prakāśa Layer 3: Runtime context illumination.

        Always fresh, never cached.
        Minimal - just what's needed for current request.
        """
        context = f"""
## Current Request Context

**User Query**: {current_request.get('message', 'N/A')}
**Session ID**: {current_request.get('session_id', 'N/A')}
**Timestamp**: {datetime.now(timezone.utc).isoformat()}
"""

        if conversation_history:
            recent = conversation_history[-3:]  # Last 3 turns
            context += f"\n**Recent Context**: {len(recent)} recent exchanges\n"

        return context.strip()

    async def compose_full_prakasa(
        self,
        agent_coordinate: str,
        current_request: dict,
        workflow_name: Optional[str] = None,
        workflow_params: Optional[dict] = None,
        conversation_history: Optional[list] = None
    ) -> str:
        """
        Compose complete Prakāśa with 2 or 3 layers.

        Identity layer: Always present
        Workflow layer: Only if workflow_name provided
        Context layer: Always present
        """
        # Layer 1: Identity (cached/stored)
        identity = await self.get_identity_prakasa(agent_coordinate)

        # Layer 2: Workflow (optional)
        workflow = ""
        if workflow_name:
            workflow = await self.engage_workflow_prakasa(
                agent_coordinate,
                workflow_name,
                **(workflow_params or {})
            )

        # Layer 3: Context (runtime)
        context = self.build_context_prakasa(current_request, conversation_history)

        # Combine layers
        if workflow:
            return f"{identity}\n\n---\n\n{workflow}\n\n---\n\n{context}"
        else:
            return f"{identity}\n\n---\n\n{context}"

    async def invalidate_cache(
        self,
        agent_coordinate: str,
        reason: str
    ) -> None:
        """
        Invalidate Redis cache.

        Triggered by significant property changes.
        """
        await self.cache.invalidate(agent_coordinate)
        logger.info(f"Invalidated cache for {agent_coordinate}: {reason}")

    def detect_significant_change(
        self,
        node_coordinate: str,
        property_name: str,
        old_value: Any,
        new_value: Any
    ) -> bool:
        """
        Determine if property change requires prompt regeneration.

        Significant changes:
        - description modified by >20%
        - operationalEssence changed
        - keyPrinciples array modified
        - New f_* capability added
        - Project framing properties changed

        Not significant:
        - Timestamp updates
        - Minor typo fixes
        - Metadata updates
        """
        # Check property type
        significant_properties = {
            'description', 'operationalEssence', 'keyPrinciples',
            'coreNature', 'architecturalFunction', 'internalStructure'
        }

        if property_name in significant_properties:
            return True

        # Check for project framing changes
        if '_' in property_name:  # e.g., "epii_philosophical_foundation"
            return True

        # Check for f_* capability changes
        if property_name.startswith('f_'):
            return True

        return False

    def _extract_subsystem(self, agent_coordinate: str) -> int:
        """Extract subsystem number from agent coordinate."""
        # "#5-4.5" -> 5
        parts = agent_coordinate.strip('#').split('.')
        return int(parts[-1])

    def _get_subsystem_name(self, subsystem: int) -> str:
        """Map subsystem number to name."""
        names = {
            0: "anuttara", 1: "paramasiva", 2: "parashakti",
            3: "mahamaya", 4: "nara", 5: "epii"
        }
        return names.get(subsystem, f"agent_{subsystem}")
```

### Component 2: PrakasaCache

```python
class PrakasaCache:
    """
    Redis performance cache for identity prompts.

    NOTE: This is NOT the source of truth.
    Source of truth is f_system_prompt on agent node.

    No TTL - manual invalidation only.
    """

    def __init__(self, redis_client: Redis):
        self.redis = redis_client

    async def get(self, agent_coordinate: str) -> Optional[str]:
        """Get cached identity prompt."""
        key = self._cache_key(agent_coordinate)
        cached = self.redis.get(key)
        return cached.decode('utf-8') if cached else None

    async def set(self, agent_coordinate: str, prompt: str) -> bool:
        """Set cached identity prompt (no TTL)."""
        key = self._cache_key(agent_coordinate)
        self.redis.set(key, prompt)
        return True

    async def invalidate(self, agent_coordinate: str) -> bool:
        """Delete from cache."""
        key = self._cache_key(agent_coordinate)
        deleted = self.redis.delete(key)
        return deleted > 0

    def _cache_key(self, agent_coordinate: str) -> str:
        """Generate cache key."""
        # "#5-4.5" -> "prakasa:identity:#5-4.5"
        return f"prakasa:identity:{agent_coordinate}"
```

### Component 3: AgentNodeManager

```python
class AgentNodeManager:
    """
    Manages agent node lifecycle and properties.

    Agent nodes (#N-4.N) contain:
    - f_system_prompt (stored identity prompt)
    - f_workflow_prompts (workflow templates)
    - f_* capabilities
    """

    def __init__(self, bimba_client: BimbaGraphQLClient):
        self.bimba = bimba_client

    async def ensure_agent_node_exists(self, subsystem: int) -> str:
        """
        Create agent node if missing.

        Returns: agent_coordinate (#N-4.N)
        """
        agent_coord = f"#{subsystem}-4.{subsystem}"
        subsystem_names = {
            0: "Anuttara", 1: "Paramasiva", 2: "Parashakti",
            3: "Mahamaya", 4: "Nara", 5: "Epii"
        }

        # Check if exists
        result = await self.bimba.get_node_details_complete(agent_coord)
        if result.get('success'):
            return agent_coord

        # Create agent node
        await self.bimba.create_bimba_node({
            'coordinate': agent_coord,
            'name': f"{subsystem_names[subsystem]} Agent",
            'subsystem': subsystem,
            'description': f"Agent instance for {subsystem_names[subsystem].lower()} subsystem"
        })

        # Create relationship: subsystem MANIFESTS_AS agent
        await self.bimba.create_bimba_relationship(
            f"#{subsystem}",
            agent_coord,
            "MANIFESTS_AS"
        )

        return agent_coord

    async def get_system_prompt(
        self,
        agent_coordinate: str
    ) -> Optional[Dict[str, Any]]:
        """Get f_system_prompt from agent node."""
        result = await self.bimba.get_node_details_complete(agent_coordinate)

        if not result.get('success'):
            return None

        props = result.get('allProperties', {})

        if 'f_system_prompt' not in props:
            return None

        return props['f_system_prompt']

    async def save_system_prompt(
        self,
        agent_coordinate: str,
        prompt_content: str,
        metadata: dict
    ) -> bool:
        """Save f_system_prompt to agent node."""
        await self.bimba.update_bimba_node(
            agent_coordinate,
            f_system_prompt={
                'content': prompt_content,
                'metadata': metadata
            }
        )
        return True

    async def get_workflow_prompts(
        self,
        agent_coordinate: str
    ) -> Dict[str, Any]:
        """Get f_workflow_prompts from agent node."""
        result = await self.bimba.get_node_details_complete(agent_coordinate)

        if not result.get('success'):
            return {}

        props = result.get('allProperties', {})
        return props.get('f_workflow_prompts', {})
```

---

## Migration Strategy

### Phase 1: Graph Schema Migration

```python
async def create_agent_nodes():
    """Create all 6 agent nodes in #5-4 branch."""
    agent_node_manager = AgentNodeManager(bimba_client)

    for subsystem in range(6):
        agent_coord = await agent_node_manager.ensure_agent_node_exists(subsystem)
        logger.info(f"Created agent node: {agent_coord}")
```

### Phase 2: Code Refactoring

**Files to Modify:**
1. `agentic/agents/prakasa.py` - Refactor with new architecture
2. `agentic/agents/factory.py` - Update to use `#5-4.N` coordinates
3. `agentic/agents/constellation.py` - Update agent creation
4. `agentic/tests/unit/test_prakasa_green.py` - Rewrite tests

**New Files:**
1. `agentic/agents/agent_node_manager.py` - Agent node CRUD
2. `agentic/migrations/create_agent_nodes.py` - Graph migration

### Phase 3: Test Updates

**Test Structure:**
```
agentic/tests/unit/
├── test_prakasa_manager.py (was test_prakasa_green.py)
│   ├── TestIdentityPrakasa
│   ├── TestWorkflowPrakasa
│   ├── TestContextPrakasa
│   ├── TestLayeredComposition
│   └── TestCacheInvalidation
└── test_agent_node_manager.py
    ├── TestAgentNodeCreation
    ├── TestPromptStorage
    └── TestWorkflowPromptRetrieval
```

---

## Key Architectural Principles

### 1. Workflow Agnosticism
- Default initialization is workflow-neutral
- Workflows are opt-in, not opt-out
- `f_workflow_prompts` stored but not loaded unless needed

### 2. ASCP Alignment
- Preserve Prakāśa terminology (illumination/getting into role)
- Three layers all serve agent self-contextualization
- Aligns with contemplative cycle phases

### 3. Separation of Concerns
- Identity: Who am I? (persistent, cached)
- Workflow: What mode am I in? (optional, dynamic)
- Context: What am I doing now? (ephemeral, runtime)

### 4. Smart Invalidation
- No TTL-based expiration
- Event-driven: invalidate only on significant changes
- Source of truth in graph, cache for performance

### 5. Observable Persistence
- All prompts visible in graph
- Version-controlled via metadata
- Debuggable: can see exact prompt used

---

## Implementation Checklist

### Graph Layer
- [ ] Create migration script for agent nodes `#5-4.0` through `#5-4.5`
- [ ] Add `f_system_prompt` property structure to agent nodes
- [ ] Add `f_workflow_prompts` property structure (empty initially)
- [ ] Create `MANIFESTS_AS` relationships from subsystems to agents

### Code Layer
- [ ] Refactor `PrakasaInitializer` → `PrakasaManager` with layered architecture
- [ ] Create `PrakasaCache` (replace `BimbaCacheManager`)
- [ ] Create `AgentNodeManager` for agent node CRUD
- [ ] Update `AgentFactory` to use `#5-4.N` coordinates
- [ ] Update constellation to reference agent nodes correctly

### Testing Layer
- [ ] Rewrite Prakāśa tests for layered architecture
- [ ] Add tests for agent node manager
- [ ] Add tests for workflow engagement (lazy loading)
- [ ] Add tests for change detection and invalidation
- [ ] Verify all 73 tests still pass after refactor

### Documentation Layer
- [ ] Update Story 02.24 with layered architecture details
- [ ] Document agent node structure in ASCP protocol
- [ ] Update architecture diagrams with `#5-4.N` nodes

---

## Success Criteria

✅ Agent nodes `#5-4.0` through `#5-4.5` exist in graph
✅ Identity prompts generated once and cached until invalidation
✅ Workflow prompts lazy-loaded only when engaged
✅ No TTL-based cache expiration
✅ Change detection triggers cache invalidation
✅ All tests pass (73/73)
✅ ASCP Prakāśa language preserved
✅ Workflow-agnostic default initialization

---

## Handoff Notes

This refactoring transforms Prakāśa from "query every time" to "store once, cache smart, layer as needed."

**Core Philosophy**: Agents illuminate their identity through inquiry (Prakāśa Layer 1), optionally illuminate workflow mode (Prakāśa Layer 2), and always illuminate current context (Prakāśa Layer 3).

**Technical Shift**: From dynamic generation to persistent storage with intelligent invalidation.

**ASCP Alignment**: Maintains contemplative cycle framing while enabling architectural observability and efficiency.
