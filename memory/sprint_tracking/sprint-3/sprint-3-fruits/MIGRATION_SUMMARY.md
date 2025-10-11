# Functional Property Migration - Summary

**Created**: 2025-10-05
**Sprint**: Sprint 3 (Foundation Planning for Sprint 5 Implementation)
**Context**: Agent node architecture and f_ property separation of concerns

---

## Overview

This work establishes the **generalized migration strategy** for moving functional properties (`f_*`) from subsystem nodes (#0-#5) to their corresponding agent nodes (#5-4-0 through #5-4-5), enforcing clean architectural separation between epistemic knowledge and operational workflows.

## Deliverables

### 1. Generalized Migration Script
**Location**: `/backend/epi_logos_system/cag/bimba/migrations/migrate_functional_properties_to_agent_nodes.cypher`

**Features:**
- ✅ Migrate single subsystem properties (#N → #5-4.N)
- ✅ Batch migrate all subsystems at once
- ✅ Manual migration (no APOC dependency)
- ✅ APOC-based migration (automated extraction)
- ✅ Verification queries
- ✅ Rollback capability
- ✅ Migration metadata tracking

**Usage Patterns:**
```cypher
// Migrate single subsystem (e.g., Epii #5 → #5-4-5)
:param subsystemNum => 5
// Run STEP 3

// Check what would be migrated (dry run)
// Run STEP 2

// Verify migration completed
// Run STEP 6 queries
```

### 2. Architecture Planning Document
**Location**: `/memory/sprint_tracking/sprint-3/sprint-3-fruits/agent-node-functional-property-migration-plan.md`

**Contents:**
- Complete agent node architecture (#5-4-0 through #5-4-5)
- Five categories of functional properties
- Etymology workflow f_ property specifications
- Mermaid diagrams (topology, workflow execution, property categories)
- Implementation roadmap
- Design decisions with rationale

**Referenced By**: Story 08.06 (Epii Persona Workflow - Sprint 5)

### 3. Foundational Documentation Update
**Location**: `/memory/foundational/functional-property-architecture-methodology.md`

**Added Sections:**
- Agent nodes as f_ property containers
- Workflow property structure template
- Five categories of functional properties
- Epii etymology workflow exemplar
- Agent-workflow interaction pattern
- Migration methodology

### 4. Story Integration
**Location**: `/docs/stories/08.06.epii-persona-workflow.md`

**Added:**
- Functional Property Migration Requirements section
- References to migration script, planning doc, methodology
- Critical prerequisite note about f_ property separation

---

## Architecture Summary

### Separation of Concerns

**Subsystem Nodes (#0-#5)**: Epistemic/Ontological Properties
```
- name, description, coreNature
- concrescencePhase, formCycleDesignation
- resonances, keyPrinciples
- Agent-GENERATED insights (epii_form_*, parashakti_lens_*)
- NO f_ properties
```

**Agent Nodes (#5-4-X)**: Functional/Operational Properties
```
- f_workflow_definitions
- f_state_management
- f_namespace_integration
- f_agent_coordination
- f_evolution_protocols
- ALL f_ properties live here
```

### Agent Node Structure

```
#5 (epii subsystem)
  └─ HAS_INTERNAL_COMPONENT → #5-4 (Siva-Shakti coordination)
      ├─ HAS_INTERNAL_COMPONENT → #5-4-0 (Anuttara Agent)
      ├─ HAS_INTERNAL_COMPONENT → #5-4-1 (Paramasiva Agent)
      ├─ HAS_INTERNAL_COMPONENT → #5-4-2 (Parashakti Agent)
      ├─ HAS_INTERNAL_COMPONENT → #5-4-3 (Mahamaya Agent)
      ├─ HAS_INTERNAL_COMPONENT → #5-4-4 (Nara Agent)
      └─ HAS_INTERNAL_COMPONENT → #5-4-5 (Epii Agent)
```

### Five Categories of Functional Properties

**Category A: Workflow Definitions**
- `f_etymological_contemplation`
- `f_logos_cycle_orchestration`
- `f_mef_lens_analysis`
- `f_journal_workflow`
- `f_oracle_workflow`

**Category B: State Management**
- `f_current_workflow_state`
- `f_last_execution_timestamp`
- `f_execution_history`

**Category C: Namespace Integration**
- `f_bimba_integration`
- `f_episodic_integration`
- `f_gnostic_integration`

**Category D: Agent Coordination**
- `f_primary_collaborators`
- `f_delegation_triggers`
- `f_handoff_protocols`

**Category E: Evolution & Meta-Techne**
- `f_workflow_evolution`
- `f_quality_metrics`
- `f_self_review_protocol`

---

## Migration Workflow

### Pre-Migration
1. ✅ Ensure #5-4 coordination node exists
2. ✅ Ensure all 6 agent nodes exist (#5-4-0 through #5-4-5)
3. ✅ Review STEP 2 to see which properties will be migrated

### Migration Execution
1. Choose approach:
   - **Single subsystem**: STEP 3 (APOC) or STEP 4 (manual)
   - **All subsystems**: STEP 5 (batch migration)
2. Execute migration query
3. Review migration output

### Post-Migration Verification
1. Run STEP 6 verification queries:
   - Confirm agent nodes have f_ properties
   - Confirm subsystem nodes are clean (no f_ properties)
   - Review migration summary

### Rollback (If Needed)
1. Run STEP 7 rollback query
2. Restores properties to subsystem nodes
3. Removes from agent nodes

---

## Current State (Sprint 3)

**Completed:**
- ✅ Generalized migration script created
- ✅ Architecture planning document complete
- ✅ Foundational documentation updated
- ✅ Story 08.06 references added

**Ready For Sprint 5:**
- Agent node creation (run script from planning doc Section III.3)
- F_ property migration (use generalized script)
- Etymology workflow implementation (Story 08.06)
- Logos Cycle implementation (Story 08.06)

**Current Graph State:**
- #5-4 (Siva-Shakti) coordination node: **EXISTS**
- Agent nodes (#5-4-0 through #5-4-5): **DO NOT EXIST YET**
- F_ properties on subsystem nodes: **TO BE CHECKED**

---

## Sprint 5 Implementation Path

### Phase 1: Foundation Setup
1. Create all 6 agent nodes (Section III.3 of planning doc)
2. Verify agent node creation (Section III.5 verification script)
3. Identify f_ properties on subsystem nodes (migration script STEP 2)

### Phase 2: Migration
1. Review properties to be migrated
2. Execute migration (per-subsystem or batch)
3. Verify migration completed successfully
4. Document any subsystem-specific property structures

### Phase 3: Workflow Implementation (Story 08.06)
1. Implement Epii etymological contemplation workflow
2. Implement Logos Cycle orchestration
3. Implement QL Episodic Overlays architecture
4. Test workflow execution reading f_ properties from agent nodes

### Phase 4: Workflow Organization
1. Group f_ properties by workflow type (Categories A-E)
2. Document workflow property structures
3. Create workflow-specific implementation guides
4. Establish meta-techne evolution protocols

---

## Key Design Decisions

### Decision: Agent Nodes Under #5-4
**Rationale**: #5-4 (Siva-Shakti) represents unity of knowledge (Siva) and power (Shakti) - perfect coordinate for agent manifestations that embody both knowing and doing.

### Decision: F_ Properties on Agent Nodes Only
**Rationale**: Maintains clean separation. Subsystem nodes remain purely epistemic/ontological. Agent nodes hold all functional/operational properties.

### Decision: Generalized Migration Script
**Rationale**: Migration from subsystem to agent should be reusable pattern, not one-off script. Supports future subsystem implementations.

### Decision: Cypher-Based Migration
**Rationale**: Graph structure changes via explicit Cypher scripts that can be version-controlled, reviewed, and rolled back. Backend code reads structure, doesn't create it.

---

## References

### Documentation
- **Functional Property Methodology**: `/memory/foundational/functional-property-architecture-methodology.md`
- **Migration Planning**: `/memory/sprint_tracking/sprint-3/sprint-3-fruits/agent-node-functional-property-migration-plan.md`
- **Etymology Workflow**: `/memory/sprint_tracking/sprint-3/sprint-3-fruits/epii-etymological-workflow-planning/`

### Scripts
- **Migration Script**: `/backend/epi_logos_system/cag/bimba/migrations/migrate_functional_properties_to_agent_nodes.cypher`
- **Agent Creation**: See Section III.3 of migration planning document

### Stories
- **08.06**: Epii Persona Workflow (Sprint 5 - PRIMARY)
- **08.11**: Epii Namespace Integration Planning (Sprint 5 - Planning prerequisite)
- **02.23**: Functional Property Architecture Planning (appears pre-sprint for all subsystem sprints)

---

## Success Criteria

### Technical Success
- [ ] All 6 agent nodes exist in Bimba graph
- [ ] Agent nodes properly linked to #5-4 via HAS_INTERNAL_COMPONENT
- [ ] F_ properties migrated from subsystem nodes to agent nodes
- [ ] Subsystem nodes clean (no f_ properties remaining)
- [ ] Migration metadata tracked on agent nodes
- [ ] Verification queries confirm successful migration

### Architectural Success
- [ ] Clear separation: agent nodes (functional) vs subsystem nodes (epistemic)
- [ ] F_ properties follow consistent structure (5 categories)
- [ ] Three-namespace integration clearly defined
- [ ] Agent coordination patterns documented

### Implementation Success
- [ ] Etymology workflow reads f_ properties from #5-4-5
- [ ] Logos Cycle workflow operational
- [ ] Workflow execution dynamic (reads from graph, not hardcoded)
- [ ] Meta-techne evolution pathway functional

---

**Status**: ✅ Planning Complete - Ready for Sprint 5 Implementation
**Next Action**: Execute agent node creation script when Sprint 5 begins
