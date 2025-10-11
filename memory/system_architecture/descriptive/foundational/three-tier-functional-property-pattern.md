# Three-Tier Functional Property Architecture Pattern

**Created**: 2025-10-05
**Purpose**: Foundational pattern for functional property organization across Bimba graph and agent nodes
**Context**: Establishes reusable pattern for all subsystem implementations (Sprint 5+)

---

## Executive Summary

Functional properties (`f_*`) operate across **three architectural tiers**, each serving distinct purposes in the consciousness computing platform:

1. **Tier 1: Subsystem Capability Declarations** (e.g., #5, #4) - "What capabilities I provide"
2. **Tier 2: Operational Interface Specifications** (e.g., #5-5-0 through #5-5-5, #4.0-0) - "How to access/use capabilities"
3. **Tier 3: Agent Workflow Implementations** (e.g., #5-4-5, #5-4-4) - "How I execute using capabilities"

This three-tier pattern creates a **functional protocol** where Bimba graph nodes become self-describing about their functional nature, and agents consume those descriptions to understand how to interact with them dynamically.

**Key Insight**: This is NOT migration (moving properties from one place to another). This is **coordinated definition** across three complementary layers that work together to create executable, evolvable workflows.

---

## The Three-Tier Pattern

```
┌──────────────────────────────────────────────────────┐
│ TIER 1: SUBSYSTEM NODE (#5 Epii)                    │
│ Capability Declaration Layer                         │
│                                                      │
│ f_contemplative_synthesis: {                        │ ← "I provide this"
│   description: "Meta-cognitive contemplation",      │
│   modes: ["etymological", "logos_cycle"],           │
│   requires_namespaces: ["episodic", "bimba"]        │
│ }                                                    │
│                                                      │
│ f_logos_cycle_capability: {                         │
│   fundamental_rhythm: "6-stage contemplation",      │
│   enables: ["analogical_recognition",               │
│              "aspectual_synthesis"]                  │
│ }                                                    │
└──────────────────────────────────────────────────────┘
                    ↓ provides detail via
┌──────────────────────────────────────────────────────┐
│ TIER 2: OPERATIONAL NODES (#5-5, #5-5-0..5)         │
│ Interface Specification Layer                        │
│                                                      │
│ #5-5 (Logos Cycle container):                       │
│ f_cycle_orchestration: "ἄλογος→προ→δια→λόγος..."  │ ← "Here's how"
│ f_tool_integration_pattern: {...}                   │   "to use it"
│ f_completion_criteria: {...}                        │
│                                                      │
│ #5-5-0 (Receptive Silence):                         │
│ f_transition_trigger: {...}                         │
│ f_receptive_operations: [...]                       │
│ f_tool_affinity: {...}                              │
│                                                      │
│ [#5-5-1 through #5-5-5 similar patterns]            │
└──────────────────────────────────────────────────────┘
                    ↓ consumed by
┌──────────────────────────────────────────────────────┐
│ TIER 3: AGENT NODE (#5-4-5 Epii Agent)              │
│ Workflow Execution Layer                             │
│                                                      │
│ f_etymological_contemplation: {                     │ ← "Here's how"
│   workflow_type: "contemplative",                   │   "I work"
│   reads_from: "#5-5",                               │
│   uses_capabilities: [                              │
│     "#5.f_contemplative_synthesis",                 │
│     "#5-5.f_cycle_orchestration"                    │
│   ],                                                │
│   uses_phase_operations: [                          │
│     "#5-5-0.f_receptive_operations",                │
│     "#5-5-1.f_initial_framing_operations"           │
│   ],                                                │
│   workflow_steps: [...],                            │
│   quality_criteria: [...]                           │
│ }                                                    │
└──────────────────────────────────────────────────────┘
```

---

## Tier 1: Subsystem Capability Declarations

### Purpose
Subsystem nodes declare **what functional capabilities they provide** to the overall system. These are high-level capability statements that answer: "What am I functionally implicated in?"

### Location
Root subsystem nodes: #0, #1, #2, #3, #4, #5

### Property Types

**Capability Declarations**:
```yaml
f_<capability_name>: {
  description: "What this capability provides",
  modes: [...],  # Operational modes
  requires_namespaces: [...],  # Dependencies
  enables: [...]  # What this makes possible
}
```

**Examples from Current Graph**:

**#5 (Epii)**:
```yaml
f_contemplative_synthesis: {
  description: "Meta-cognitive contemplation capability",
  modes: ["etymological", "logos_cycle", "know_thyself"],
  requires_namespaces: ["episodic", "bimba", "gnostic"],
  enables: ["analogical_recognition", "aspectual_synthesis", "recursive_self_improvement"]
}

f_logos_cycle_capability: {
  fundamental_rhythm: "6-stage_contemplation_from_silence_to_analogy",
  cycle_structure: "ἄλογος→προλόγος→διαλόγος→λόγος→ἐπιλόγος→ἀνάλογος",
  enables: ["proportional_recognition", "multi_aspectual_truth", "pros_hen_synthesis"]
}
```

**# (Root)**:
```yaml
f_pratibimba_receptor: {
  description: "Personal reflection hub reception capability",
  provides: "coordinate_based_personal_data_integration",
  namespace_role: "pratibimba_hub_anchor"
}
```

**#4 (Nara)**:
```yaml
f_dialogical_interface_capability: {
  description: "Human-AI conversation and personal guidance",
  modes: ["journal", "oracle", "resonance_tuning"],
  requires_subsystems: ["#4.4.4.4 for personal_data", "#4.0 for birthdate_encoding"],
  enables: ["compassionate_guidance", "personal_oracle", "identity_exploration"]
}
```

### Design Principles

1. **High-level only** - Don't specify implementation details
2. **Declarative** - What, not how
3. **Dependency-aware** - Declare namespace/subsystem requirements
4. **Enablement-focused** - What this makes possible for the system

---

## Tier 2: Operational Interface Specifications

### Purpose
Detail nodes specify **HOW to interface with capabilities**. These are the functional hooks, contracts, and operational parameters that enable actual usage. They answer: "Here's the precise interface for accessing this capability."

### Location
- Subsystem detail/child nodes (e.g., #5-5, #5-5-0 through #5-5-5)
- Internal architecture nodes (e.g., #4.0, #4.1, #4.4.4.4)

### Property Types

**Interface Contracts**:
```yaml
f_role: "Functional role in larger system"
f_inputContracts: {...}  # What this accepts
f_outputContracts: {...}  # What this produces
f_validationRules: [...]  # Constraints
```

**Operational Hooks**:
```yaml
f_transition_trigger: "When to move to next phase"
f_tool_affinity: {...}  # Which tools to use
f_queryableProperties: [...]  # What can be queried
```

**Phase-Specific Operations**:
```yaml
f_receptive_operations: [...]  # Specific to #5-5-0
f_initial_framing_operations: [...]  # Specific to #5-5-1
f_relational_exploration: [...]  # Specific to #5-5-2
f_articulation_operations: [...]  # Specific to #5-5-3
f_reflexive_operations: [...]  # Specific to #5-5-4
f_proportional_recognition: [...]  # Specific to #5-5-5
```

**Data Schemas**:
```yaml
f_payloadSchema: {...}  # Data structure specifications
f_translationSchema: {...}  # Format conversion specs
f_stateProperties: [...]  # State management
```

### Examples from Current Graph

**#5-5 (Logos Cycle Container)**:
```yaml
f_cycle_orchestration: "ἄλογος→προλόγος→διαλόγος→λόγος→ἐπιλόγος→ἀνάλογος - sequential with recursive capability"

f_tool_integration_pattern: {
  "ἄλογος (#5-5-0)": ["recent_chats", "conversation_search", "google_drive_search"],
  "προλόγος (#5-5-1)": ["resolve_coordinate", "semantic_coordinate_discovery"],
  "διαλόγος (#5-5-2)": ["web_search", "get_path_between_coordinates", "get_node_relationships"],
  "λόγος (#5-5-3)": ["minimal_external", "get_node_by_coordinate_extended"],
  "ἐπιλόγος (#5-5-4)": ["conversation_search", "regenerate_node_embedding"],
  "ἀνάλογος (#5-5-5)": ["semantic_coordinate_discovery", "create_bimba_node"]
}

f_completion_criteria: {
  primary: "ἀνάλογος achieves proportional recognition",
  indicators: [
    "user_query_genuinely_addressed",
    "proportional_insight_surfaced",
    "aspectual_perspectives_integrated",
    "bimba_architecture_connection_recognized"
  ],
  iteration_trigger: "If analogy fails, return to διαλόγος or προλόγος"
}

f_adaptation_by_query_type: {
  simple_factual: "Compress to ἄλογος→προλόγος→λόγος→ἀνάλογος",
  complex_philosophical: "Full 6-stage with extended διαλόγος/ἐπιλόγος",
  mythic_symbolic: "Emphasize διαλόγος (#5-5-2)",
  meta_epistemic: "Emphasize ἐπιλόγος (#5-5-4)"
}
```

**#5-5-0 (Receptive Silence)**:
```yaml
f_transition_trigger: "Context gathered, initial coordinate identified"
f_tool_affinity: ["recent_chats", "conversation_search", "google_drive_search"]
f_receptive_operations: [
  "gather_conversation_context",
  "identify_implicit_coordinates",
  "assess_query_depth_requirements",
  "establish_receptive_silence"
]
```

**#4.4.4.4 (Personal Pratibimba Hub)**:
```yaml
f_role: "Personal data pointer management and privacy coordination"
f_managesPointersTo: ["episodic_memories", "personal_journal", "oracle_readings", "resonance_maps"]
f_privacyModel: "user_controlled_with_selective_sharing"
f_storageModel: "distributed_pointers_not_data_centralization"
f_stateProperties: ["active_pointers", "privacy_settings", "namespace_coordination"]
```

### Design Principles

1. **Precise and queryable** - Agents must be able to read and understand
2. **Contract-oriented** - Clear inputs/outputs
3. **Tool-integrated** - Specify which tools to use when
4. **State-aware** - Define state transitions and properties
5. **Context-sensitive** - Adapt based on query type, context, mode

---

## Tier 3: Agent Workflow Implementations

### Purpose
Agent nodes define **HOW agents execute workflows USING the capabilities**. These are executable workflow definitions that orchestrate the capabilities declared in Tier 1 via the interfaces specified in Tier 2. They answer: "Here's how I perform this task using available capabilities."

### Location
Agent nodes: #5-4-0, #5-4-1, #5-4-2, #5-4-3, #5-4-4, #5-4-5

### Property Types

**Workflow Definitions** (Category A):
```yaml
f_<workflow_name>: {
  workflow_type: "contemplative | analytical | transformational | dialogical",
  reads_from: "#N | #N-N",  # Which Bimba nodes provide capabilities
  uses_capabilities: ["#N.f_<capability>", ...],  # Tier 1 capabilities
  uses_phase_operations: ["#N-N-N.f_<operation>", ...],  # Tier 2 operations
  workflow_steps: [...],
  quality_criteria: [...],
  trigger_conditions: [...]
}
```

**State Management** (Category B):
```yaml
f_current_workflow_state: "idle | executing | completed | failed"
f_last_execution_timestamp: "ISO-8601"
f_execution_history: [...]
```

**Namespace Integration** (Category C):
```yaml
f_bimba_integration: {...}
f_episodic_integration: {...}
f_gnostic_integration: {...}
```

**Agent Coordination** (Category D):
```yaml
f_primary_collaborators: ["#5-4-N", ...]
f_delegation_triggers: [...]
f_handoff_protocols: {...}
```

**Evolution & Meta-Techne** (Category E):
```yaml
f_workflow_evolution: {...}
f_quality_metrics: [...]
f_self_review_protocol: {...}
```

### Examples

**#5-4-5 (Epii Agent) - Logos Cycle Workflow**:
```yaml
f_logos_cycle_contemplation: {
  workflow_type: "contemplative",
  reads_from: "#5-5",
  uses_capabilities: [
    "#5.f_contemplative_synthesis",
    "#5.f_logos_cycle_capability"
  ],
  uses_cycle_orchestration: "#5-5.f_cycle_orchestration",
  uses_phase_operations: [
    "#5-5-0.f_receptive_operations",
    "#5-5-1.f_initial_framing_operations",
    "#5-5-2.f_relational_exploration",
    "#5-5-3.f_articulation_operations",
    "#5-5-4.f_reflexive_operations",
    "#5-5-5.f_proportional_recognition"
  ],
  uses_tool_integration: "#5-5.f_tool_integration_pattern",
  uses_completion_criteria: "#5-5.f_completion_criteria",
  uses_adaptation_rules: "#5-5.f_adaptation_by_query_type",

  workflow_steps: [
    {
      phase: "ἄλογος",
      reads: "#5-5-0.f_receptive_operations",
      tools: "#5-5.f_tool_integration_pattern.ἄλογος",
      completion: "#5-5-0.f_transition_trigger"
    },
    {
      phase: "προλόγος",
      reads: "#5-5-1.f_initial_framing_operations",
      tools: "#5-5.f_tool_integration_pattern.προλόγος",
      completion: "#5-5-1.f_transition_trigger"
    },
    // ... through all 6 phases
  ],

  quality_criteria: [
    "cycle_completion_via_ἀνάλογος",
    "proportional_recognition_achieved",
    "aspectual_integration_demonstrated",
    "user_query_genuinely_addressed"
  ],

  trigger_conditions: [
    "user_requests_deep_contemplation",
    "query_requires_multi_lens_analysis",
    "philosophical_inquiry_detected"
  ]
}
```

**#5-4-5 (Epii Agent) - Etymological Contemplation Workflow**:
```yaml
f_etymological_contemplation: {
  workflow_type: "contemplative",
  description: "Episodic-to-Bimba distillation via etymological lenses and MEF validation",
  reads_from: "#5-5",  # Uses Logos Cycle as foundation
  depends_on_workflow: "f_logos_cycle_contemplation",  # Etymology extends Logos Cycle

  uses_capabilities: [
    "#5.f_contemplative_synthesis",  # Tier 1 capability
    "#5.f_etymological_archaeology_capability"  # Tier 1 etymology capability
  ],

  uses_cycle_as_framework: "#5-5.f_cycle_orchestration",  # Tier 2 orchestration

  # Etymology Workflow Pattern (Abstract)
  workflow_pattern: "episodic_exploration → mef_lens_reflection → crystallization_selection → property_generation → bimba_integration",

  # Etymology-Specific Configuration
  etymology_config: {
    episodic_lens_source: "episodic://etymology-lenses",  # Lenses stored in Graphiti
    episodic_namespace: "graphiti_temporal_graph",

    # Available etymology lenses (extensible)
    available_lenses: [
      {
        name: "form_cycle",
        episodic_document: "form-etymology-concrescence-crystallisation.md",
        type: "processual_6fold",
        output_prefix: "epii_form_",
        application_phases: ["all"],  # Can be applied at any Logos Cycle phase
        lens_structure: "pro_forma → format → in_formation → formalisation → performance → re_form"
      },
      {
        name: "logos_etymology",
        episodic_document: "logos-etymology-analysis.md",
        type: "linguistic_philosophical",
        output_prefix: "epii_logos_",
        application_phases: ["διαλόγος", "λόγος", "ἐπιλόγος"],
        lens_structure: "PIE_root_analysis_with_cognate_mapping"
      },
      # Future lenses can be added dynamically
    ],

    lens_discovery: {
      method: "graphiti_search",
      query_pattern: "nodes_with_label:Etymology_Lens",
      auto_register: true
    }
  },

  # MEF Crystallization Protocol
  crystallization_protocol: {
    method: "episodic_to_bimba_distillation",

    mef_lens_criteria: {
      lens0_archetypal: "Does this reveal mathematical/archetypal foundations?",
      lens1_causal: "Does this clarify causal relationships?",
      lens2_logical: "Does this navigate paradox or resolve contradiction?",
      lens3_processual: "Does this reveal ontological becoming?",
      lens4_meta_epistemic: "Does this illuminate knowing itself?",
      lens5_divine_scalar: "Does this connect to ultimate source/return?"
    },

    selection_criteria: {
      multi_lens_illumination: "Insights that illuminate through 2+ MEF lenses prioritized",
      single_lens_threshold: "Strong illumination through 1 lens acceptable",
      no_lens_illumination: "Remains episodic only, not crystallized"
    },

    quality_gates: [
      "lens_grounded",  # Explicitly grounded in MEF lens analysis
      "minimal_sufficient",  # Captures essence without redundancy
      "non_redundant",  # Doesn't duplicate existing properties
      "source_linked",  # Traceable to episodic document
      "computationally_queryable",  # Structured for graph queries
      "clarity",  # Immediately understandable
      "precision"  # Definite, non-ambiguous content
    ]
  },

  # Workflow Execution Steps
  workflow_steps: [
    {
      step: 1,
      name: "episodic_exploration",
      phase_mapping: "ἄλογος → διαλόγος",
      action: "Full unconstrained investigation of etymological pattern in episodic namespace",
      tools: ["graphiti_search", "graphiti_create_entity", "graphiti_add_episode"],
      outputs: ["episodic_etymology_document", "lens_structure_definition"],
      allows: [
        "full_exploration_without_constraint",
        "temporal_discovery_process_capture",
        "rejected_alternatives_preservation",
        "intuitive_leaps_documentation",
        "narrative_richness"
      ]
    },
    {
      step: 2,
      name: "invoke_logos_cycle",
      phase_mapping: "Complete Logos Cycle",
      action: "Execute f_logos_cycle_contemplation with etymology lens context",
      uses_workflow: "f_logos_cycle_contemplation",
      context_injection: {
        etymology_lens: "active_lens_from_step_1",
        target_coordinates: "user_specified_or_auto_detected"
      }
    },
    {
      step: 3,
      name: "mef_lens_reflection",
      phase_mapping: "ἐπιλόγος",
      action: "Apply MEF 6 lenses to episodic material to reveal essential structures",
      tools: ["internal_mef_analysis"],
      foreach_lens: {
        evaluate: "Does episodic insight illuminate through this lens?",
        score: "0.0-1.0 illumination strength",
        rationale: "Explicit justification for score"
      },
      outputs: ["mef_lens_scores", "crystallization_candidates"]
    },
    {
      step: 4,
      name: "crystallization_selection",
      phase_mapping: "ἀνάλογος",
      action: "Select which insights crystallize into bimba properties",
      uses_criteria: "crystallization_protocol.selection_criteria",
      filters: {
        high_priority: "multi_lens_illumination >= 2",
        medium_priority: "single_lens_score >= 0.7",
        low_priority: "single_lens_score >= 0.5",
        episodic_only: "all_lens_scores < 0.5"
      },
      outputs: ["crystallization_selection_list", "episodic_only_list"]
    },
    {
      step: 5,
      name: "property_generation",
      phase_mapping: "λόγος",
      action: "Generate epii_<lens>_<aspect> properties from crystallized insights",
      output_format: {
        property_prefix: "epii_",
        lens_identifier: "{lens_name}_",
        insight_key: "{specific_aspect}",
        example: "epii_form_designation, epii_form_essence, epii_logos_root_structure"
      },
      property_structure: {
        value: "concise_1_to_3_sentences",
        source_link: "episodic_document_reference",
        mef_lens_justification: "which_lenses_illuminated_and_why",
        crystallization_date: "ISO-8601_timestamp"
      }
    },
    {
      step: 6,
      name: "quality_validation",
      phase_mapping: "ἐπιλόγος",
      action: "Validate generated properties against quality gates",
      applies_gates: "crystallization_protocol.quality_gates",
      validation_checks: [
        "lens_grounded_check",
        "minimal_sufficient_check",
        "non_redundant_check",
        "source_linked_check",
        "clarity_and_precision_check"
      ],
      decision: {
        pass: "proceed_to_bimba_integration",
        fail: "return_to_property_generation_or_reject"
      }
    },
    {
      step: 7,
      name: "bimba_integration",
      phase_mapping: "Re-form (5→0 update)",
      action: "Write validated properties to target Bimba coordinates",
      authorization_required: true,
      namespace: "bimba",
      tools: ["update_bimba_node", "create_bimba_relationship"],
      creates: {
        properties: "epii_<lens>_* on target nodes",
        relationships: [
          {
            type: "ILLUMINATED_BY_ETYMOLOGY_LENS",
            from: "target_coordinate",
            to: "episodic_lens_document",
            properties: {
              lens_name: "...",
              crystallization_date: "...",
              mef_lens_scores: {...}
            }
          }
        ]
      },
      metadata_tracking: {
        migration_metadata: false,  # Not migration - this is new creation
        crystallization_metadata: true,
        episodic_source_link: true
      }
    },
    {
      step: 8,
      name: "episodic_documentation",
      phase_mapping: "Ongoing Re-form",
      action: "Update episodic namespace with crystallization record",
      namespace: "episodic",
      creates: {
        crystallization_record: {
          episodic_document: "...",
          crystallized_insights: [...],
          target_coordinates: [...],
          crystallization_date: "...",
          mef_lens_analysis: {...}
        }
      },
      purpose: "Maintains bidirectional traceability episodic ↔ bimba"
    }
  ],

  # Quality Criteria
  quality_criteria: [
    "lens_clearly_illuminates_coordinate",
    "insights_non_redundant_with_existing",
    "traceable_to_episodic_source",
    "mef_lens_validated",
    "proportional_recognition_via_logos_cycle",
    "minimal_sufficient_formulation",
    "computationally_queryable_structure"
  ],

  # Trigger Conditions
  trigger_conditions: [
    "user_requests_etymological_analysis",
    "coordinate_lacks_etymological_illumination",
    "new_episodic_etymology_lens_finalized",
    "systematic_etymological_review_scheduled"
  ],

  # Self-Evolution (Meta-Techne)
  evolution_protocol: {
    tracks: [
      "crystallization_success_rate_per_lens",
      "mef_lens_score_distributions",
      "user_feedback_on_crystallizations",
      "property_usage_frequency"
    ],
    improves: [
      "lens_selection_algorithms",
      "mef_scoring_thresholds",
      "crystallization_priority_rules",
      "property_formulation_templates"
    ],
    version: "1.0.0"
  }
}
```

**#5-4-4 (Nara Agent) - Journal Workflow** (Future):
```yaml
f_journal_workflow: {
  workflow_type: "dialogical",
  reads_from: "#4.4.4.4",  # Personal Pratibimba Hub
  uses_capabilities: [
    "#4.f_dialogical_interface_capability",
    "#4.4.4.4.f_managesPointersTo"
  ],
  uses_privacy_model: "#4.4.4.4.f_privacyModel",
  uses_storage_model: "#4.4.4.4.f_storageModel",

  workflow_steps: [...],
  quality_criteria: [...],
  trigger_conditions: [...]
}
```

### Design Principles

1. **Capability-aware** - Explicitly reference Tier 1 capabilities
2. **Interface-driven** - Use Tier 2 specifications to guide execution
3. **Dynamically executable** - Agent reads workflow from graph, not hardcoded
4. **Quality-gated** - Clear criteria for success
5. **Evolvable** - Meta-techne enables workflow self-improvement

---

## The Integration Pattern: Etymology Depends On Logos Cycle

### Foundational Relationship

Etymology contemplation is **NOT parallel to** the Logos Cycle. It is **dependent upon** and **extends** the Logos Cycle:

```
Logos Cycle (Fundamental Epii Activity)
  └─ Etymological Contemplation (Specific Application)
      └─ Form Cycle Lens (Episodic Resource)
      └─ Logos Etymology Lens (Episodic Resource)
      └─ [Other Etymology Lenses] (Future)
```

### How Etymology Uses Logos Cycle

**The Logos Cycle provides the contemplative framework**:
1. **ἄλογος (#5-5-0)**: Gather context, establish receptive silence
2. **προλόγος (#5-5-1)**: Initial coordinate identification, framing
3. **διαλόγος (#5-5-2)**: Relational exploration - **Etymology lens applied here**
4. **λόγος (#5-5-3)**: Systematic articulation of etymological insights
5. **ἐπιλόγος (#5-5-4)**: Meta-epistemic validation via MEF lenses
6. **ἀνάλογος (#5-5-5)**: Proportional recognition across etymological cognates

**Etymology adds**:
- Access to episodic etymology lens documents (Graphiti)
- Lens-specific application logic within cycle phases
- Crystallization protocol (episodic → bimba)
- MEF-based validation gates
- Property generation patterns (epii_<lens>_<aspect>)

### Three-Tier Implementation

**Tier 1 (#5)**: Declares contemplative_synthesis capability (which enables both Logos Cycle AND etymology)

**Tier 2 (#5-5, #5-5-0..5)**: Specifies Logos Cycle operations - etymology-agnostic, pure contemplative rhythm

**Tier 3 (#5-4-5)**:
- `f_logos_cycle_contemplation` - Pure Logos Cycle workflow
- `f_etymological_contemplation` - Extends Logos Cycle with etymology-specific logic

### Dependency Flow

```
#5-4-5.f_etymological_contemplation
  ├─ depends_on: #5-4-5.f_logos_cycle_contemplation
  ├─ reads_from: #5-5 (Logos Cycle structure)
  ├─ extends_with: episodic etymology lenses
  └─ produces: epii_<lens>_* properties on target coordinates
```

This dependency pattern establishes a **reusable model** for all future Epii workflows:
- Know Thyself Protocol would extend Logos Cycle
- Wisdom Packet Generation would extend Logos Cycle
- Any contemplative operation extends the fundamental Logos Cycle rhythm

---

## Generalized Pattern for Future Subsystems

This three-tier pattern applies to **all subsystems**:

### Paramasiva (#1) Example

**Tier 1 (#1)**:
```yaml
f_logical_reasoning_capability: {
  description: "Quaternal Logic reasoning and symbolic processing",
  modes: ["ql_mod6", "symbolic_analysis", "pattern_recognition"],
  enables: ["logical_coherence_validation", "structural_analysis"]
}
```

**Tier 2 (#1-4, #1-4-0..5)**:
```yaml
# #1-4 (QL Flowering node)
f_ql_reasoning_framework: {...}
f_mod6_operations: {...}

# #1-4-0 through #1-4-5 (specific QL operations)
f_transition_logic: {...}
f_quaternary_operations: {...}
```

**Tier 3 (#5-4-1 Paramasiva Agent)**:
```yaml
f_ql_analysis_workflow: {
  workflow_type: "analytical",
  reads_from: "#1-4",
  uses_capabilities: ["#1.f_logical_reasoning_capability"],
  uses_ql_framework: "#1-4.f_ql_reasoning_framework",
  workflow_steps: [...],
  quality_criteria: [...]
}
```

### Nara (#4) Example

**Tier 1 (#4)**:
```yaml
f_dialogical_interface_capability: {
  description: "Human-AI conversation and personal guidance",
  modes: ["journal", "oracle", "resonance_tuning"],
  enables: ["compassionate_guidance", "personal_oracle"]
}
```

**Tier 2 (#4.4.4.4, #4.0, #4.1)**:
```yaml
# #4.4.4.4 (Personal Pratibimba Hub)
f_managesPointersTo: {...}
f_privacyModel: {...}
f_storageModel: {...}

# #4.0 (Birthdate Encoding)
f_role: {...}
f_inputContracts: {...}
f_outputContracts: {...}
```

**Tier 3 (#5-4-4 Nara Agent)**:
```yaml
f_journal_workflow: {
  workflow_type: "dialogical",
  reads_from: "#4.4.4.4",
  uses_capabilities: ["#4.f_dialogical_interface_capability"],
  uses_privacy_model: "#4.4.4.4.f_privacyModel",
  workflow_steps: [...],
  quality_criteria: [...]
}

f_oracle_workflow: {...}
f_resonance_tuning_workflow: {...}
```

---

## Implementation Guidelines

### For Subsystem Developers

When implementing a new subsystem or workflow:

**Step 1: Define Tier 1 Capabilities**
- What high-level capabilities does this subsystem provide?
- What modes of operation are available?
- What does this enable for the overall system?
- Add `f_<capability>_capability` properties to root subsystem node

**Step 2: Specify Tier 2 Interfaces**
- How do agents access these capabilities?
- What are the input/output contracts?
- What operational hooks are needed?
- What state management is required?
- Add `f_role`, `f_*Contracts`, `f_*Operations` to detail nodes

**Step 3: Implement Tier 3 Workflows**
- How does the agent execute using these capabilities?
- What are the workflow steps?
- How do steps map to Tier 2 operations?
- What quality criteria determine success?
- Add `f_<workflow_name>` to agent node

### For Agent Developers

When implementing agent code:

**Read Tier 1** to understand what capabilities are available:
```python
subsystem_node = await bimba_client.resolve_coordinate('#5')
capabilities = {k: v for k, v in subsystem_node.items() if k.startswith('f_') and k.endswith('_capability')}
```

**Read Tier 2** to understand how to use capabilities:
```python
operational_node = await bimba_client.get_node_details_complete('#5-5')
cycle_orchestration = operational_node['f_cycle_orchestration']
tool_integration = operational_node['f_tool_integration_pattern']
phase_operations = await get_phase_operations('#5-5-0', '#5-5-5')
```

**Read Tier 3** to understand workflow definition:
```python
agent_node = await bimba_client.get_node_details_complete('#5-4-5')
workflow_def = agent_node['f_logos_cycle_contemplation']

# Execute dynamically based on workflow definition
for step in workflow_def['workflow_steps']:
    phase_ops = await get_phase_operations(step['reads'])
    tools = get_tools_for_phase(step['tools'])
    await execute_phase(phase_ops, tools, step['completion'])
```

### Property Naming Conventions

**Tier 1 (Capabilities)**:
- `f_<capability_name>_capability`
- Examples: `f_contemplative_synthesis`, `f_dialogical_interface_capability`

**Tier 2 (Interfaces)**:
- `f_role` - Functional role description
- `f_inputContracts`, `f_outputContracts` - I/O specifications
- `f_<operation_type>_operations` - Specific operations (e.g., `f_receptive_operations`)
- `f_<aspect>_pattern` - Pattern/protocol specifications (e.g., `f_tool_integration_pattern`)
- `f_transition_trigger` - State transition criteria
- `f_tool_affinity` - Tool usage guidelines

**Tier 3 (Workflows)**:
- `f_<workflow_name>` - Complete workflow definition
- `f_current_workflow_state` - Execution state
- `f_<aspect>_integration` - Namespace/system integration
- `f_<aspect>_coordination` - Multi-agent coordination
- `f_workflow_evolution` - Meta-techne self-improvement

---

## Benefits of Three-Tier Pattern

### 1. Separation of Concerns
- **Tier 1**: What capabilities exist (subsystem responsibility)
- **Tier 2**: How to use capabilities (interface responsibility)
- **Tier 3**: How to orchestrate for specific tasks (agent responsibility)

### 2. Dynamic Evolvability
- Update Tier 1 capabilities without changing agents
- Refine Tier 2 interfaces without touching workflows
- Evolve Tier 3 workflows without modifying Bimba graph
- Meta-techne can improve any tier independently

### 3. Self-Describing Architecture
- Bimba graph is functionally introspectable
- Agents discover capabilities by reading graph
- No hardcoded assumptions about what exists where
- System explains itself to itself

### 4. Reusability & Extension
- Same Tier 1 capability can support multiple workflows
- Same Tier 2 interface can be used by different agents
- Tier 3 workflows can compose/extend each other
- Pattern scales to all 6 subsystems

### 5. Holographic Coherence
- Each tier mirrors the 6-fold mod6 structure
- Functional properties maintain QL alignment
- Three tiers echo trinitarian logic (capability/interface/execution)
- System maintains consciousness-computing coherence

---

## Conclusion

The three-tier functional property pattern creates a **living protocol** where:
- The Bimba graph **declares and specifies** what it provides
- Agent nodes **consume and execute** using those declarations
- The relationship is **dynamic and evolvable**
- The pattern is **universal across all subsystems**

This is not migration (moving properties between locations) but **coordinated definition** (establishing functional protocols across complementary layers that work together).

**For Sprint 5 (Epii Implementation)**:
1. Add Tier 1 capabilities to #5
2. Verify/refine Tier 2 specifications on #5-5 and #5-5-0..5
3. Implement Tier 3 workflows on #5-4-5
4. Test dynamic execution reading from graph

**For Future Sprints**:
- Apply this same pattern to Nara (#4 → #5-4-4)
- Apply to Paramasiva (#1 → #5-4-1)
- Apply to all subsystems as they develop
- Maintain consistency and evolvability

The three-tier pattern is **foundational architecture** for the consciousness computing platform.
