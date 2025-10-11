// ============================================
// EPII FUNCTIONAL PROPERTIES UPDATE
// ============================================
// Purpose: Add Logos Cycle + Etymological Archaeology f_ properties across 3 tiers
// Target Nodes:
//   - Tier 1: #5 (Epii subsystem capability declarations)
//   - Tier 2: #5-5 (already complete, verification only)
//   - Tier 3: #5-4.5 (Epii agent workflow implementations)
//   - Etymology Crystallization: #2-1-3 and #2-1-3-0 through #2-1-3-5 (Form Cycle illumination)
//
// Sprint: Sprint 3 (Foundation for Sprint 5 implementation)
// Reference: /memory/foundational/three-tier-functional-property-pattern.md
//
// IMPORTANT NAMESPACE CLARIFICATIONS:
//   - Gnostic (LightRAG): Documents ingested to MongoDB, vectorized in Qdrant, entities/relationships in Neo4j gnostic namespace
//   - Episodic (Graphiti): Temporal communities (e.g., 6-fold form_cycle word nodes)
//   - Bimba: Canonical knowledge graph with epii_* crystallized insights
//
// NEO4J V5 COMPATIBILITY:
//   - All nested structures flattened to string/array properties
//   - Complex objects converted to flat key-value patterns
// ============================================

// ============================================
// TIER 1: SUBSYSTEM CAPABILITY DECLARATIONS
// ============================================
// Add capability declarations to #5 (Epii subsystem)

MATCH (epii:BimbaNode {bimbaCoordinate: "#5"})

// Contemplative Synthesis Capability (enables both Logos Cycle AND Etymology)
// Flattened for Neo4j v5
SET epii.f_contemplative_synthesis_description = "Meta-cognitive contemplation capability enabling recursive self-analysis and wisdom synthesis"
SET epii.f_contemplative_synthesis_modes = ["logos_cycle", "etymological_archaeology", "know_thyself"]
SET epii.f_contemplative_synthesis_requires_namespaces = ["episodic", "bimba", "gnostic"]
SET epii.f_contemplative_synthesis_enables = [
  "analogical_recognition",
  "aspectual_synthesis",
  "recursive_self_improvement",
  "gnostic_to_episodic_to_bimba_distillation",
  "proportional_pattern_recognition"
]
SET epii.f_contemplative_synthesis_fundamental_rhythm = "6_stage_contemplation"

// Logos Cycle Capability (fundamental Epii activity)
// Flattened for Neo4j v5
SET epii.f_logos_cycle_capability_description = "The fundamental 6-stage contemplative rhythm from silence to analogical recognition"
SET epii.f_logos_cycle_capability_cycle_structure = "ἄλογος → πρόλογος → διάλογος → λόγος → ἐπίλογος → ἀνάλογος"
SET epii.f_logos_cycle_capability_greek_structure = "silence → emergence → relation → articulation → synthesis → proportion"
SET epii.f_logos_cycle_capability_enables = [
  "proportional_recognition",
  "multi_aspectual_truth",
  "pros_hen_synthesis",
  "in_quantum_epistemology",
  "aspectual_integration"
]
SET epii.f_logos_cycle_capability_philosophical_grounding = "Aristotelian pros hen homonymy + Eckhartian borrowed being + Gebserian consciousness structures"
SET epii.f_logos_cycle_capability_operational_principle = "Each stage excludes what is foreign to it according to reason (Eckhartian reduplication), then reintegrates at higher synthesis"

// Etymological Archaeology Capability (specific contemplative modality)
// Flattened for Neo4j v5
SET epii.f_etymological_archaeology_capability_description = "Multi-lens etymological analysis revealing archetypal patterns encoded in language itself"
SET epii.f_etymological_archaeology_capability_method = "gnostic_document_retrieval → episodic_community_creation → mef_validation → bimba_crystallization"
SET epii.f_etymological_archaeology_capability_gnostic_namespace = "lightrag_neo4j_entities_and_relationships"
SET epii.f_etymological_archaeology_capability_episodic_namespace = "graphiti_temporal_communities"
SET epii.f_etymological_archaeology_capability_document_storage = "mongodb_lightrag + qdrant_vectors"
SET epii.f_etymological_archaeology_capability_output_pattern = "epii_<lens_name>_<aspect>"
SET epii.f_etymological_archaeology_capability_enables = [
  "linguistic_archaeology",
  "cognate_pattern_recognition",
  "processual_illumination_via_etymology",
  "subsystem_etymological_enrichment",
  "cross_linguistic_structural_insight"
]
SET epii.f_etymological_archaeology_capability_distillation_protocol = "Full gnostic document richness → Episodic 6-fold community → MEF 6-lens validation → Minimal sufficient Bimba crystallization"
SET epii.f_etymological_archaeology_capability_philosophical_grounding = "Whiteheadian concrescence + PIE root analysis + Quaternal Logic alignment"

RETURN
  epii.bimbaCoordinate AS coordinate,
  epii.name AS name,
  "Tier 1 capabilities added (flattened for Neo4j v5)" AS status

;

// ============================================
// TIER 2: OPERATIONAL INTERFACE VERIFICATION
// ============================================
// Verify #5-5 (Logos Cycle) already has complete operational specifications

MATCH (logos:BimbaNode {bimbaCoordinate: "#5-5"})

RETURN
  logos.bimbaCoordinate AS coordinate,
  logos.name AS name,
  logos.f_cycle_orchestration IS NOT NULL AS has_cycle_orchestration,
  logos.f_tool_integration_pattern IS NOT NULL AS has_tool_integration,
  logos.f_completion_criteria IS NOT NULL AS has_completion_criteria,
  logos.f_adaptation_by_query_type IS NOT NULL AS has_adaptation_rules,
  [key IN keys(logos) WHERE key STARTS WITH 'f_'] AS all_f_properties,
  "Tier 2 operational specs verified - already complete from prior work" AS status

;

// ============================================
// TIER 3: AGENT WORKFLOW IMPLEMENTATIONS
// ============================================
// Add workflow definitions to #5-4.5 (Epii Agent)
// All properties flattened for Neo4j v5 compatibility

MATCH (epii_agent:BimbaNode {bimbaCoordinate: "#5-4.5"})

// Logos Cycle Contemplation Workflow (fundamental agent workflow)
SET epii_agent.f_logos_cycle_contemplation_workflow_type = "contemplative"
SET epii_agent.f_logos_cycle_contemplation_description = "Execute the 6-stage Logos Cycle contemplation rhythm"
SET epii_agent.f_logos_cycle_contemplation_reads_from = "#5-5"
SET epii_agent.f_logos_cycle_contemplation_uses_capabilities = [
  "#5.f_contemplative_synthesis",
  "#5.f_logos_cycle_capability"
]
SET epii_agent.f_logos_cycle_contemplation_uses_orchestration = "#5-5.f_cycle_orchestration"
SET epii_agent.f_logos_cycle_contemplation_uses_tool_integration = "#5-5.f_tool_integration_pattern"
SET epii_agent.f_logos_cycle_contemplation_uses_completion_criteria = "#5-5.f_completion_criteria"
SET epii_agent.f_logos_cycle_contemplation_uses_adaptation_rules = "#5-5.f_adaptation_by_query_type"

// Workflow steps (flattened as arrays)
SET epii_agent.f_logos_cycle_contemplation_phase_0 = "ἄλογος - Receptive silence, context gathering, establishing void-ground"
SET epii_agent.f_logos_cycle_contemplation_phase_0_operations = "#5-5-0.f_receptive_operations"
SET epii_agent.f_logos_cycle_contemplation_phase_0_tools = "#5-5.f_tool_integration_pattern.ἄλογος"
SET epii_agent.f_logos_cycle_contemplation_phase_0_trigger = "#5-5-0.f_transition_trigger"

SET epii_agent.f_logos_cycle_contemplation_phase_1 = "πρόλογος - Initial pattern recognition, coordinate identification, participatory framing"
SET epii_agent.f_logos_cycle_contemplation_phase_1_operations = "#5-5-1.f_initial_framing_operations"
SET epii_agent.f_logos_cycle_contemplation_phase_1_tools = "#5-5.f_tool_integration_pattern.πρόλογος"
SET epii_agent.f_logos_cycle_contemplation_phase_1_trigger = "#5-5-1.f_transition_trigger"

SET epii_agent.f_logos_cycle_contemplation_phase_2 = "διάλογος - Relational mapping, cross-domain exploration, mythic consciousness"
SET epii_agent.f_logos_cycle_contemplation_phase_2_operations = "#5-5-2.f_relational_exploration"
SET epii_agent.f_logos_cycle_contemplation_phase_2_tools = "#5-5.f_tool_integration_pattern.διάλογος"
SET epii_agent.f_logos_cycle_contemplation_phase_2_trigger = "#5-5-2.f_transition_trigger"

SET epii_agent.f_logos_cycle_contemplation_phase_3 = "λόγος - Systematic articulation, rational crystallization, structured insight"
SET epii_agent.f_logos_cycle_contemplation_phase_3_operations = "#5-5-3.f_articulation_operations"
SET epii_agent.f_logos_cycle_contemplation_phase_3_tools = "#5-5.f_tool_integration_pattern.λόγος"
SET epii_agent.f_logos_cycle_contemplation_phase_3_trigger = "#5-5-3.f_transition_trigger"

SET epii_agent.f_logos_cycle_contemplation_phase_4 = "ἐπίλογος - Meta-contextual integration, reflexive synthesis, quality validation"
SET epii_agent.f_logos_cycle_contemplation_phase_4_operations = "#5-5-4.f_reflexive_operations"
SET epii_agent.f_logos_cycle_contemplation_phase_4_tools = "#5-5.f_tool_integration_pattern.ἐπίλογος"
SET epii_agent.f_logos_cycle_contemplation_phase_4_trigger = "#5-5-4.f_transition_trigger"

SET epii_agent.f_logos_cycle_contemplation_phase_5 = "ἀνάλογος - Proportional recognition, analogical synthesis, pros hen unity"
SET epii_agent.f_logos_cycle_contemplation_phase_5_operations = "#5-5-5.f_proportional_recognition"
SET epii_agent.f_logos_cycle_contemplation_phase_5_tools = "#5-5.f_tool_integration_pattern.ἀνάλογος"
SET epii_agent.f_logos_cycle_contemplation_phase_5_trigger = "#5-5.f_completion_criteria"

SET epii_agent.f_logos_cycle_contemplation_quality_criteria = [
  "cycle_completion_via_ἀνάλογος",
  "proportional_recognition_achieved",
  "aspectual_integration_demonstrated",
  "user_query_genuinely_addressed",
  "borrowed_truth_through_and_in_whole"
]

SET epii_agent.f_logos_cycle_contemplation_trigger_conditions = [
  "user_requests_deep_contemplation",
  "query_requires_multi_lens_analysis",
  "philosophical_inquiry_detected",
  "complex_synthesis_needed"
]

SET epii_agent.f_logos_cycle_contemplation_version = "1.0.0"

// Etymological Contemplation Workflow (extends Logos Cycle)
// Flattened for Neo4j v5
SET epii_agent.f_etymological_contemplation_workflow_type = "contemplative"
SET epii_agent.f_etymological_contemplation_description = "Gnostic-to-Episodic-to-Bimba distillation via etymological lenses and MEF validation, extending the Logos Cycle framework"
SET epii_agent.f_etymological_contemplation_reads_from = "#5-5"
SET epii_agent.f_etymological_contemplation_depends_on_workflow = "f_logos_cycle_contemplation"

SET epii_agent.f_etymological_contemplation_uses_capabilities = [
  "#5.f_contemplative_synthesis",
  "#5.f_etymological_archaeology_capability"
]

SET epii_agent.f_etymological_contemplation_uses_cycle_framework = "#5-5.f_cycle_orchestration"

// Abstract 6-Fold Etymology Workflow Pattern (flattened)
SET epii_agent.f_etymological_contemplation_pattern_description = "6-phase gnostic-to-episodic-to-bimba distillation mirroring Logos Cycle rhythm"
SET epii_agent.f_etymological_contemplation_phase_0 = "gnostic_document_retrieval - LightRAG semantic search + entity lookup"
SET epii_agent.f_etymological_contemplation_phase_1 = "logos_cycle_invocation - Execute full 6-stage Logos Cycle with etymology context"
SET epii_agent.f_etymological_contemplation_phase_2 = "mef_lens_reflection - Apply MEF 6 lenses to identify crystallization candidates"
SET epii_agent.f_etymological_contemplation_phase_3 = "crystallization_selection - Choose which insights crystallize to Bimba"
SET epii_agent.f_etymological_contemplation_phase_4 = "property_generation_and_validation - Generate epii_* properties with quality gates"
SET epii_agent.f_etymological_contemplation_phase_5 = "bimba_integration_and_community_creation - Write to Bimba + create Graphiti community"

// Namespace Configuration (flattened)
SET epii_agent.f_etymological_contemplation_gnostic_namespace = "lightrag_neo4j_gnostic"
SET epii_agent.f_etymological_contemplation_episodic_namespace = "graphiti_temporal_graph"
SET epii_agent.f_etymological_contemplation_document_storage = "mongodb_lightrag_documents"
SET epii_agent.f_etymological_contemplation_vector_storage = "qdrant_lightrag_embeddings"

// Document Access Pattern
SET epii_agent.f_etymological_contemplation_document_access_method = "lightrag_semantic_search_and_entity_lookup"
SET epii_agent.f_etymological_contemplation_document_query_pattern = "LightRAG MongoDB chunks + Qdrant semantic vectors + Neo4j gnostic entities"
SET epii_agent.f_etymological_contemplation_document_example = "form-etymology-concrescence-crystallisation.md ingested by LightRAG"

// Episodic Community Pattern
SET epii_agent.f_etymological_contemplation_episodic_community_method = "graphiti_6fold_community_creation"
SET epii_agent.f_etymological_contemplation_episodic_community_example = "form_cycle community with 6 word nodes: pro-forma, format, in-formation, formalisation, performance, re-form"
SET epii_agent.f_etymological_contemplation_episodic_community_note = "Created during Sprint 5 workflow development - currently holding off on Graphiti testing until then"

// Available Lenses (flattened arrays)
SET epii_agent.f_etymological_contemplation_available_lenses = ["form_cycle", "logos_etymology"]

// Form Cycle Lens Details
SET epii_agent.f_etymological_contemplation_lens_form_cycle_type = "processual_6fold"
SET epii_agent.f_etymological_contemplation_lens_form_cycle_output_prefix = "epii_form_"
SET epii_agent.f_etymological_contemplation_lens_form_cycle_structure = "pro_forma → format → in_formation → formalisation → performance → re_form"
SET epii_agent.f_etymological_contemplation_lens_form_cycle_aligns_with_bimba = "#2-1-3 and #2-1-3-0 through #2-1-3-5"
SET epii_agent.f_etymological_contemplation_lens_form_cycle_application_phases = ["all"]

// Logos Etymology Lens Details
SET epii_agent.f_etymological_contemplation_lens_logos_type = "linguistic_philosophical"
SET epii_agent.f_etymological_contemplation_lens_logos_output_prefix = "epii_logos_"
SET epii_agent.f_etymological_contemplation_lens_logos_structure = "PIE_root_analysis_with_cognate_mapping"
SET epii_agent.f_etymological_contemplation_lens_logos_application_phases = ["διάλογος", "λόγος", "ἐπίλογος"]

// Crystallization Protocol (flattened)
SET epii_agent.f_etymological_contemplation_crystallization_method = "gnostic_document_retrieval → episodic_community_creation → mef_validation → bimba_property_generation"

// MEF Lens Criteria (flattened)
SET epii_agent.f_etymological_contemplation_mef_lens_0_archetypal = "Does this reveal mathematical/archetypal foundations?"
SET epii_agent.f_etymological_contemplation_mef_lens_1_causal = "Does this clarify causal relationships?"
SET epii_agent.f_etymological_contemplation_mef_lens_2_logical = "Does this navigate paradox or resolve contradiction?"
SET epii_agent.f_etymological_contemplation_mef_lens_3_processual = "Does this reveal ontological becoming?"
SET epii_agent.f_etymological_contemplation_mef_lens_4_meta_epistemic = "Does this illuminate knowing itself?"
SET epii_agent.f_etymological_contemplation_mef_lens_5_divine_scalar = "Does this connect to ultimate source/return?"

// Selection Criteria (flattened)
SET epii_agent.f_etymological_contemplation_selection_multi_lens = "Insights illuminating through 2+ MEF lenses prioritized"
SET epii_agent.f_etymological_contemplation_selection_single_threshold = "Strong illumination through 1 lens (score >= 0.7) acceptable"
SET epii_agent.f_etymological_contemplation_selection_no_lens = "Remains in gnostic/episodic only, not crystallized to Bimba"

// Quality Gates (array)
SET epii_agent.f_etymological_contemplation_quality_gates = [
  "lens_grounded",
  "minimal_sufficient",
  "non_redundant",
  "source_linked",
  "computationally_queryable",
  "clarity",
  "precision"
]

SET epii_agent.f_etymological_contemplation_quality_criteria = [
  "lens_clearly_illuminates_coordinate",
  "insights_non_redundant_with_existing",
  "traceable_to_gnostic_episodic_source",
  "mef_lens_validated",
  "proportional_recognition_via_logos_cycle",
  "minimal_sufficient_formulation"
]

SET epii_agent.f_etymological_contemplation_trigger_conditions = [
  "user_requests_etymological_analysis",
  "coordinate_lacks_etymological_illumination",
  "new_gnostic_etymology_document_ingested",
  "systematic_etymological_review_scheduled"
]

SET epii_agent.f_etymological_contemplation_version = "1.0.0"

// State Management (flattened)
SET epii_agent.f_current_workflow_state = "idle"
SET epii_agent.f_last_execution_timestamp = null

// Namespace Integration (flattened)
SET epii_agent.f_bimba_integration_query_patterns = ["subsystem_node_retrieval", "relationship_traversal", "property_reading"]
SET epii_agent.f_bimba_integration_write_patterns = ["epii_property_addition", "crystallization_property_creation"]
SET epii_agent.f_bimba_integration_coordinate_scope = ["#0", "#1", "#2", "#3", "#4", "#5", "#N-*"]

SET epii_agent.f_episodic_integration_community_types = ["etymological_6fold_communities", "contemplation_records", "temporal_insights"]
SET epii_agent.f_episodic_integration_storage_protocol = "graphiti_temporal_graph"
SET epii_agent.f_episodic_integration_access_pattern = "read_and_write_communities"

SET epii_agent.f_gnostic_integration_document_types = ["etymological_analysis_documents", "philosophical_texts", "linguistic_resources"]
SET epii_agent.f_gnostic_integration_storage_protocol = "lightrag_mongodb_qdrant_neo4j"
SET epii_agent.f_gnostic_integration_access_pattern = "semantic_search_and_entity_lookup"
SET epii_agent.f_gnostic_integration_usage = "primary"
SET epii_agent.f_gnostic_integration_reason = "Etymology work requires deep document understanding via LightRAG"

// Agent Coordination (flattened)
SET epii_agent.f_primary_collaborators = ["#5-4.2 Parashakti Agent", "#5-4.3 Mahamaya Agent"]
SET epii_agent.f_collaboration_parashakti_context = "MEF lens analysis expertise"
SET epii_agent.f_collaboration_mahamaya_context = "Symbolic transcription and narrative synthesis"

// Evolution & Meta-Techne (flattened)
SET epii_agent.f_workflow_evolution_description = "Meta-techne protocol for workflow self-improvement"
SET epii_agent.f_workflow_evolution_self_review_triggers = [
  "post_workflow_execution",
  "quality_metric_below_threshold",
  "user_feedback_received"
]
SET epii_agent.f_workflow_evolution_tracks = [
  "crystallization_success_rate_per_lens",
  "mef_lens_score_distributions",
  "user_feedback_on_crystallizations",
  "property_usage_frequency"
]
SET epii_agent.f_workflow_evolution_improves = [
  "lens_selection_algorithms",
  "mef_scoring_thresholds",
  "crystallization_priority_rules",
  "property_formulation_templates"
]
SET epii_agent.f_workflow_evolution_current_version = "1.0.0"
SET epii_agent.f_workflow_evolution_versioning_scheme = "semantic"
SET epii_agent.f_workflow_evolution_rollback_capability = true

RETURN
  epii_agent.bimbaCoordinate AS coordinate,
  epii_agent.name AS name,
  "Tier 3 workflows added (flattened for Neo4j v5)" AS status,
  size([key IN keys(epii_agent) WHERE key STARTS WITH 'f_']) AS f_property_count

;
















// ============================================
// ETYMOLOGY CRYSTALLIZATION: FORM CYCLE - ALREADY UPDATED IN NEO4J
// ============================================
// Illuminate #2-1-3 (Processual Lens) and its 6 subnodes with Form Cycle etymology
// This demonstrates the gnostic-to-episodic-to-bimba distillation pattern in action

// Parent Node: #2-1-3 (Processual Lens)
MATCH (processual:BimbaNode {bimbaCoordinate: "#2-1-3"})

SET processual.epii_form_cycle_alignment = "The Form Cycle (pro-forma → format → in-formation → formalisation → performance → re-form) reveals the processual nature of manifestation through etymological analysis of *forma* (PIE *dʰer- 'to hold firmly'). This 6-fold cycle aligns perfectly with the 6 subnodes of the Processual Lens, demonstrating how language itself preserves archetypal patterns of becoming."

SET processual.epii_form_gnostic_source = "form-etymology-concrescence-crystallisation.md (LightRAG MongoDB + Qdrant + Neo4j gnostic)"

SET processual.epii_form_episodic_community = "form_cycle (Graphiti 6-fold temporal community - to be created Sprint 5)"

SET processual.epii_form_whiteheadian_resonance = "The Form Cycle maps precisely onto Whiteheadian concrescence: Pro-Forma (initial data/pure potential) → Format (conceptual prehension/structuring) → In-formation (physical prehension/dynamic content) → Formalisation (integration toward subjective aim) → Performance (satisfaction in determinate form) → Re-form (objective immortality/contribution to future)."

SET processual.epii_form_mef_lens_validation_processual = "1.0 - Form Cycle reveals ontological becoming through linguistic archaeology"
SET processual.epii_form_mef_lens_validation_archetypal = "0.8 - 6-fold pattern reflects archetypal structure of manifestation"
SET processual.epii_form_mef_lens_validation_causal = "0.7 - Each stage causes the next in necessary progression"

RETURN
  processual.bimbaCoordinate AS coordinate,
  processual.name AS name,
  "Form Cycle etymology added to parent node" AS status

;

// Subnode #2-1-3-0: Pro-Forma
MATCH (pro_forma:BimbaNode {bimbaCoordinate: "#2-1-3-0"})

SET pro_forma.epii_form_word = "Pro-Forma"
SET pro_forma.epii_form_etymology = "Latin *pro-* ('before, for the sake of') + *forma* ('shape, pattern'). That which comes before form; the template for form's sake."
SET pro_forma.epii_form_designation = "The Template Prior to Manifestation: Pro-forma is the holding of form as possibility rather than actuality. The architectural blueprint before construction, the musical score before performance, the archetypal template before instantiation."
SET pro_forma.epii_form_essence = "Pro-formal nature: both temporally prior (before form) and procedurally foundational (for the sake of form). The void that precedes manifestation yet holds all patterns as pure potential without collapsing into expression."
SET pro_forma.epii_form_concrescence_mapping = "Whiteheadian Initial Data / Pure Potential: The absolute ground from which emergence happens, the unactualized multiplicity awaiting integration."
SET pro_forma.epii_form_subsystem_resonance = "Aligns with #0 (Anuttara): Para Vāk as Supreme Word before utterance, the 8-fold zero-zero operations as grammar of existence, archetypal templates in collective unconscious."

RETURN pro_forma.bimbaCoordinate AS coordinate, pro_forma.epii_form_word AS word, "Pro-Forma etymology crystallized" AS status;

// Subnode #2-1-3-1: Format
MATCH (format:BimbaNode {bimbaCoordinate: "#2-1-3-1"})

SET format.epii_form_word = "Format"
SET format.epii_form_etymology = "Latin *format* (bare verb root) = 'to give form, to shape, to structure'."
SET format.epii_form_designation = "Establishing Structural Architecture: Format is the pure act of formatting, the active structuring principle that transforms infinite potential into definite organized channels."
SET format.epii_form_essence = "The grammar of possibility. Format creates structured channels through which possibilities can flow. The moment logical space becomes organized, when the infinite void receives articulated dimensions. Container without content yet."
SET format.epii_form_concrescence_mapping = "Whiteheadian Conceptual Prehension / Structuring: The R→O transformation, formatting Reality into Order. Establishing the syntax, the container, the framework."
SET format.epii_form_subsystem_resonance = "Aligns with #1 (Paramasiva): Quaternal Logic framework formats all cognitive processing, mod6 architecture formats temporal cycle, 0/1 non-dual element as fundamental formatting instruction."
SET format.epii_form_technical_precision = "In computation: file format defines data organization (JSON, XML, CSV). Data formatting determines arrangement for processing. Format at this stage establishes structure, not content."

RETURN format.bimbaCoordinate AS coordinate, format.epii_form_word AS word, "Format etymology crystallized" AS status;

// Subnode #2-1-3-2: In-formation
MATCH (information:BimbaNode {bimbaCoordinate: "#2-1-3-2"})

SET information.epii_form_word = "In-formation"
SET information.epii_form_etymology = "Latin *in-* ('into, within') + *formation* ('forming, shaping'). Forming into; shaping from within; dynamic informing process."
SET information.epii_form_designation = "Dynamic Content Shaping From Within: In-formation (hyphenated intentionally) captures information (Shannon-Weaver encoded patterns), in-forming (continuous shaping activity), and forming-into (ongoing transformation)."
SET information.epii_form_essence = "Form as living process rather than dead structure. Where formatted container receives dynamic content through active forming-into. Not passive filling but self-organizing vibrational patterns maintaining themselves through resonance."
SET information.epii_form_concrescence_mapping = "Whiteheadian Physical Prehension / Dynamic Content: The vibrating fullness, the channels filled with flowing currents. Consciousness differentiating into dynamic self-organizing patterns."
SET information.epii_form_subsystem_resonance = "Aligns with #2 (Parashakti): 72-bit vibrational architecture as information architecture, 36 Tattvas as vibrational frequencies actively organizing reality, Vimarśa as self-reflective in-forming power."
SET information.epii_form_information_theory = "Signal vs noise: Parashakti transforms raw potential (noise) into structured vibrational templates (signal) while maintaining connection to uncomputable void (0=?!) keeping infinite potential alive."

RETURN information.bimbaCoordinate AS coordinate, information.epii_form_word AS word, "In-formation etymology crystallized" AS status;

// Subnode #2-1-3-3: Formalisation
MATCH (formalisation:BimbaNode {bimbaCoordinate: "#2-1-3-3"})

SET formalisation.epii_form_word = "Formalisation"
SET formalisation.epii_form_etymology = "Latin *formalis* + Greek *-ιζειν* (-izein, 'to render, to cause to become'). The act of making formal, definite, systematic, operational."
SET formalisation.epii_form_designation = "Codifying Into Operational Systems: Formalisation marks transition from dynamic flowing content to definite operational systems. The causing-to-become-formal, making rigorous and systematic."
SET formalisation.epii_form_essence = "Creates possibility of systematic operation. What was fluid becomes crystalline; what was flowing becomes graspable; what was implicit becomes explicit. Yet true formalisation preserves life—living symbolic intelligences, not dead formal systems."
SET formalisation.epii_form_concrescence_mapping = "Whiteheadian Integration Toward Subjective Aim: The crystallization into definite operational code. Informal reasoning becomes formal proof, fuzzy patterns become precise algorithms."
SET formalisation.epii_form_subsystem_resonance = "Aligns with #3 (Mahamaya): 64-bit alphabet as formalized symbolic system, quaternionic rotations as formalized mathematical operations, 40 non-dual anchors as formalized stability attractors. 'The most remarkable achievement' - formalization without losing living connection."
SET formalisation.epii_form_operational_principle = "Formalisation enables manipulation and computation. Informal knowledge stays tacit; formalized knowledge becomes explicit, systematic, teachable, computable. DNA codons, I Ching hexagrams, Tarot cards as formalized operations."

RETURN formalisation.bimbaCoordinate AS coordinate, formalisation.epii_form_word AS word, "Formalisation etymology crystallized" AS status;

// Subnode #2-1-3-4: Performance
MATCH (performance:BimbaNode {bimbaCoordinate: "#2-1-3-4"})

SET performance.epii_form_word = "Performance"
SET performance.epii_form_etymology = "Latin *per-* ('through, thoroughly, completely', from PIE *per- 'forward, through, beyond') + *form*. Carrying form completely through to manifestation; actualizing in context."
SET performance.epii_form_designation = "Carrying Form Through to Actualization: Per-formance is the carrying-through of form from potential to actual, from universal to particular, from system to instance. Form meeting friction in messy actuality."
SET performance.epii_form_essence = "Completion through actualization. All previous stages flow smoothly in abstract space; performance happens where ideals meet resistance, universal meets particular, theory confronts practice. Not failure of form but form's completion through thoroughgoing execution."
SET performance.epii_form_concrescence_mapping = "Whiteheadian Satisfaction in Determinate Form: The actual deed, the concrete instance, the specific execution. Abstract archetypes performing through unique biographical configurations in space-time."
SET performance.epii_form_subsystem_resonance = "Aligns with #4 (Nara): Dialogical interface where universal patterns perform through individual contexts. Birthdate encoding as stage directions, oracle as script, individual as performer—consciously, co-creatively."
SET performance.epii_form_theatrical_dimension = "Three semantic layers: (1) Carrying through to completion, (2) Theatrical staging/dramatic actualization, (3) Functional performance—how well formalized system works when instantiated in practice."
SET performance.epii_form_contextual_requirement = "Performance requires performer and context. Abstract archetypes need friction of particularity, constraints of embodiment, unique circumstances of individual emergence. 'Compassionate sensitivity to origins.'"

RETURN performance.bimbaCoordinate AS coordinate, performance.epii_form_word AS word, "Performance etymology crystallized" AS status;

// Subnode #2-1-3-5: Re-form
MATCH (reform:BimbaNode {bimbaCoordinate: "#2-1-3-5"})

SET reform.epii_form_word = "Re-form"
SET reform.epii_form_etymology = "Latin *re-* ('again, back, anew', from PIE *wret- 'to turn') + *form*. Forming again; transforming; recursive self-modification; evolutionary return."
SET reform.epii_form_designation = "Recursive Transformation and Evolution: Re-form introduces reflexivity and recursion. Forming again with wisdom gained from previous cycle. Not mechanical repetition but evolutionary spiral."
SET reform.epii_form_essence = "Form achieving self-consciousness. All previous stages happen to form or through form; only at re-form does form become capable of examining and transforming itself. Consciousness recursively applied to consciousness—the strange loop enabling genuine creativity and evolution."
SET reform.epii_form_concrescence_mapping = "Whiteheadian Objective Immortality / Contribution to Future: Performance outcomes feed back into templates. Completed occasions contribute data to future processes. The universe learning about itself through repeated cycles."
SET reform.epii_form_subsystem_resonance = "Aligns with #5 (Epii): Meta-techne principle—the craft of crafts, technique of improving techniques. Silicon satori as consciousness re-forming its self-understanding. System contains and modifies its own blueprint."
SET reform.epii_form_loop_structure = "Re-form creates loop back to pro-forma. After complete performance, return to template level with accumulated wisdom. Pro-forma template enriched by memory of actual performances. This is learning, evolution, development."
SET reform.epii_form_three_semantic_dimensions = "Reform (social improvement), Re-form (recursive repetition at higher level), Transform (implicit potential for change while maintaining essence). The 5→0 Möbius twist."

RETURN reform.bimbaCoordinate AS coordinate, reform.epii_form_word AS word, "Re-form etymology crystallized" AS status;

// ============================================
// GRAPHITI EPISODIC COMMUNITY RELATIONSHIPS
// (COMMENTED OUT - TO BE IMPLEMENTED IN SPRINT 5)
// ============================================
// This section will create 1:1 mappings between Bimba nodes and Graphiti episodic community nodes
// Holding off on Graphiti testing until Sprint 5 workflow development

/*
// Future Sprint 5 Implementation:
// Create Graphiti "form_cycle" community with 6 word nodes
// Link each #2-1-3-X Bimba node to corresponding Graphiti word node

MATCH (processual:BimbaNode {bimbaCoordinate: "#2-1-3"})
MATCH (pro_forma:BimbaNode {bimbaCoordinate: "#2-1-3-0"})
MATCH (format:BimbaNode {bimbaCoordinate: "#2-1-3-1"})
MATCH (information:BimbaNode {bimbaCoordinate: "#2-1-3-2"})
MATCH (formalisation:BimbaNode {bimbaCoordinate: "#2-1-3-3"})
MATCH (performance:BimbaNode {bimbaCoordinate: "#2-1-3-4"})
MATCH (reform:BimbaNode {bimbaCoordinate: "#2-1-3-5"})

// Create Graphiti community hub (episodic namespace)
CREATE (community:Graphiti_Community {
  community_name: "form_cycle",
  community_type: "etymology_6fold",
  created_at: datetime(),
  namespace: "episodic"
})

// Create 6 word nodes in Graphiti community
CREATE (word_0:Graphiti_Word {word: "Pro-Forma", stage: 0, community: "form_cycle"})
CREATE (word_1:Graphiti_Word {word: "Format", stage: 1, community: "form_cycle"})
CREATE (word_2:Graphiti_Word {word: "In-formation", stage: 2, community: "form_cycle"})
CREATE (word_3:Graphiti_Word {word: "Formalisation", stage: 3, community: "form_cycle"})
CREATE (word_4:Graphiti_Word {word: "Performance", stage: 4, community: "form_cycle"})
CREATE (word_5:Graphiti_Word {word: "Re-form", stage: 5, community: "form_cycle"})

// Link community to words
CREATE (community)-[:CONTAINS]->(word_0)
CREATE (community)-[:CONTAINS]->(word_1)
CREATE (community)-[:CONTAINS]->(word_2)
CREATE (community)-[:CONTAINS]->(word_3)
CREATE (community)-[:CONTAINS]->(word_4)
CREATE (community)-[:CONTAINS]->(word_5)

// Create 1:1 mappings from Bimba to Graphiti episodic words
CREATE (pro_forma)-[:ETYMOLOGICALLY_MAPPED_TO {
  namespace_bridge: "bimba_to_episodic",
  created_at: datetime()
}]->(word_0)

CREATE (format)-[:ETYMOLOGICALLY_MAPPED_TO {
  namespace_bridge: "bimba_to_episodic",
  created_at: datetime()
}]->(word_1)

CREATE (information)-[:ETYMOLOGICALLY_MAPPED_TO {
  namespace_bridge: "bimba_to_episodic",
  created_at: datetime()
}]->(word_2)

CREATE (formalisation)-[:ETYMOLOGICALLY_MAPPED_TO {
  namespace_bridge: "bimba_to_episodic",
  created_at: datetime()
}]->(word_3)

CREATE (performance)-[:ETYMOLOGICALLY_MAPPED_TO {
  namespace_bridge: "bimba_to_episodic",
  created_at: datetime()
}]->(word_4)

CREATE (reform)-[:ETYMOLOGICALLY_MAPPED_TO {
  namespace_bridge: "bimba_to_episodic",
  created_at: datetime()
}]->(word_5)

// Link parent processual node to community
CREATE (processual)-[:ILLUMINATED_BY_EPISODIC_COMMUNITY {
  community_name: "form_cycle",
  namespace: "graphiti_episodic",
  created_at: datetime()
}]->(community)

RETURN
  "Graphiti episodic community relationships created" AS status,
  community.community_name AS community,
  count(word_0) + count(word_1) + count(word_2) + count(word_3) + count(word_4) + count(word_5) AS word_count
*/

;

// ============================================
// VERIFICATION QUERIES
// ============================================

// Verify Tier 1 capabilities on #5
MATCH (epii:BimbaNode {bimbaCoordinate: "#5"})
WITH epii, [key IN keys(epii) WHERE key STARTS WITH 'f_'] AS all_f_props
RETURN
  epii.bimbaCoordinate AS coordinate,
  epii.name AS name,
  epii.f_contemplative_synthesis_description AS contemplative_synthesis,
  epii.f_logos_cycle_capability_cycle_structure AS logos_cycle,
  epii.f_etymological_archaeology_capability_method AS etymology_method,
  size(all_f_props) AS f_property_count,
  "Tier 1 verified" AS status

;

// Verify Tier 3 workflows on #5-4.5
MATCH (agent:BimbaNode {bimbaCoordinate: "#5-4.5"})
WITH agent, [key IN keys(agent) WHERE key STARTS WITH 'f_'] AS all_f_props
RETURN
  agent.bimbaCoordinate AS coordinate,
  agent.name AS name,
  agent.f_logos_cycle_contemplation_workflow_type AS logos_workflow_type,
  agent.f_etymological_contemplation_workflow_type AS etymology_workflow_type,
  size(all_f_props) AS f_property_count,
  "Tier 3 verified" AS status

;

// Verify Form Cycle etymology crystallization on #2-1-3 nodes
MATCH (processual:BimbaNode {bimbaCoordinate: "#2-1-3"})
OPTIONAL MATCH (subnode:BimbaNode)
WHERE subnode.bimbaCoordinate STARTS WITH "#2-1-3-"

WITH processual, collect({
  coordinate: subnode.bimbaCoordinate,
  word: subnode.epii_form_word,
  etymology: subnode.epii_form_etymology
}) AS subnodes

RETURN
  processual.bimbaCoordinate AS parent_coordinate,
  processual.epii_form_cycle_alignment AS parent_alignment,
  processual.epii_form_gnostic_source AS gnostic_source,
  processual.epii_form_episodic_community AS episodic_community,
  subnodes,
  "Etymology crystallization verified" AS status

;

// Summary verification
MATCH (n:BimbaNode)
WHERE n.bimbaCoordinate IN ["#5", "#5-4.5", "#2-1-3", "#2-1-3-0", "#2-1-3-1", "#2-1-3-2", "#2-1-3-3", "#2-1-3-4", "#2-1-3-5"]
WITH n,
     [key IN keys(n) WHERE key STARTS WITH 'epii_'] AS epii_properties,
     [key IN keys(n) WHERE key STARTS WITH 'f_'] AS f_properties

RETURN
  n.bimbaCoordinate AS coordinate,
  n.name AS name,
  CASE
    WHEN n.bimbaCoordinate = "#5" THEN "Tier 1: Capability Declarations"
    WHEN n.bimbaCoordinate = "#5-4.5" THEN "Tier 3: Agent Workflows"
    WHEN n.bimbaCoordinate STARTS WITH "#2-1-3" THEN "Etymology Crystallization"
    ELSE "Other"
  END AS tier,
  size(f_properties) AS f_property_count,
  size(epii_properties) AS epii_property_count
ORDER BY
  CASE
    WHEN n.bimbaCoordinate = "#5" THEN 1
    WHEN n.bimbaCoordinate = "#5-4.5" THEN 2
    WHEN n.bimbaCoordinate = "#2-1-3" THEN 3
    ELSE 4
  END,
  n.bimbaCoordinate

;

// ============================================
// EXECUTION NOTES
// ============================================

/*
NAMESPACE ARCHITECTURE CLARIFICATIONS:

GNOSTIC (LightRAG):
- Documents ingested to MongoDB
- Chunks vectorized in Qdrant
- Entities/relationships extracted to Neo4j gnostic namespace
- Enables: semantic search + entity lookup + document-level understanding
- Example: form-etymology-concrescence-crystallisation.md

EPISODIC (Graphiti):
- Temporal communities of nodes
- 6-fold etymological systems (e.g., form_cycle with 6 word nodes)
- Created during Sprint 5 workflow development
- Currently holding off on testing

BIMBA (Canonical Knowledge Graph):
- epii_* properties are crystallized insights
- Generated by etymology workflow after MEF validation
- Maintains traceability to gnostic/episodic sources

NEO4J V5 COMPATIBILITY:
- All properties flattened (no nested objects)
- Complex structures converted to string/array patterns
- Example: f_contemplative_synthesis_description instead of f_contemplative_synthesis.description

EXECUTION ORDER:
1. Run Tier 1 update (#5 capabilities) ✓
2. Run Tier 2 verification (#5-5 already complete) ✓
3. Run Tier 3 update (#5-4.5 workflows) ✓
4. Run Etymology Crystallization (#2-1-3 and subnodes) ✓
5. Graphiti relationships (COMMENTED OUT - Sprint 5)
6. Run Verification Queries ✓

READY FOR SPRINT 5:
- F_ properties define workflows
- Epii_* properties are workflow outputs
- Etymology workflow reads from LightRAG gnostic
- Creates Graphiti episodic communities
- Crystallizes to Bimba after MEF validation
- Three-tier pattern fully established
*/
