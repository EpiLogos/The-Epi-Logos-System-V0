# Caching vs Context Loading Strategy

**Critical Distinction**: What we CACHE vs what we put in CONTEXT

---

## Current Caching Architecture

### PrakasaCache (Redis-based)
**Location**: `/agentic/agents/prakasa_cache.py`
**Current Usage**: Caches composed identity prompts by agent coordinate

**Existing Pattern**:
```python
# Cache key: agent_coordinate (e.g., "#5-4.5")
# Cache value: Full composed Layer 1 identity prompt
await self.cache.set(agent_coordinate, identity_prompt)
cached = await self.cache.get(agent_coordinate)
```

**Invalidation**: Manual via `invalidate(agent_coordinate)`

---

## Proposed Multi-Level Caching Strategy

### Level 1: Static Universal Properties (LONG-LIVED CACHE)
**What**: Properties that NEVER or RARELY change
**Cache Separately**: Each as individual cache entry

```python
# Cache keys and TTL
cache_keys = {
    "ql_foundation": {
        "key": "prakasa:ql_foundation",
        "source": "#1-4.f_agent_prompt",
        "ttl": None,  # Infinite (manual invalidation only)
        "reason": "QL foundation is philosophical bedrock, changes extremely rare"
    },
    "system_prompt": {
        "key": "prakasa:system_prompt",
        "source": "#5-4.f_system_prompt",
        "ttl": None,  # Infinite
        "reason": "System prompt is agent-agnostic operational grounding, changes rare"
    },
    "project_context": {
        "key": "prakasa:project_context",
        "source": "# root general properties",
        "ttl": 3600,  # 1 hour (project evolves slowly)
        "reason": "Root project context changes occasionally as system develops"
    }
}
```

### Level 2: Agent-Specific Identity (MEDIUM-LIVED CACHE)
**What**: Agent identity properties (including character)
**Cache Per Agent**: One entry per agent coordinate

```python
# Cache key pattern: prakasa:agent_identity:{coordinate}
cache_keys = {
    "agent_identity": {
        "key_pattern": "prakasa:agent_identity:{agent_coordinate}",
        "sources": [
            "{agent_coordinate}.f_agent_prompt",
            "{agent_coordinate}.f_{subsystem}_character"  # Optional
        ],
        "ttl": 1800,  # 30 minutes
        "reason": "Agent identities refine during development but stabilize"
    }
}
```

### Level 3: Workflow Components (SHORT-LIVED CACHE)
**What**: Workflow/capability/protocol details
**Cache Per Workflow**: Granular caching of workflow components

```python
# Cache key patterns
cache_keys = {
    "workflow_header": {
        "key_pattern": "prakasa:workflow:{workflow_name}:header",
        "sources": ["f_workflow_{name}_version", "f_workflow_{name}_description", ...],
        "ttl": 900,  # 15 minutes
        "reason": "Workflows evolve during development"
    },
    "capability": {
        "key_pattern": "prakasa:capability:{cap_name}",
        "sources": ["f_capability_{name}_*"],
        "ttl": 1800,  # 30 minutes
        "reason": "Capabilities stabilize over time"
    },
    "protocol": {
        "key_pattern": "prakasa:protocol:{prot_name}",
        "sources": ["f_protocol_{name}_*"],
        "ttl": 1800,  # 30 minutes
        "reason": "Protocols stabilize over time"
    },
    "workflow_stage": {
        "key_pattern": "prakasa:workflow:{workflow_name}:stage:{stage_num}",
        "sources": ["f_workflow_{name}_stage_{N}_*"],
        "ttl": 900,  # 15 minutes
        "reason": "Stage guidance refines during workflow development"
    }
}
```

### Level 4: Composed Layers (SESSION-SCOPED CACHE)
**What**: Fully composed Layer 1 and Layer 2 prompts
**Cache Duration**: Session lifetime or manual invalidation

```python
cache_keys = {
    "composed_layer_1": {
        "key_pattern": "prakasa:composed:layer1:{agent_coordinate}",
        "assembled_from": ["ql_foundation", "project_context", "system_prompt", "agent_identity"],
        "ttl": None,  # Manual invalidation when components change
        "reason": "Layer 1 is static per agent, recompose only when source components invalidated"
    },
    "composed_layer_2": {
        "key_pattern": "prakasa:composed:layer2:{agent_coordinate}:{workflow_name}:{stage}",
        "assembled_from": ["workflow_header", "capabilities", "protocols", "workflow_stage"],
        "ttl": 600,  # 10 minutes (workflow state can change)
        "reason": "Layer 2 is workflow/stage-specific, may need refresh as workflow progresses"
    }
}
```

---

## Cache vs Context Strategy

### The Key Insight

**CACHE** = Performance optimization (avoid repeated Bimba queries)
**CONTEXT** = What agent actually receives in prompt

**They're RELATED but DIFFERENT**:

```python
# Example: QL Foundation

# CACHED (in Redis)
ql_foundation_full = """
[Full 2000-char QL Foundation prompt from #1-4.f_agent_prompt]
Including all 6 positions, mod6 arithmetic, Möbius circulation...
"""
await cache.set("prakasa:ql_foundation", ql_foundation_full)

# LOADED INTO CONTEXT (in Layer 1a)
# Option A: ALWAYS include (current proposal)
layer_1a = ql_foundation_full  # Full ~2000 tokens

# Option B: CONDITIONAL include (smarter)
if agent_needs_ql_depth:
    layer_1a = ql_foundation_full
else:
    layer_1a = "See cached QL foundation via system knowledge"  # Reference only
```

### Current Proposal: Cache Everything, Load Selectively

**Cache Strategy** (helpers do this):
```python
async def get_ql_foundation(self) -> str:
    # Check cache first
    cached = await self.cache.get("prakasa:ql_foundation")
    if cached:
        return cached

    # Not cached - fetch from Bimba
    result = await self.bimba_client.get_node_details_complete("#1-4", ...)
    ql_prompt = result.get("allProperties", {}).get("f_agent_prompt", "")

    # Cache it
    await self.cache.set("prakasa:ql_foundation", ql_prompt)
    return ql_prompt
```

**Context Strategy** (composition methods do this):
```python
async def compose_identity_layers(self, agent_coordinate: str) -> str:
    layers = []

    # Get from cache (fast) - but this returns FULL content
    ql = await self.get_ql_foundation()

    # DECISION POINT: Do we ALWAYS include in context?
    if ql:
        layers.append(f"# Layer 1a: QL Foundation\n\n{ql}")
        # ^ This puts ~2000 tokens in EVERY agent system_prompt

    # Alternative: CONDITIONAL inclusion
    # if agent_needs_deep_ql:  # How to determine?
    #     layers.append(f"# Layer 1a: QL Foundation\n\n{ql}")
    # else:
    #     layers.append(f"# Layer 1a: QL Foundation\n\n[Available via system knowledge]")
```

---

## Smarter Approach: Tiered Context Loading

### Concept: Cache FULL, Load SUMMARY or FULL based on need

```python
# Cache structure: Store BOTH full and summary versions
cache_entry = {
    "full": "[2000-char full QL foundation]",
    "summary": "You operate via Quaternal Logic (6-position 0-5 circulation). Full details available when needed.",
    "version": "1.0.0"
}

await self.cache.set("prakasa:ql_foundation", json.dumps(cache_entry))
```

**Then context loading becomes smart**:
```python
async def compose_identity_layers(
    self,
    agent_coordinate: str,
    depth: str = "standard"  # NEW parameter
) -> str:
    layers = []

    ql_cache = await self.cache.get("prakasa:ql_foundation")
    ql_data = json.loads(ql_cache) if ql_cache else {}

    if depth == "full":
        # Load everything (for specialized agents, development)
        ql = ql_data.get("full", "")
    elif depth == "summary":
        # Load summaries only (for general agents)
        ql = ql_data.get("summary", "")
    else:  # "standard"
        # Intelligent default (maybe full for first message, summary thereafter?)
        ql = ql_data.get("full", "")

    if ql:
        layers.append(f"# Layer 1a: QL Foundation\n\n{ql}")
```

---

## Recommendation: Hybrid Strategy

### Phase 1: Current Implementation (SIMPLE)
**Cache**: Full content only
**Context**: Always load full content
**Benefit**: Simple, works, proves architecture
**Cost**: Higher token usage (~12000 tokens)

```python
# helpers cache FULL content
ql_foundation = await self.get_ql_foundation()  # Returns full 2000 chars
system_prompt = await self.get_system_prompt()  # Returns full 3000 chars

# composition includes FULL content
layers.append(f"# Layer 1a: QL Foundation\n\n{ql_foundation}")  # All 2000 tokens
layers.append(f"# Layer 1c: System Prompt\n\n{system_prompt}")  # All 3000 tokens
```

### Phase 2: Optimization (SMART)
**Cache**: Full + summary versions
**Context**: Conditional loading based on context depth
**Benefit**: Optimized token usage (~7000-12000 tokens based on need)
**Cost**: More complex logic

```python
# helpers return structured data
ql_data = await self.get_ql_foundation()  # Returns {full, summary, version}
system_data = await self.get_system_prompt()  # Returns {full, summary, version}

# composition chooses version
depth = self._determine_context_depth(agent_coordinate, workflow_name)
ql = ql_data["full"] if depth == "full" else ql_data["summary"]
system = system_data["full"] if depth == "full" else system_data["summary"]
```

---

## Answering Your Question Directly

> "So would these helpers keep the data in cache but then only give to the agent in certain contexts?"

**YES, but in two ways**:

### Way 1: Cache Layer (What Helpers Do)
Helpers fetch from Bimba once, cache in Redis, return from cache on subsequent calls.
**This is pure performance optimization** - avoiding repeated Bimba GraphQL queries.

```python
# First call: Fetch from Bimba + cache
ql = await self.get_ql_foundation()  # Hits Bimba, stores in Redis

# Second call: Return from cache
ql = await self.get_ql_foundation()  # Hits Redis only, fast
```

### Way 2: Context Selection Layer (What Composition Methods Do)
Composition methods decide WHICH cached content to include in context.
**This is token budget optimization** - including only what's needed.

```python
# Helper returns FULL content from cache
capabilities = await self._load_capabilities(agent_coordinate, ["logos_cycle", "etymological_archaeology"])

# Composition SELECTIVELY includes based on workflow
if workflow_name == "etymological_archaeology":
    # Include FULL logos_cycle and etymological_archaeology
    for cap_name, cap_props in capabilities.items():
        layer_2.append(format_capability(cap_name, cap_props))
else:
    # Don't include capabilities at all (not referenced by workflow)
    pass
```

---

## Proposed Enhancement: Smart Caching Methods

### Enhanced Helper Signature
```python
async def get_ql_foundation(
    self,
    version: str = "full"  # "full" | "summary" | "reference"
) -> str:
    """
    Load QL Foundation with version control.

    Args:
        version:
            - "full": Complete QL foundation (~2000 tokens)
            - "summary": Brief QL overview (~200 tokens)
            - "reference": Pointer only (~50 tokens)
    """
    cache_key = "prakasa:ql_foundation"
    cached = await self.cache.get(cache_key)

    if cached:
        data = json.loads(cached)
        return data.get(version, data.get("full"))

    # Fetch and structure
    result = await self.bimba_client.get_node_details_complete("#1-4", ...)
    full_content = result.get("allProperties", {}).get("f_agent_prompt", "")

    # Generate summary (could be stored in Bimba too)
    summary_content = self._generate_ql_summary(full_content)
    reference_content = "QL Foundation available via system knowledge"

    data = {
        "full": full_content,
        "summary": summary_content,
        "reference": reference_content,
        "version": "1.0.0"
    }

    await self.cache.set(cache_key, json.dumps(data))
    return data.get(version, full_content)
```

### Enhanced Composition
```python
async def compose_identity_layers(
    self,
    agent_coordinate: str,
    depth: str = "standard"  # "minimal" | "standard" | "full"
) -> str:
    layers = []

    # Map depth to version selection
    version_map = {
        "minimal": "reference",   # References only
        "standard": "summary",    # Summaries for universal, full for agent-specific
        "full": "full"           # Everything full
    }

    # Layer 1a: QL Foundation
    ql_version = version_map.get(depth, "summary")
    ql = await self.get_ql_foundation(version=ql_version)
    if ql:
        layers.append(f"# Layer 1a: QL Foundation\n\n{ql}")

    # Layer 1c: System Prompt
    sys_version = version_map.get(depth, "summary")
    system = await self.get_system_prompt(version=sys_version)
    if system:
        layers.append(f"# Layer 1c: System Prompt\n\n{system}")

    # Layer 1d: Agent Identity (ALWAYS full - agent-specific)
    agent_id = await self.agent_nodes.get_agent_prompt(agent_coordinate)
    # ...
```

---

## Implementation Recommendation

**For Sprint 4**: Use **Simple Approach**
- Cache full content
- Always load full content into context
- Prove the architecture works
- Get etymology archaeology working end-to-end

**For Sprint 5+**: Add **Smart Context Loading**
- Enhance cache to store full + summary
- Add `depth` parameter to composition methods
- Optimize token budget based on workflow needs
- Measure token usage improvements

**Why This Order**:
1. **Simple first** = Ship faster, validate architecture
2. **Optimize later** = Data-driven (measure actual token usage)
3. **Avoid premature optimization** = Don't add complexity before knowing if needed

---

## Summary

**Your Question**: "Would helpers keep data in cache but only give to agent in certain contexts?"

**Answer**:
- **Helpers cache**: YES - fetch once from Bimba, cache in Redis, return from cache
- **Context selection**: FUTURE - right now load everything cached, later can add selective loading

**Current Phase 4 Approach**:
- Cache FULL content (performance)
- Load FULL content into context (simplicity)
- Total budget: ~12,000 tokens (manageable)

**Future Optimization**:
- Cache FULL + SUMMARY (flexibility)
- Load SELECTIVELY based on depth (token optimization)
- Total budget: ~7,000-12,000 tokens (adaptive)
