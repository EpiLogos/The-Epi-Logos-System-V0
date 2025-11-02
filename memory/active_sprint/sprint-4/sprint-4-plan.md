# Sprint 4 Plan — Intelligence Synthesis & Etymological Archaeology

Source: docs/sprint-plan-updated-Oct-2nd.md (Updated: 2025-10-02)
Last Revised: 2025-10-23 (Added Story 03.01.1 for architectural alignment)

## Execution Order (Revised)

### Phase 1: UI Foundation (PRIORITY - Complete First)
**08.08 Epii Etymological Atelier Interface**
- Create `/epii` base page (1:1 copy of ParamasivaPage)
- Implement 2-card modal carousel (#5-5 Atelier, #5-0 Archive)
- Set up routing structure and navigation
- **Establishes proper coordinate context for all Epii work**

### Phase 2: Backend Services (PARALLEL - After UI Foundation)
**08.03 Docling + LightRAG Ingestion** (see ./08.03.Docling Document Preprocessing & LightRAG Ingestion Pipeline.md)
- Document preprocessing pipeline
- LightRAG integration for queryability
- Raw chunk storage for future analysis

**08.07 Etymological Archaeology Workflow** (see ./08.07.epii-etymological-archaeology-workflow.md)
- 6-phase etymological archaeology protocol
- Three-namespace integration (Bimba/Graphiti/LightRAG)
- Personal exploration tracking with admin gating
- Frontend observability components (real-time session stats, notifications, MVP visualizations)

**08.10 D3.js Force-Directed Visualizations** (see ./08.10.d3-force-directed-visualizations.md)
- Production D3.js visualizations replacing MVP placeholders
- Etymology tree force-directed graph (PIE roots → cognates → modern words)
- QL community geometric crystallization (3/4/6/12-fold patterns)
- Bimba resonance constellation heat map
- Interactive controls: zoom, pan, hover tooltips, click navigation
- Real-time animation for crystallization events

### Phase 3: Intelligence Synthesis (After Phase 2)
**03.01 Generating Wisdom Packet** ✅ COMPLETE + ENHANCED (2025-10-25) (see ./03.01.generating-wisdom-packet.md)
- GraphQL query for pre-synthesized Bimba coordinate wisdom packets
- Intelligent subgraph traversal with relevance scoring
- Narrative synthesis with apophatic pointers
- Redis caching with 24h TTL for performance
- **SPRINT 4 ENHANCEMENT:**
  - Quintessential property (q_*) awareness and prioritization
  - LLM-powered narrative synthesis (Gemini 2.0 Flash Experimental)
  - New shared tool: `get_quintessential_properties` (agent + GraphQL + MCP)
  - Holistic tool docstrings with philosophical grounding
  - Ready for canonical ← episodic ← canonical refinement workflow
  - See: [wisdom-packet-q-properties-llm-enhancement-IMPLEMENTED.md](./wisdom-packet-q-properties-llm-enhancement-IMPLEMENTED.md)

**03.01.1 Shared Synthesis Engine** (NEW - see ../../docs/stories/03.01.1.shared-synthesis-engine.md)
- Architectural alignment between Story 03.01 (Wisdom Packet) and Story 08.07 (EA Workflow)
- Shared SynthesisEngine base class for canonical and episodic knowledge synthesis
- Redis caching strategy standardization (24h canonical, 1h episodic)
- Quality metrics framework (SynthesisQualityScore) for "genuine insight, not raw aggregation"
- Bidirectional enrichment hooks (canonical ↔ episodic)

**04.01 Coordinate Decomposition** (see ./04.01.coordinate-decomposition.md)
**04.11 Coordinate System Harmonizer** (planning/initials - see ./04.11.coordinate-system-harmonizer-implementation.md)

## Added Stories (per Sprint 3 & Sprint 4 progression)
- 02.28 Contextual Enrichment Synthesis (Phase 2) — see ../sprint-3/02.27-protocol-workflow-system/00-story-cluster-integration-architecture.md
- 02.29 Iterative Wisdom Distillation (Phase 3) — see ../sprint-3/02.27-protocol-workflow-system/00-story-cluster-integration-architecture.md
- 03.01.1 Shared Synthesis Engine (Phase 3) — see ../../docs/stories/03.01.1.shared-synthesis-engine.md
- 08.10 D3.js Force-Directed Visualizations (Phase 2, after 08.07) — see ./08.10.d3-force-directed-visualizations.md

## Notes
- **Key Change**: UI foundation (08.08) MUST complete first to establish coordinate context
- 08.03 and 08.07 run in parallel after UI foundation is stable
- **08.10 added 2025-10-24**: D3.js visualizations enhance 08.07 with production-quality interactive graphs
  - 08.07 establishes MVP placeholders + backend + observability
  - 08.10 replaces placeholders with D3.js force-directed graphs, geometric QL patterns, heat maps
  - Can run in parallel with Phase 3 stories (03.01, 03.01.1) or as sequential enhancement
- 02.28 and 02.29 continue the Protocol-Workflow System (02.27) into enriched context and distillation phases
- 02.03.2 Hybrid GraphRAG Retrieval Integration remains targeted for Sprint 5 final story

## Architectural Alignment Notes (Added 2025-10-23)

**Story 03.01 & 08.07 Integration Strategy:**
- **Separate Domains**: Wisdom Packet (canonical Bimba synthesis) and EA Workflow (episodic Graphiti synthesis) serve different use cases
- **Shared Patterns**: Both require intelligent synthesis, Redis caching, quality validation, and background processing
- **Story 03.01.1 Solution**: Creates shared SynthesisEngine base class to unify architectural patterns without conflating concerns

**Integration Roadmap:**
1. **Phase 1 (Current - Sprint 4):** Parallel development, no integration
   - Story 03.01: Wisdom Packet synthesis for canonical coordinates
   - Story 08.07: EA MEF analysis for episodic communities
   - Both stories remain functionally separate

2. **Phase 2 (Story 03.01.1 - Sprint 4):** Shared infrastructure with enrichment hooks
   - Base SynthesisEngine class with quality metrics
   - Standardized Redis caching strategy (24h/1h TTL)
   - Placeholder hooks for bidirectional enrichment

3. **Phase 3 (Future - Sprint 5+):** Bidirectional enrichment activation
   - Wisdom Packets reference EA community insights (`userInsights` field)
   - EA insight surfacing suggests related Wisdom Packets
   - Möbius loop: Personal discovery → Canonical wisdom → Enriched understanding

**Key Design Principle:**
Keep stories functionally separate (different domains, lifecycles, storage) while sharing architectural DNA (synthesis patterns, caching, quality validation).
