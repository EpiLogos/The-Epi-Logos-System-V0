# Sprint 3 Reorganized Plan
## Multi-Agent Foundation & GraphRAG Scope Adjustment

**Document Date**: 2025-10-03
**Status**: ACTIVE - Updated Plan
**Change Type**: Story Reorganization & Scope Clarification

---

## Executive Summary

Sprint 3 plan has been reorganized to optimize the foundational development sequence:

**Key Changes**:
1. **New Story Added**: 02.24 Multi-Agent Architecture Foundation (foundational infrastructure)
2. **Story Moved**: 02.03.2 Hybrid GraphRAG Retrieval → Moved to Sprint 5 (final story)
3. **Rationale**: Build agent constellation first, then populate knowledge stores in Sprint 4-5, THEN implement Hybrid GraphRAG with real data to test against

---

## Updated Sprint 3 Scope

### Primary Stories (Foundation Building)

#### ✅ COMPLETED (4 stories)
1. **02.02** - Neighboring Node Discovery
2. **02.03** - Graph Path Traversal
3. **02.03.1** - Semantic-to-Coordinate Resolution
4. **02.25** - Bimba Node Embedding Generation Tool

#### 🟡 IN PROGRESS / PENDING (3 stories)
5. **02.24** - **Multi-Agent Architecture Foundation** [NEW - THIS SPRINT]
   - Agent factory pattern for 6-coordinate constellation
   - A2A communication infrastructure
   - Hybrid orchestrator routing (internal personas vs. external agents)
   - Prakāśa phase Bimba initialization
   - Redis shared memory setup
   - PoC delegation: Orchestrator → Epii
   - Pydantic Graph research spike

6. **02.06** - Bimba Node Creation [PENDING]
   - Admin-gated node creation via GraphQL mutation
   - Coordinate uniqueness validation
   - Tool ecosystem integration

7. **02.06.1** - Bimba Node Update Tool [PENDING]
   - Flexible property updates
   - Extensible schema with validation
   - Partial update logic

### Stories MOVED to Sprint 5

#### 📦 DEFERRED TO SPRINT 5
- **02.03.2** - Hybrid GraphRAG Retrieval Integration [MOVED TO SPRINT 5]
  - **Rationale**: Needs populated knowledge stores (Bimba, Episodic, Gnostic) to meaningfully test
  - **Sprint 5 Position**: Final story after Epii document analysis populates namespaces
  - **Dependencies**:
    - Sprint 4: Specialized agent capabilities
    - Sprint 5: Epii document analysis + knowledge population
    - Then: Hybrid GraphRAG with real data

---

## Sprint 3 Completion Criteria (Updated)

Sprint 3 is complete when:
- ✅ All 7 primary stories implemented and tested
- ✅ Multi-agent constellation infrastructure operational
- ✅ Agent factory pattern proven with all 6 agents
- ✅ Prakāśa phase (ASCP Phase 1) working
- ✅ PoC delegation (Orchestrator → Epii) successful
- ✅ Node management capabilities (create, update) complete
- ✅ Comprehensive test coverage (90%+ unit, 100% integration)

---

## Rationale for Story 02.03.2 Movement

### Why Move to Sprint 5?

**Problem with Sprint 3 Implementation**:
- 02.03.2 requires L0-L3 retrieval layers with REAL knowledge to test
- Currently Bimba has basic structure, but Gnostic (LightRAG) and Episodic (Graphiti) are minimally populated
- Meaningful hybrid retrieval testing impossible without diverse knowledge stores

**Sprint 5 Sequence Makes Sense**:
1. **Sprint 3**: Build multi-agent infrastructure foundation
2. **Sprint 4**: Develop specialized agent capabilities
3. **Sprint 5 Early**: Epii document analysis pipeline populates Gnostic namespace
4. **Sprint 5 Early**: User interactions populate Episodic namespace
5. **Sprint 5 Final**: Hybrid GraphRAG with richly populated namespaces to test fusion strategies

**Benefits**:
- Test Hybrid GraphRAG with real, diverse knowledge
- Validate cross-namespace fusion with actual data
- Prove retrieval quality with populated stores
- Sprint 3 stays focused on agent constellation foundation

---

## Story Dependencies (Updated)

```
Sprint 3 Foundation:
├── 02.02 ✅ → 02.03 ✅ → 02.03.1 ✅ (Graph Operations Complete)
├── 02.25 ✅ (Embeddings Complete)
├── 02.24 🟡 (Multi-Agent Foundation) [CURRENT FOCUS]
├── 02.06 🔴 → 02.06.1 🔴 (Node Management)
└── [02.03.2 MOVED TO SPRINT 5]

Sprint 4 Evolution:
└── Specialized agent capabilities
    └── Vimarśa phase (ASCP Phase 2)
    └── Agent-specific tools

Sprint 5 Synthesis:
├── Epii document analysis (knowledge population)
├── Crystallization phase (ASCP Phase 3)
└── 02.03.2: Hybrid GraphRAG [FINAL STORY]
    └── Tests against populated namespaces
```

---

## Architectural Integration (Updated)

### Sprint 3 Focus: Agent Constellation Infrastructure

**What We're Building**:
1. Agent factory pattern (creates all 6 coordinate agents)
2. Hybrid orchestrator router (persona masks vs. agent delegation)
3. A2A communication protocol (context handoff via `context_id`)
4. Prakāśa phase (agents query Bimba on init)
5. Redis shared memory substrate (thought trains structure)
6. Proof-of-concept delegation (Orchestrator → Epii)

**What We're NOT Building** (Sprint 4-5):
- Vimarśa phase (thought train accumulation during operation)
- Crystallization phase (wisdom synthesis back to Bimba)
- Specialized agent tools (coordinate-specific capabilities)
- Hybrid GraphRAG multi-layer retrieval (moved to Sprint 5)

### Parallel Development Tracks

**Track 1: Multi-Agent Foundation** (Story 02.24)
- Agent constellation skeleton
- A2A communication
- Prakāśa initialization

**Track 2: Node Management** (Stories 02.06, 02.06.1)
- Admin-gated CRUD operations
- Flexible property schemas
- GraphQL mutations

**Convergence Point**: Sprint 4
- Specialized agents use node management for knowledge updates
- ASCP Vimarśa phase uses node updates for wisdom capture

---

## Testing Strategy (Updated)

### Sprint 3 Test Coverage

**Agent Infrastructure Tests**:
- Agent factory pattern (unit)
- Hybrid router logic (unit)
- Prakāśa initialization (unit + integration)
- A2A communication (integration)
- Delegation workflow (e2e)

**Node Management Tests**:
- Node creation mutations (unit + integration)
- Node update mutations (unit + integration)
- Admin authorization (integration)
- GraphQL schema validation (unit)

**Deferred to Sprint 5**:
- Hybrid GraphRAG retrieval tests (needs populated namespaces)
- Cross-namespace fusion tests (needs real knowledge diversity)
- L0-L3 layer integration tests (deferred with 02.03.2)

---

## Sprint 4-5 Evolution Path (Updated)

### Sprint 4: Agent Capabilities
- Specialized tools per coordinate
- Vimarśa phase (experiential insights)
- Agent-specific workflows
- Enhanced A2A coordination

### Sprint 5: Knowledge Population & Synthesis
- **Early Sprint 5**: Epii document analysis pipeline
  - Populates Gnostic namespace (LightRAG)
  - Generates Pratibimba documents
  - Creates relational structures
- **Mid Sprint 5**: User interaction data
  - Populates Episodic namespace (Graphiti)
  - Temporal memory patterns
  - Personal pratibimba growth
- **Late Sprint 5**: Hybrid GraphRAG Implementation
  - Story 02.03.2 implementation
  - L0-L3 layer coordination
  - Cross-namespace fusion with REAL data
  - Meaningful retrieval quality validation
- **Final Sprint 5**: Crystallization phase (ASCP Phase 3)
  - Orchestrator wisdom synthesis
  - Bimba map evolution via operational insights

---

## Success Metrics (Updated)

### Sprint 3 Completion Metrics

**Quantitative**:
- ✅ 4 stories complete (graph operations + embeddings)
- 🎯 3 stories to complete (multi-agent + node management)
- 🎯 7/7 total stories (100% Sprint 3 scope)
- 🎯 90%+ test coverage for new implementations
- 🎯 All 6 agents created and tested

**Qualitative**:
- ✅ Graph intelligence foundation operational
- 🎯 Multi-agent infrastructure proven
- 🎯 ASCP Phase 1 (Prakāśa) working
- 🎯 Agent delegation pattern validated
- 🎯 Foundation ready for Sprint 4 specialization

### Sprint 5 Readiness Indicators

**Knowledge Store Maturity**:
- Bimba: Structural completeness ✅
- Gnostic: Document corpus richness 🎯 (Sprint 5 early)
- Episodic: Temporal pattern diversity 🎯 (Sprint 5 mid)

**Hybrid GraphRAG Prerequisites**:
- Populated namespaces ✅ (Sprint 5 early/mid)
- Cross-namespace entity linking 🎯 (Sprint 5 mid)
- Diverse retrieval scenarios 🎯 (Sprint 5 late)

---

## Key Decisions & Rationale

### Decision 1: Add Story 02.24 (Multi-Agent Foundation)
**Rationale**:
- ASCP protocol vision requires foundational infrastructure
- Agent constellation must exist before specialization
- Prakāśa phase (Phase 1) is testable without full cycle
- Proves pattern for Sprint 4-5 evolution

### Decision 2: Move Story 02.03.2 to Sprint 5
**Rationale**:
- Hybrid GraphRAG needs populated knowledge stores to test meaningfully
- Sprint 5 Epii development creates necessary knowledge diversity
- Better validation of cross-namespace fusion with real data
- Sprint 3 stays focused on infrastructure foundation

### Decision 3: Pydantic Graph Research Spike
**Rationale**:
- May provide structural integrity for mod6 QL workflows
- Valuable for Epii doc analysis (Sprint 5)
- Research now, decide implementation timing based on findings
- Low risk: Research spike doesn't commit to implementation

---

## Updated Story Sequence

### Sprint 3 Final Sequence:
1. ✅ 02.02 - Neighboring Node Discovery
2. ✅ 02.03 - Graph Path Traversal
3. ✅ 02.03.1 - Semantic-to-Coordinate Resolution
4. ✅ 02.25 - Bimba Node Embedding Generation
5. 🟡 **02.24 - Multi-Agent Architecture Foundation** [NEW]
6. 🔴 02.06 - Bimba Node Creation
7. 🔴 02.06.1 - Bimba Node Update Tool

### Sprint 5 Addition:
- 📦 **02.03.2 - Hybrid GraphRAG Retrieval** [MOVED FROM SPRINT 3]
  - Position: Final Sprint 5 story
  - After: Epii document analysis + knowledge population

---

## Communication & Next Steps

### Team Communication
- ✅ Story 02.24 created and documented
- ✅ Sprint 3 plan reorganized and documented
- 🎯 Update sprint tracking docs with new sequence
- 🎯 Communicate 02.03.2 movement to stakeholders

### Development Next Steps
1. **Immediate**: Begin Story 02.24 (Multi-Agent Foundation)
   - TDD Cycle 1: Agent factory + constellation
   - TDD Cycle 2: Hybrid router + A2A communication
   - TDD Cycle 3: Prakāśa phase implementation
   - TDD Cycle 4: Redis infrastructure + PoC delegation

2. **Following**: Complete Sprint 3 with 02.06 + 02.06.1
   - Node creation capabilities
   - Node update capabilities
   - Admin authorization framework

3. **Sprint 4 Planning**: Prepare specialized agent capabilities
   - Define coordinate-specific tools
   - Plan Vimarśa phase implementation
   - Design agent coordination patterns

4. **Sprint 5 Planning**: Prepare knowledge population + Hybrid GraphRAG
   - Epii document analysis pipeline
   - Cross-namespace linking strategy
   - 02.03.2 implementation with populated stores

---

**Document Version**: 1.0
**Last Updated**: 2025-10-03
**Next Review**: Upon Sprint 3 completion or major scope changes
**Author**: Scrum Master Bob
