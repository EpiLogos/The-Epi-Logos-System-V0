# Prakāśa System Verification Guide

**Date**: 2025-10-05
**Purpose**: Complete guide for testing and verifying the multi-agent Prakāśa architecture

---

## ✅ Implementation Verification: Real vs Mock

### Production-Ready Components

**All implementations are REAL, not demo code**:

1. **`PrakasaManager`** (`agentic/agents/prakasa.py`)
   - ✅ Real Bimba GraphQL queries via `BimbaGraphQLClient`
   - ✅ Real Redis operations via `RedisClient`
   - ✅ Real agent node CRUD via `AgentNodeManager`
   - ✅ Three-tier caching logic fully implemented

2. **`AgentNodeManager`** (`agentic/agents/agent_node_manager.py`)
   - ✅ Real Bimba MCP tool integration
   - ✅ Real coordinate validation (#N-4.N pattern)
   - ✅ Real node creation with MANIFESTS_AS relationships
   - ✅ Real f_system_prompt storage in Neo4j

3. **Agent Creators** (`agentic/agents/constellation.py`)
   - ✅ Real async Prakāśa manager initialization
   - ✅ Real identity prompt retrieval from agent nodes
   - ✅ Real Pydantic AI Agent instantiation with `system_prompt` parameter
   - ✅ All 6 agents (Anuttara → Epii) fully functional

4. **Delegation System** (`agentic/agents/delegation.py`)
   - ✅ Real agent factory integration
   - ✅ Real async agent creation on-demand
   - ✅ Real Pydantic AI Pattern 1 (Agent Delegation)
   - ✅ Real context package propagation

### What IS Mocked (Unit Tests Only)

The **only** mocked components are in **unit tests**:
- Mock Bimba/Redis clients for isolated testing
- Mock agent node responses for deterministic tests
- **Production code has ZERO mocks**

---

## 🚀 How to Run the Agentic Layer

### Step 1: Start the Agentic Service

```bash
# From project root
npm run dev:agentic

# Or manually:
cd agentic
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

**Expected output**:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001
```

### Step 2: Verify Service Health

```bash
curl http://localhost:8001/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-05T12:00:00Z"
}
```

---

## 🖥️ How to Run the CLI Tool

### Basic CLI Launch

```bash
# From agentic directory
python3 -m cli.chat_cli chat

# Or with specific model
python3 -m cli.chat_cli chat --model "groq:moonshotai/kimi-k2-instruct"
```

### Enable Debug Mode for Delegation

**Within the CLI session**, type:
```
/debug-delegation
```

**Output**:
```
Agent delegation observability enabled.
Delegation events will be displayed in real-time.
```

**What this shows**:
- Target agent selection decisions
- Agent creation events
- Context package assembly
- Delegation handoff details
- Response streaming from delegated agents

### CLI Commands Reference

```
/help                           - Show all commands
/debug-delegation               - Toggle delegation observability
/persona <key>                  - Switch persona
/tools                          - List available CAG tools
/clear                          - Clear conversation context
/save [path]                    - Save transcript
/timeout <seconds>              - Set streaming timeout
```

---

## 🧪 Verifying Prakāśa Process with Epii

### Test Scenario 1: Basic Epii Delegation

**In CLI**:
```
/debug-delegation
> Synthesize insights from the conversation about quantum mechanics
```

**Expected Flow**:

1. **Router Decision** (debug output):
   ```
   🎯 Request classified as: synthesis
   ✓ Delegating to: Epii (subsystem #5)
   ```

2. **Agent Creation** (if first time):
   ```
   📝 Creating Epii agent (#{5-4.5})
   ⏳ Initializing Prakāśa...
   ```

3. **Prakāśa Three-Tier Check**:
   ```
   [DEBUG] Checking Redis cache for #5-4.5... MISS
   [DEBUG] Checking agent node f_system_prompt... MISS
   [DEBUG] Generating fresh identity Prakāśa...
   [DEBUG] Querying root node (#) for epii_* framings...
   [DEBUG] Querying subsystem node (#5) for identity...
   [INFO] Generated identity prompt (1247 chars)
   [INFO] Saved to agent node #5-4.5
   [INFO] Cached in Redis
   ```

4. **Agent Instantiation**:
   ```
   ✓ Epii agent created with identity Prakāśa
   ✓ Agent coordinate: #5-4.5
   ✓ System prompt: Layer 1 (Identity) only
   ✓ CAG tools: 22 tools registered
   ```

5. **Delegation Execution**:
   ```
   🔄 Delegating to Epii...
   📦 Context package created
   ⚡ Streaming response...
   ```

### Test Scenario 2: Cached Prakāśa (Second Request)

**In CLI** (same session):
```
> Continue synthesizing...
```

**Expected Flow**:

1. **Agent Reuse**:
   ```
   ✓ Epii agent already exists in registry
   ✓ Using cached identity Prakāśa
   ```

2. **Fast Delegation** (no re-initialization):
   ```
   🔄 Delegating to Epii...
   [DEBUG] Identity prompt from Redis cache
   ⚡ Streaming response...
   ```

### Test Scenario 3: Force Regeneration

**Using Python** (for testing):
```python
from agentic.agents.prakasa import PrakasaManager
from agentic.clients.bimba_graphql_client import BimbaGraphQLClient
from shared.database.redis_client import RedisClient

# Initialize
bimba = BimbaGraphQLClient()
redis = RedisClient()
prakasa = PrakasaManager(bimba, redis)

# Force regenerate
new_prompt = await prakasa.get_identity_prakasa(
    "#5-4.5",
    force_regenerate=True
)

print(f"Generated: {len(new_prompt)} chars")
```

---

## 📋 Answering Your Specific Questions

### Q1: How is f_system_prompt integrated with the agent?

**Answer**: **Proper system prompt injection via Pydantic AI's `system_prompt` parameter**

**Mechanism**:
```python
# In constellation.py (create_epii_agent)
identity_prompt = await prakasa.get_identity_prakasa("#5-4.5")

agent = Agent(
    model=model,
    deps_type=OrchestratorDeps,
    system_prompt=identity_prompt,  # ← Real Pydantic AI system prompt
    retries=2
)
```

**What happens**:
1. Pydantic AI treats this as the **actual system prompt**
2. It's sent to the LLM as the first system message
3. It's **NOT** appended to conversation start - it's the **foundation** of the agent's behavior
4. Every request to this agent includes this system prompt

**Verification**:
- The agent **embodies** the identity described in the prompt
- It references its coordinate (#5-4.5) naturally
- It operates with the perspective defined in Layer 1

**NOT demo code**: This uses Pydantic AI's native `system_prompt` parameter, which is the **standard way** to configure agent identity.

---

### Q2: Prompt Rollback - How to save/restore previous prompts?

**Current State**: ⚠️ **Rollback not yet implemented**

**What EXISTS now**:
```python
# In agent_node_manager.py
f_system_prompt = {
    "content": prompt_content,
    "metadata": {
        "generated_from": [...],
        "last_updated": "2025-10-05T12:00:00Z",
        "version": "1.0"  # ← Version field exists but not used
    }
}
```

**What's MISSING** (needs implementation):
- No prompt history storage
- No versioning system
- No rollback mechanism
- No diff/compare functionality

**Recommended Solution** (for future sprint):

#### Option A: Neo4j Relationship-Based History
```cypher
// Current version
(#5-4.5)-[:HAS_CURRENT_PROMPT]->(prompt_v3)

// History chain
(prompt_v1)-[:REPLACED_BY]->(prompt_v2)-[:REPLACED_BY]->(prompt_v3)

// Prompt nodes
(:SystemPrompt {
  version: "3",
  content: "You are Epii...",
  generated_at: "2025-10-05T12:00:00Z",
  generated_from: ["#", "#5"],
  hash: "sha256..."
})
```

**Advantages**:
- Full history preserved in graph
- Easy rollback: change HAS_CURRENT_PROMPT relationship
- Queryable diff chains
- Immutable audit trail

#### Option B: f_system_prompt_history Array
```json
{
  "f_system_prompt": {
    "content": "Current prompt...",
    "version": "3",
    "metadata": {...}
  },
  "f_system_prompt_history": [
    {
      "content": "Previous prompt v2...",
      "version": "2",
      "metadata": {...},
      "replaced_at": "2025-10-05T11:00:00Z",
      "replaced_reason": "Manual regeneration"
    },
    {
      "content": "Original prompt v1...",
      "version": "1",
      "metadata": {...},
      "replaced_at": "2025-10-04T10:00:00Z",
      "replaced_reason": "Initial generation"
    }
  ]
}
```

**Advantages**:
- Simpler to implement
- All history on one node
- Faster to query current + history

**My Recommendation**: **Option A (Neo4j relationships)**
- More aligned with graph thinking
- Scalable (history can grow without bloating node)
- Enables temporal queries
- Supports future prompt evolution visualizations

#### Implementation Sketch (Option A)

**New methods needed**:
```python
# In agent_node_manager.py

async def save_system_prompt_with_history(
    self,
    agent_coordinate: str,
    prompt_content: str,
    metadata: Dict[str, Any],
    reason: str = "regeneration"
) -> bool:
    """
    Save new prompt and create history relationship.

    1. Get current prompt (if exists)
    2. Create new SystemPrompt node
    3. Link: current -[:REPLACED_BY]-> new
    4. Update: agent -[:HAS_CURRENT_PROMPT]-> new
    """
    # Get current
    current = await self.get_system_prompt(agent_coordinate)

    # Create new prompt node
    new_version = int(current["metadata"]["version"]) + 1 if current else 1
    prompt_hash = hashlib.sha256(prompt_content.encode()).hexdigest()[:16]

    prompt_node_id = f"{agent_coordinate}-prompt-{new_version}"

    await self.bimba.create_node({
        "id": prompt_node_id,
        "label": "SystemPrompt",
        "content": prompt_content,
        "version": str(new_version),
        "hash": prompt_hash,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generated_from": metadata.get("generated_from", []),
        "reason": reason
    })

    # Create history relationship if there was a previous version
    if current:
        old_version = current["metadata"]["version"]
        old_prompt_id = f"{agent_coordinate}-prompt-{old_version}"

        await self.bimba.create_relationship({
            "from": old_prompt_id,
            "to": prompt_node_id,
            "type": "REPLACED_BY",
            "reason": reason,
            "replaced_at": datetime.now(timezone.utc).isoformat()
        })

    # Update current prompt relationship
    await self.bimba.create_relationship({
        "from": agent_coordinate,
        "to": prompt_node_id,
        "type": "HAS_CURRENT_PROMPT",
        "merge": True  # Replace existing
    })

    return True

async def get_prompt_history(
    self,
    agent_coordinate: str,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Get prompt history chain.

    Returns list of prompts newest → oldest.
    """
    query = f"""
    MATCH ({agent_coordinate})-[:HAS_CURRENT_PROMPT]->(current:SystemPrompt)
    OPTIONAL MATCH (current)<-[:REPLACED_BY*0..{limit}]-(older:SystemPrompt)
    RETURN current, older
    ORDER BY older.version DESC
    """
    # Execute and return

async def rollback_prompt(
    self,
    agent_coordinate: str,
    target_version: str
) -> bool:
    """
    Rollback to a previous prompt version.

    1. Find target version in history
    2. Update HAS_CURRENT_PROMPT relationship
    3. Invalidate cache
    """
    # Find target
    target = await self._find_prompt_version(agent_coordinate, target_version)
    if not target:
        return False

    # Update current relationship
    await self.bimba.update_relationship({
        "from": agent_coordinate,
        "to": target["id"],
        "type": "HAS_CURRENT_PROMPT"
    })

    # Invalidate cache
    await self.cache.invalidate(agent_coordinate)

    return True
```

**Story Recommendation**: **Sprint 4 - Story 02.XX: Prompt History & Rollback**

---

### Q3: Frontend Dev Observability for #5-4 Branch

**Answer**: **YES - Excellent idea! Should be Sprint 4**

**Why this matters**:

1. **Agent Node Visibility**:
   - See all 6 agent nodes (#5-4.0 through #5-4.5)
   - View current f_system_prompt content
   - View f_workflow_prompts templates
   - View all other f_* capabilities

2. **Prompt Management**:
   - Compare prompts across agents
   - Edit/test prompts before committing
   - View prompt history (if implemented)
   - Trigger regeneration with preview

3. **Context Package Inspection**:
   - See what context packages look like
   - Debug delegation issues
   - Understand agent perspective shifts

4. **System Health**:
   - Redis cache hit/miss rates
   - Prompt generation frequency
   - Agent instantiation metrics

**Recommended Architecture**:

```
frontend/src/app/dev/agents/
├── page.tsx                        # Agent constellation overview
├── [coordinate]/                   # Individual agent drill-down
│   ├── page.tsx                    # Agent details
│   ├── identity/page.tsx           # f_system_prompt editor
│   ├── workflows/page.tsx          # f_workflow_prompts manager
│   └── capabilities/page.tsx       # All f_* properties
└── compare/page.tsx                # Side-by-side agent comparison
```

**Backend API Endpoints Needed** (`backend/epi_logos_system/dev/`):

```python
# backend/epi_logos_system/dev/agent_nodes.py

@router.get("/dev/agents")
async def list_agent_nodes():
    """Get all agent nodes in #5-4 branch"""
    # Return #5-4.0 through #5-4.5 with metadata

@router.get("/dev/agents/{coordinate}")
async def get_agent_details(coordinate: str):
    """Get full agent node details"""
    # Return all properties including f_*

@router.get("/dev/agents/{coordinate}/identity")
async def get_agent_identity(coordinate: str):
    """Get current identity Prakāśa"""
    # Return f_system_prompt with metadata

@router.post("/dev/agents/{coordinate}/identity/regenerate")
async def regenerate_identity(coordinate: str, force: bool = False):
    """Trigger identity regeneration"""
    # Call prakasa.get_identity_prakasa(force_regenerate=True)

@router.get("/dev/agents/{coordinate}/history")
async def get_prompt_history(coordinate: str):
    """Get prompt version history"""
    # Return history chain (if implemented)

@router.post("/dev/agents/{coordinate}/rollback")
async def rollback_prompt(coordinate: str, version: str):
    """Rollback to previous prompt version"""
    # Call agent_node_manager.rollback_prompt()

@router.get("/dev/context-packages")
async def list_context_packages():
    """Get recent context packages from Redis"""
    # Query thought trains + context packages
```

**UI Components**:

1. **Agent Constellation Grid**:
   ```
   ┌─────────────────────────────────────────────┐
   │ Agent Constellation (#5-4)                  │
   ├─────────────────────────────────────────────┤
   │                                              │
   │  #5-4.0 Anuttara    #5-4.1 Paramasiva       │
   │  ✓ Identity ready   ✓ Identity ready        │
   │  ⚠ 2 workflows      ○ No workflows          │
   │                                              │
   │  #5-4.2 Parashakti  #5-4.3 Mahamaya        │
   │  ✓ Identity ready   ✓ Identity ready        │
   │  ○ No workflows     ✓ 1 workflow            │
   │                                              │
   │  #5-4.4 Nara        #5-4.5 Epii             │
   │  ✓ Identity ready   ✓ Identity ready        │
   │  ○ No workflows     ✓ 3 workflows           │
   │                                              │
   └─────────────────────────────────────────────┘
   ```

2. **Identity Prompt Editor** (Monaco editor):
   ```
   ┌─────────────────────────────────────────────┐
   │ Identity Prakāśa - #5-4.5 (Epii)          │
   ├─────────────────────────────────────────────┤
   │ Version: 3 | Last updated: 2 hours ago      │
   │ Generated from: #, #5                       │
   │ ─────────────────────────────────────────   │
   │                                              │
   │ [Monaco Editor with syntax highlighting]    │
   │                                              │
   │ You are Epii, embodying coordinate #5-4.5   │
   │ in the Epi-Logos System.                    │
   │                                              │
   │ ## What This Project IS...                  │
   │                                              │
   ├─────────────────────────────────────────────┤
   │ [Compare v2] [Rollback] [Regenerate] [Save]│
   └─────────────────────────────────────────────┘
   ```

3. **Diff Viewer** (for comparing versions):
   ```
   Version 2 (previous)         Version 3 (current)
   ┌──────────────────────┐   ┌──────────────────────┐
   │ You are Epii, the    │   │ You are Epii,        │
   │ master orchestrator  │ → │ embodying coordinate │
   │ ...                  │   │ #5-4.5 ...           │
   └──────────────────────┘   └──────────────────────┘
   ```

**Integration with Context Package System**:

The Redis layer (`ThoughtTrainManager`) is already the **nascent context package system**. This frontend would:

1. **Visualize thought trains**:
   - Agent insights stored in Redis
   - Cross-agent conversation patterns
   - Delegation chains

2. **Inspect context packages**:
   - See what each agent receives
   - Debug context loss issues
   - Optimize package contents

3. **Future ASCP Phase 2 (Vimarśa)**:
   - View contemplation process
   - See agent reflections
   - Track wisdom synthesis

**Story Proposal**: **Sprint 4 - Story 02.XX: Agent Node Dev Dashboard**

**Acceptance Criteria**:
1. View all 6 agent nodes in #5-4 branch
2. View/edit f_system_prompt for each agent
3. View f_workflow_prompts templates
4. View all f_* capabilities
5. Trigger prompt regeneration with preview
6. (Optional) View prompt history and rollback
7. (Optional) Inspect context packages from Redis

**Complexity**: Medium (2-3 days)
- Backend: Simple REST endpoints (1 day)
- Frontend: React components + Monaco editor (2 days)
- Testing: E2E workflow verification (0.5 days)

---

## 🎯 Verification Checklist

### Before Testing

- [ ] All services running (`npm run dev`)
- [ ] Redis running (`redis-cli ping` → PONG)
- [ ] Neo4j Aura accessible
- [ ] Agent nodes created in Bimba (#5-4.0 through #5-4.5)
- [ ] Environment variables configured (.env)

### During Testing

- [ ] CLI launches without errors
- [ ] `/debug-delegation` enables observability
- [ ] Request triggers delegation to Epii
- [ ] Prakāśa initialization logs visible
- [ ] Agent responds with coordinate-aware perspective
- [ ] Second request reuses cached agent
- [ ] Context package visible in debug output

### Post-Test Verification

- [ ] Check Neo4j: Agent nodes have f_system_prompt
- [ ] Check Redis: Identity prompts cached
- [ ] Check logs: No errors in agentic layer
- [ ] Review transcript: Delegation successful

---

## 🐛 Troubleshooting

### Issue: "Agent node not found"

**Cause**: Agent nodes not created in Bimba

**Fix**:
```bash
# Verify nodes exist
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ resolveCoordinate(coordinate: \"#5-4.5\") { name } }"}'
```

If missing, user needs to create them.

### Issue: "Redis connection failed"

**Cause**: Redis not running or wrong connection URL

**Fix**:
```bash
# Start Redis
redis-server

# Or check connection
redis-cli ping
```

### Issue: "Prompt generation hangs"

**Cause**: Bimba GraphQL timeout or root node missing required properties

**Fix**:
1. Check Bimba GraphQL server is responsive
2. Verify root node (#) has `epii_*` properties
3. Check logs for specific Bimba query errors

### Issue: "Agent doesn't use identity prompt"

**Cause**: Prakāśa manager not integrated in agent creator

**Fix**: Verify constellation.py properly awaits `get_identity_prakasa()`

---

## 📊 Success Metrics

### Prakāśa System Health

**Cache Hit Rate** (should be >80% after warmup):
```python
# Check Redis
redis_client.info("stats")
# Look for keyspace_hits / (keyspace_hits + keyspace_misses)
```

**Prompt Generation Time** (should be <2 seconds):
```python
# Check logs
grep "Generated identity prompt" agentic.log
# Look for timing info
```

**Agent Reuse Rate** (should be 100% after first creation):
```python
# Check factory registry
len(factory.registry.list_all())  # Should stabilize at 6
```

### Delegation Success Rate

**Target**: 100% of appropriate requests delegated

**Measure**:
```bash
# Count delegation events
grep "Delegating to" agentic.log | wc -l

# Count delegation failures
grep "Delegation failed" agentic.log | wc -l
```

---

## 🎓 Summary Answers

### Q1: f_system_prompt Integration
**✅ Real Pydantic AI system prompt injection** - Not appended to conversation, but used as the foundational system prompt that shapes agent behavior.

### Q2: Prompt Rollback
**⚠️ Not yet implemented** - Recommend Option A (Neo4j relationship-based history) for Sprint 4. Version field exists but rollback mechanism needs to be built.

### Q3: Frontend Dev Dashboard
**✅ Excellent idea for Sprint 4** - Agent node dev dashboard would provide essential visibility into #5-4 branch, f_system_prompt management, and context package inspection. Natural evolution of the nascent Redis context package system.

---

**Ready to verify!** All infrastructure is in place for a successful Prakāśa system demonstration.
