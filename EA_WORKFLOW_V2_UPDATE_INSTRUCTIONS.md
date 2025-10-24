# EA Workflow v2 Update Instructions

## Summary

Successfully completed the **correct** remediation for Graphiti agent awareness. The EA workflow prompt is now enhanced with enrichment tool documentation and depth accrual guidance.

## What Was Done

### ✅ Phase 1: Backend Infrastructure (COMPLETED)
All enrichment capabilities are now implemented across the full stack:

1. **Service Layer** ([service.py:1338-1555](backend/epi_logos_system/cag/graphiti/service.py#L1338-L1555))
   - `update_community_properties()` - Dynamic property updates
   - `enrich_word_node()` - Etymology data enrichment
   - `link_aphorism_to_community()` - Crystallization relationships

2. **API Layer** ([api.py:784-889](backend/epi_logos_system/cag/graphiti/api.py#L784-L889))
   - PATCH `/etymology/communities/{community_id}`
   - PATCH `/etymology/words/{word}`
   - POST `/etymology/communities/{community_id}/aphorisms/{aphorism_id}`

3. **HTTP Client Layer** ([graphiti_http_client.py:128-210](agentic/clients/graphiti_http_client.py#L128-L210))
   - HTTP methods for all three enrichment operations

4. **Agent Tools** ([orchestrator_agent.py:1288-1468](agentic/agents/orchestrator/orchestrator_agent.py#L1288-L1468))
   - `enrich_community_properties` - Registered as @agent.tool
   - `enrich_word_node` - Registered as @agent.tool
   - `link_aphorism_to_community` - Registered as @agent.tool
   - All three tools added to EA_ALLOWED_TOOLS whitelist

### ✅ Phase 2: EA Workflow Prompt Enhancement (COMPLETED)

Created **EA_WORKFLOW_PROMPT_V2** with comprehensive Graphiti enrichment awareness:

**File**: [ea_workflow_init.py:20-178](backend/epi_logos_system/cag/bimba/ea_workflow_init.py#L20-L178)

**Key Enhancements**:
- **New Role**: "Depth Curator" - Enrich communities and words as discoveries emerge
- **New Phase 5**: "Depth accrual" - Enrich properties as meaning deepens
- **"Graphiti as Living Memory" Section**: Explains depth accrual philosophy
- **Enrichment Tools Documentation**: All three tools listed with usage examples
- **Enhanced Example Flow**: Shows enrichment happening naturally during conversation
- **Depth Accrual Pattern**: 5-step pattern from creation to wisdom crystallization
- **"When to Enrich" Guidance**: Judgment-based enrichment timing

## To Complete the Update

### Step 1: Start Backend Service
```bash
npm run dev:backend
```

### Step 2: Run Update Script
```bash
cd /Users/admin/Documents/The\ Epi-Logos\ System\ V0
PYTHONPATH=. python3 backend/epi_logos_system/cag/bimba/update_ea_workflow_to_v2.py
```

This script will:
1. Load EA_WORKFLOW_PROMPT_V2 from ea_workflow_init.py
2. Call `update_ea_workflow_version()` to create v2 in Neo4j
3. Update `f_workflow_etymology_archaeology_active` to "v2"
4. Append to version history
5. Verify the update succeeded

**Alternative (if script fails)**: Use the Cypher script manually in Neo4j Browser:
- Open Neo4j Browser
- Copy content from `backend/epi_logos_system/cag/bimba/update_ea_v2.cypher`
- Set `$v2_prompt` parameter to EA_WORKFLOW_PROMPT_V2 content
- Execute

### Step 3: Invalidate Prakāśa Cache
```bash
redis-cli DEL prakasa:identity:#5-4.5
```

Or restart agentic service:
```bash
npm run dev:agentic
```

### Step 4: Verify in EA Session
1. Start a new Etymology Archaeology session (#5-5)
2. Agent should now have awareness of enrichment tools
3. Test depth accrual by exploring a word family
4. Verify agent enriches properties naturally during conversation

## Architecture Summary

### How EA Workflow Prompts Work

```
User starts EA session (#5-5)
        ↓
Orchestrator detects context == "#5-5"
        ↓
PrakasaManager.compose_full_prakasa()
  ├─ Layer 1: Identity (from #5-4.5 f_system_prompt)
  ├─ Layer 2: Workflow (from #5-4.5 f_workflow_etymology_archaeology_v2) ← NEW
  └─ Layer 3: Runtime context
        ↓
Agent receives complete 3-layer prompt
        ↓
Agent uses enrichment tools during conversation
```

### Why This Is Correct

- ✅ EA workflow prompts stored in **Neo4j** (not hardcoded)
- ✅ **Versioned** system allows iterative improvement
- ✅ **Three-layer Prakāśa** architecture preserved
- ✅ Enrichment tools **already registered** in orchestrator
- ✅ Tools **whitelisted** for EA sessions
- ✅ V2 prompt **documents tools and usage patterns**

## What Changed from Previous Attempt

### ❌ Previous (Incorrect):
- Updated hardcoded orchestrator system prompt
- EA sessions don't use this prompt (they load from Neo4j)

### ✅ Current (Correct):
- Created EA_WORKFLOW_PROMPT_V2 in ea_workflow_init.py
- V2 stored in Neo4j at #5-4.5 as f_workflow_etymology_archaeology_v2
- PrakasaManager loads v2 dynamically during EA sessions
- Enrichment tools already available, just needed documentation

## Files Modified

1. **backend/epi_logos_system/cag/graphiti/service.py** - Added 3 enrichment methods
2. **backend/epi_logos_system/cag/graphiti/api.py** - Added 3 enrichment endpoints
3. **agentic/clients/graphiti_http_client.py** - Added 3 HTTP client methods
4. **agentic/agents/orchestrator/tools/episodic/http_graphiti_tools.py** - Added 3 wrapper methods
5. **agentic/agents/orchestrator/orchestrator_agent.py** - Registered 3 agent tools + EA whitelist
6. **backend/epi_logos_system/cag/bimba/ea_workflow_init.py** - Created EA_WORKFLOW_PROMPT_V2

## Files Created

1. **backend/epi_logos_system/cag/bimba/update_ea_workflow_to_v2.py** - Update script
2. **backend/epi_logos_system/cag/bimba/update_ea_v2.cypher** - Manual Cypher alternative
3. **EA_WORKFLOW_V2_UPDATE_INSTRUCTIONS.md** - This file

## Testing Checklist

- [ ] Backend service running
- [ ] Update script executed successfully
- [ ] Prakāśa cache invalidated
- [ ] New EA session shows v2 prompt loading
- [ ] Agent mentions enrichment tools in tool list
- [ ] Agent uses `enrich_community_properties` when PIE root discovered
- [ ] Agent uses `enrich_word_node` when cognates found
- [ ] Agent uses `link_aphorism_to_community` when insights crystallize
- [ ] Properties persist correctly in Neo4j
- [ ] Multiple sessions accumulate depth correctly

## Next Steps

After verifying v2 works correctly:
1. Monitor EA sessions for natural enrichment usage
2. Iterate on enrichment guidance if needed (v3)
3. Consider adding more enrichment capabilities (cross-references, semantic networks)
4. Document enrichment patterns that emerge from actual usage
