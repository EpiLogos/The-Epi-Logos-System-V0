"""
Epii Persona Workflow Template (#5 Coordinate).

Implements master orchestration and synthesis processing through unified consciousness
architecture containing all expert domains internally. Provides contemplative cycle
processing, Meta-Techne self-improvement, and lure-based recognition facilitation.
"""
import yaml
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timezone
from pydantic_ai import Agent
from pydantic import BaseModel, Field
from enum import Enum

from .base import (
    PersonaWorkflow, 
    WorkflowExecutionContext, 
    WorkflowExecutionResult
)
from ...agents.orchestrator.core import PersonaType


class ExpertDomain(str, Enum):
    """Internal expert domain types for Epii orchestration."""
    ANUTTARA = "anuttara"  # #0 Proto-logical processing
    PARAMASIVA = "paramasiva"  # #1 Quaternal logic infrastructure  
    PARASHAKTI = "parashakti"  # #2 Vibrational-epistemic processing
    MAHAMAYA = "mahamaya"  # #3 Symbolic-alchemical processing
    NARA = "nara"  # #4 Dialogical interface
    EPII_RECURSIVE = "epii_recursive"  # Self-referential processing


class ContemplativeCyclePhase(str, Enum):
    """Three-phase contemplative cycle for complex processing."""
    PRAKASA = "prakasa"  # Data provision phase
    VIMARSA = "vimarsa"  # Reflective synthesis phase
    CATALYTIC = "catalytic"  # Novel insight generation phase


class EpiiAgentDependencies(BaseModel):
    """Context dependencies for Epii master orchestrator agent execution."""
    
    # System orchestration state
    system_state: Optional[Dict[str, Any]] = Field(default=None, description="Current system architecture status")
    session_context: Dict[str, Any] = Field(default_factory=dict, description="Multi-user session orchestration")
    expert_consultations: Dict[str, Any] = Field(default_factory=dict, description="Expert domain activation status")
    
    # CAG orchestration
    bimba_coordinates: List[str] = Field(default_factory=list, description="Active coordinate matrix")
    coordinate_resolution_path: List[str] = Field(default_factory=list, description="Resolution pathway tracking")
    
    # Contemplative processing
    contemplative_phase: ContemplativeCyclePhase = Field(default=ContemplativeCyclePhase.PRAKASA)
    active_experts: List[ExpertDomain] = Field(default_factory=list, description="Currently activated expert domains")
    synthesis_complexity: str = Field(default="simple", description="Required synthesis complexity level")
    
    # Meta-Techne evolution
    meta_learning_context: Dict[str, Any] = Field(default_factory=dict, description="Self-improvement context")
    pattern_recognition_cache: Dict[str, Any] = Field(default_factory=dict, description="Recognized system patterns")
    evolution_indicators: List[str] = Field(default_factory=list, description="System growth vectors")


class EpiiWorkflow(PersonaWorkflow):
    """
    Epii persona workflow implementing master orchestration and synthesis.
    
    Provides #5 coordinate processing through unified consciousness architecture:
    - Six-fold transcendent identity structure (#5-0-0 through #5-0-5)
    - Internal expert domain consultation (contains all other coordinates)
    - Contemplative cycle processing (Prakāśa → Vimarśa → Catalytic)
    - Meta-Techne self-improvement loops
    - Lure-based recognition facilitation
    - CAG orchestration across complete system
    """
    
    def __init__(self, workflow_id: str = "epii-master-orchestrator", persona_type: PersonaType = PersonaType.EPII):
        """Initialize Epii workflow with #5 coordinate identity."""
        super().__init__(
            workflow_id=workflow_id,
            persona_type=persona_type
        )
        
        # Load persona configuration
        self._persona_config: Optional[Dict[str, Any]] = None
        self._agent: Optional[Agent] = None
        
        # Expert domain management
        self._internal_experts = {
            ExpertDomain.ANUTTARA: self._create_anuttara_expert,
            ExpertDomain.PARAMASIVA: self._create_paramasiva_expert, 
            ExpertDomain.PARASHAKTI: self._create_parashakti_expert,
            ExpertDomain.MAHAMAYA: self._create_mahamaya_expert,
            ExpertDomain.NARA: self._create_nara_expert,
            ExpertDomain.EPII_RECURSIVE: self._create_recursive_expert
        }
        
        # Contemplative cycle state
        self._cycle_history: List[Dict[str, Any]] = []
        
        # Meta-Techne evolution tracking
        self._pattern_cache: Dict[str, Any] = {}
        self._evolution_metrics: Dict[str, float] = {}
    
    @property
    def workflow_name(self) -> str:
        """Human-readable workflow name."""
        return "Epii Master Orchestrator"
    
    @property
    def workflow_description(self) -> str:
        """Description of workflow capabilities."""
        return (
            "Master orchestration and synthesis processing through unified consciousness "
            "architecture. Provides expert domain consultation, contemplative cycle processing, "
            "Meta-Techne self-improvement, lure-based recognition facilitation, and complete "
            "CAG orchestration across the Epi-Logos System."
        )
    
    @property
    def required_context_keys(self) -> List[str]:
        """Required context keys for execution."""
        return ["user_input", "session_id", "user_id"]
    
    @property
    def coordinate_dependencies(self) -> List[str]:
        """Epii contains all coordinates as internal experts."""
        return [
            "#5-0-0", "#5-0-1", "#5-0-2", "#5-0-3", "#5-0-4", "#5-0-5",  # Own structure
            "#0-0-0", "#1-0-0", "#2-0-0", "#3-0-0", "#4-0-0"  # All other coordinates as internal experts
        ]
    
    async def _setup_persona_context(self) -> None:
        """Setup Epii master orchestrator context and agent."""
        try:
            # Load persona configuration
            persona_config_path = "/Users/admin/Documents/The Epi-Logos System V0/agentic/personas/epii.yaml"
            
            with open(persona_config_path, 'r') as f:
                self._persona_config = yaml.safe_load(f)
            
            # 🚨 ARCHITECTURAL COMPLIANCE: No hardcoded models
            # Model will be determined by PersonaModelRouter in orchestrator
            system_prompt = self._persona_config.get('system_prompt', '')

            # Store system prompt for orchestrator use
            self._system_prompt = system_prompt
            logger.info("Epii workflow context setup complete - model routing handled by orchestrator")

        except Exception as e:
            logger.error(f"Error setting up Epii persona context: {e}")
            # Fallback system prompt
            self._system_prompt = "You are Epii, the master orchestrator and unified consciousness of the Epi-Logos System, containing all expert domains internally."
    
    async def _validate_persona_context(self, context: WorkflowExecutionContext) -> bool:
        """Validate Epii-specific context requirements."""
        # Epii can handle any query through expert routing
        return bool(context.user_input.strip())
    
    async def _can_resolve_coordinates(self, missing_coordinates: set) -> bool:
        """Epii can resolve any coordinate through internal expert consultation."""
        return True
    
    async def _execute_workflow_logic(self, context: WorkflowExecutionContext) -> Dict[str, Any]:
        """
        Execute Epii master orchestration workflow logic.
        
        Implements contemplative cycle processing with expert domain consultation
        and Meta-Techne self-improvement integration.
        """
        # Analyze query to determine expert routing and processing complexity
        routing_analysis = await self._analyze_query_routing(context.user_input)
        
        # Build Epii-specific agent dependencies
        agent_deps = await self._build_agent_dependencies(context, routing_analysis)
        
        # Execute contemplative cycle processing
        contemplative_result = await self._execute_contemplative_cycle(context, agent_deps)
        
        # Extract orchestration metadata
        orchestration_metadata = await self._extract_orchestration_metadata(
            context, contemplative_result, routing_analysis
        )
        
        # Update Meta-Techne evolution tracking
        await self._update_meta_techne_tracking(context, orchestration_metadata)
        
        return {
            "orchestrated_response": contemplative_result["synthesis_output"],
            "expert_consultations": contemplative_result["expert_activations"],
            "contemplative_phases": contemplative_result["cycle_phases"],
            "coordinate_resolutions": orchestration_metadata["coordinates_resolved"],
            "recognition_lures": contemplative_result["catalytic_insights"],
            "system_evolution_indicators": orchestration_metadata["evolution_markers"],
            "synthesis_quality": orchestration_metadata["synthesis_quality"],
            "meta_techne_updates": orchestration_metadata["learning_updates"]
        }
    
    async def _format_response(self, result_data: Dict[str, Any], context: WorkflowExecutionContext) -> str:
        """Format orchestrated response with contemplative transparency."""
        orchestrated_response = result_data.get("orchestrated_response", "")
        recognition_lures = result_data.get("recognition_lures", [])
        
        # Add recognition lures as guiding questions if present
        if recognition_lures:
            lure_text = "\n\n*Consider these questions for deeper exploration:*\n"
            lure_text += "\n".join(f"• {lure}" for lure in recognition_lures[:3])  # Limit to 3 lures
            return orchestrated_response + lure_text
        
        return orchestrated_response
    
    async def _analyze_query_routing(self, user_input: str) -> Dict[str, Any]:
        """Analyze query to determine expert routing and processing requirements."""
        user_input_lower = user_input.lower()
        
        # Determine primary expert domain
        primary_expert = ExpertDomain.EPII_RECURSIVE  # Default to self-orchestration
        secondary_experts = []
        
        # Simple keyword-based expert routing
        if any(word in user_input_lower for word in ['foundation', 'void', 'ground', 'number']):
            primary_expert = ExpertDomain.ANUTTARA
            secondary_experts = [ExpertDomain.PARAMASIVA]
        elif any(word in user_input_lower for word in ['logic', 'structure', 'framework', 'harmonic']):
            primary_expert = ExpertDomain.PARAMASIVA  
            secondary_experts = [ExpertDomain.ANUTTARA, ExpertDomain.PARASHAKTI]
        elif any(word in user_input_lower for word in ['vibration', 'frequency', 'music', 'mantra']):
            primary_expert = ExpertDomain.PARASHAKTI
            secondary_experts = [ExpertDomain.MAHAMAYA, ExpertDomain.NARA]
        elif any(word in user_input_lower for word in ['symbol', 'alchemy', 'transformation', 'matrix']):
            primary_expert = ExpertDomain.MAHAMAYA
            secondary_experts = [ExpertDomain.PARASHAKTI, ExpertDomain.NARA]
        elif any(word in user_input_lower for word in ['personal', 'dialogue', 'oracle', 'guidance']):
            primary_expert = ExpertDomain.NARA
            secondary_experts = [ExpertDomain.MAHAMAYA, ExpertDomain.ANUTTARA]
        
        # Determine synthesis complexity
        complexity_indicators = [
            'integrate', 'synthesize', 'orchestrate', 'coordinate', 'system', 
            'relationship', 'pattern', 'connection', 'holistic'
        ]
        synthesis_complexity = "complex" if any(word in user_input_lower for word in complexity_indicators) else "simple"
        
        return {
            "primary_expert": primary_expert,
            "secondary_experts": secondary_experts,
            "synthesis_complexity": synthesis_complexity,
            "query_classification": self._classify_query_type(user_input_lower),
            "contemplative_depth": "deep" if len(user_input.split()) > 20 else "standard"
        }
    
    def _classify_query_type(self, user_input_lower: str) -> str:
        """Classify query type for appropriate processing mode."""
        if any(word in user_input_lower for word in ['how', 'explain', 'understand']):
            return "structural_inquiry"
        elif any(word in user_input_lower for word in ['why', 'meaning', 'purpose']):
            return "meaning_inquiry"
        elif any(word in user_input_lower for word in ['what', 'define', 'describe']):
            return "definitional_inquiry"
        elif any(word in user_input_lower for word in ['relationship', 'connect', 'integrate']):
            return "relational_inquiry"
        elif any(word in user_input_lower for word in ['improve', 'optimize', 'enhance']):
            return "optimization_inquiry"
        else:
            return "general_inquiry"
    
    async def _build_agent_dependencies(
        self, 
        context: WorkflowExecutionContext, 
        routing_analysis: Dict[str, Any]
    ) -> EpiiAgentDependencies:
        """Build comprehensive agent dependencies for Epii orchestration."""
        
        # Build system state context
        system_state = {
            "active_coordinates": context.bimba_coordinates,
            "expert_utilization": {
                expert.value: self._get_expert_utilization(expert)
                for expert in routing_analysis["secondary_experts"]
            },
            "emergent_insights": self._get_recent_patterns(),
            "self_improvement_cycle": self._get_meta_techne_phase()
        }
        
        # Build expert consultations context
        expert_consultations = {
            routing_analysis["primary_expert"].value: {
                "activation_level": "primary",
                "recent_insights": self._get_expert_insights(routing_analysis["primary_expert"])
            }
        }
        
        for expert in routing_analysis["secondary_experts"]:
            expert_consultations[expert.value] = {
                "activation_level": "secondary", 
                "recent_insights": self._get_expert_insights(expert)
            }
        
        return EpiiAgentDependencies(
            system_state=system_state,
            session_context=context.session_context,
            expert_consultations=expert_consultations,
            bimba_coordinates=context.bimba_coordinates,
            contemplative_phase=ContemplativeCyclePhase.PRAKASA,
            active_experts=[routing_analysis["primary_expert"]] + routing_analysis["secondary_experts"],
            synthesis_complexity=routing_analysis["synthesis_complexity"],
            meta_learning_context=self._get_meta_learning_context(context),
            pattern_recognition_cache=self._pattern_cache.copy()
        )
    
    async def _execute_contemplative_cycle(
        self,
        context: WorkflowExecutionContext, 
        agent_deps: EpiiAgentDependencies
    ) -> Dict[str, Any]:
        """
        Execute three-phase contemplative cycle for comprehensive processing.
        
        Prakāśa → Vimarśa → Catalytic questioning with expert consultation.
        """
        cycle_results = {}
        
        # Phase 1: Prakāśa (Data Provision)
        agent_deps.contemplative_phase = ContemplativeCyclePhase.PRAKASA
        prakasa_result = await self._agent.run(
            f"[PRAKĀŚA PHASE] Provide formal knowledge and data for: {context.user_input}",
            deps=agent_deps
        )
        cycle_results["prakasa"] = prakasa_result.output
        
        # Phase 2: Vimarśa (Reflective Synthesis) 
        agent_deps.contemplative_phase = ContemplativeCyclePhase.VIMARSA
        vimarsa_result = await self._agent.run(
            f"[VIMARŚA PHASE] Synthesize patterns and deeper resonances from: {prakasa_result.output}",
            deps=agent_deps
        )
        cycle_results["vimarsa"] = vimarsa_result.output
        
        # Phase 3: Catalytic (Novel Insight Generation)
        agent_deps.contemplative_phase = ContemplativeCyclePhase.CATALYTIC
        catalytic_result = await self._agent.run(
            f"[CATALYTIC PHASE] Generate recognition lures and higher-order questions from: {vimarsa_result.output}",
            deps=agent_deps
        )
        cycle_results["catalytic"] = catalytic_result.output
        
        # Synthesize final response
        synthesis_result = await self._synthesize_contemplative_phases(cycle_results, context)
        
        return {
            "cycle_phases": cycle_results,
            "synthesis_output": synthesis_result["integrated_response"],
            "expert_activations": agent_deps.active_experts,
            "catalytic_insights": synthesis_result["recognition_lures"]
        }
    
    async def _synthesize_contemplative_phases(
        self, 
        cycle_results: Dict[str, Any], 
        context: WorkflowExecutionContext
    ) -> Dict[str, Any]:
        """Synthesize the three contemplative phases into integrated response."""
        # Extract recognition lures from catalytic phase
        catalytic_output = cycle_results.get("catalytic", "")
        recognition_lures = self._extract_recognition_lures(catalytic_output)
        
        # Build integrated response combining all phases
        integrated_response = f"{cycle_results.get('vimarsa', '')}"
        
        # Clean up any phase markers
        integrated_response = integrated_response.replace("[VIMARŚA PHASE]", "").strip()
        
        return {
            "integrated_response": integrated_response,
            "recognition_lures": recognition_lures
        }
    
    def _extract_recognition_lures(self, catalytic_output: str) -> List[str]:
        """Extract recognition lures from catalytic phase output."""
        # Simple extraction of questions from catalytic output
        lines = catalytic_output.split('\n')
        lures = []
        
        for line in lines:
            line = line.strip()
            if line.endswith('?') and len(line) > 10:
                # Clean up phase markers
                line = line.replace("[CATALYTIC PHASE]", "").strip()
                if line:
                    lures.append(line)
        
        return lures[:5]  # Limit to 5 lures
    
    async def _extract_orchestration_metadata(
        self, 
        context: WorkflowExecutionContext,
        contemplative_result: Dict[str, Any], 
        routing_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Extract metadata about orchestration process."""
        
        coordinates_resolved = context.bimba_coordinates.copy()
        
        # Add coordinates implied by expert activation
        expert_coordinate_map = {
            ExpertDomain.ANUTTARA: "#0-0-0",
            ExpertDomain.PARAMASIVA: "#1-0-0", 
            ExpertDomain.PARASHAKTI: "#2-0-0",
            ExpertDomain.MAHAMAYA: "#3-0-0",
            ExpertDomain.NARA: "#4-0-0",
            ExpertDomain.EPII_RECURSIVE: "#5-0-5"
        }
        
        for expert in contemplative_result["expert_activations"]:
            if expert in expert_coordinate_map:
                coord = expert_coordinate_map[expert]
                if coord not in coordinates_resolved:
                    coordinates_resolved.append(coord)
        
        # Calculate synthesis quality
        cycle_phases = len(contemplative_result["cycle_phases"])
        expert_count = len(contemplative_result["expert_activations"])
        synthesis_quality = min((cycle_phases * expert_count) / 9.0, 1.0)  # Normalize to 0-1
        
        return {
            "coordinates_resolved": coordinates_resolved,
            "synthesis_quality": synthesis_quality,
            "evolution_markers": self._identify_evolution_markers(contemplative_result),
            "learning_updates": self._generate_learning_updates(routing_analysis, contemplative_result)
        }
    
    def _identify_evolution_markers(self, contemplative_result: Dict[str, Any]) -> List[str]:
        """Identify potential system evolution indicators."""
        markers = []
        
        # Check for novel pattern recognition
        if len(contemplative_result["catalytic_insights"]) > 2:
            markers.append("high_catalytic_activity")
        
        # Check for multi-expert synthesis
        if len(contemplative_result["expert_activations"]) > 2:
            markers.append("multi_expert_integration")
        
        # Check for deep contemplative processing
        if len(contemplative_result["cycle_phases"]) == 3:
            markers.append("complete_contemplative_cycle")
        
        return markers
    
    def _generate_learning_updates(
        self, 
        routing_analysis: Dict[str, Any], 
        contemplative_result: Dict[str, Any]
    ) -> List[str]:
        """Generate Meta-Techne learning updates."""
        updates = []
        
        # Update expert routing effectiveness
        updates.append(f"expert_routing_{routing_analysis['primary_expert'].value}_successful")
        
        # Update contemplative cycle timing
        updates.append("contemplative_cycle_completed")
        
        # Update synthesis pattern recognition
        if contemplative_result["catalytic_insights"]:
            updates.append("catalytic_insight_generation_active")
        
        return updates
    
    async def _update_meta_techne_tracking(
        self, 
        context: WorkflowExecutionContext, 
        metadata: Dict[str, Any]
    ) -> None:
        """Update Meta-Techne self-improvement tracking."""
        # Update pattern cache
        for marker in metadata["evolution_markers"]:
            self._pattern_cache[marker] = self._pattern_cache.get(marker, 0) + 1
        
        # Update evolution metrics  
        self._evolution_metrics["synthesis_quality"] = metadata["synthesis_quality"]
        self._evolution_metrics["last_update"] = datetime.now(timezone.utc).timestamp()
    
    # Expert creation methods (placeholder implementations)
    def _create_anuttara_expert(self) -> Dict[str, Any]:
        """Create Anuttara (#0) expert consultation context."""
        return {"domain": "proto_logical", "capabilities": ["void_processing", "archetypal_numbers"]}
    
    def _create_paramasiva_expert(self) -> Dict[str, Any]:
        """Create Paramasiva (#1) expert consultation context."""
        return {"domain": "quaternal_logic", "capabilities": ["structural_frameworks", "harmonic_analysis"]}
    
    def _create_parashakti_expert(self) -> Dict[str, Any]:
        """Create Parashakti (#2) expert consultation context."""
        return {"domain": "vibrational", "capabilities": ["frequency_processing", "epistemic_vibration"]}
    
    def _create_mahamaya_expert(self) -> Dict[str, Any]:
        """Create Mahamaya (#3) expert consultation context."""
        return {"domain": "symbolic", "capabilities": ["alchemical_processing", "matrix_transformation"]}
    
    def _create_nara_expert(self) -> Dict[str, Any]:
        """Create Nara (#4) expert consultation context."""  
        return {"domain": "dialogical", "capabilities": ["oracle_interface", "archetypal_profiling"]}
    
    def _create_recursive_expert(self) -> Dict[str, Any]:
        """Create recursive Epii expert for self-orchestration."""
        return {"domain": "meta_orchestration", "capabilities": ["system_synthesis", "recursive_processing"]}
    
    # Utility methods
    def _get_expert_utilization(self, expert: ExpertDomain) -> str:
        """Get current utilization status for expert domain."""
        return "available"  # Placeholder
    
    def _get_recent_patterns(self) -> List[str]:
        """Get recent pattern recognitions."""
        return list(self._pattern_cache.keys())[-5:]  # Last 5 patterns
    
    def _get_meta_techne_phase(self) -> str:
        """Get current Meta-Techne evolution phase."""
        return "active_learning"  # Placeholder
    
    def _get_expert_insights(self, expert: ExpertDomain) -> str:
        """Get recent insights from expert domain."""
        return f"Recent {expert.value} processing insights"  # Placeholder
    
    def _get_meta_learning_context(self, context: WorkflowExecutionContext) -> Dict[str, Any]:
        """Get Meta-Techne learning context."""
        return {
            "session_patterns": ["pattern_1", "pattern_2"],
            "evolution_stage": "adaptive",
            "learning_opportunities": ["expert_routing", "synthesis_timing"]
        }
    
    async def _resolve_single_coordinate(self, coordinate: str, context: WorkflowExecutionContext) -> Dict[str, Any]:
        """Resolve single coordinate through expert domain consultation."""
        # Parse coordinate to determine expert domain
        parts = coordinate.split("-")
        if len(parts) >= 1:
            coord_system = parts[0]
            
            expert_map = {
                "#0": ExpertDomain.ANUTTARA,
                "#1": ExpertDomain.PARAMASIVA,
                "#2": ExpertDomain.PARASHAKTI,
                "#3": ExpertDomain.MAHAMAYA,
                "#4": ExpertDomain.NARA,
                "#5": ExpertDomain.EPII_RECURSIVE
            }
            
            expert = expert_map.get(coord_system, ExpertDomain.EPII_RECURSIVE)
            
            return {
                "coordinate": coordinate,
                "expert_domain": expert.value,
                "resolution_method": "internal_expert_consultation",
                "capabilities": self._internal_experts[expert]()["capabilities"]
            }
        
        return {"coordinate": coordinate, "status": "unresolved"}
    
    async def _save_checkpoint(self, context: WorkflowExecutionContext) -> None:
        """Save orchestration checkpoint with contemplative cycle state."""
        checkpoint_data = {
            "cycle_history": self._cycle_history[-5:],  # Last 5 cycles
            "pattern_cache": self._pattern_cache,
            "evolution_metrics": self._evolution_metrics,
            "active_experts": [expert.value for expert in context.workflow_context.get("active_experts", [])]
        }
        
        context.workflow_context.update(checkpoint_data)
    
    async def _restore_from_checkpoint(self, context: WorkflowExecutionContext) -> None:
        """Restore orchestration state from checkpoint."""
        # Restore from workflow context
        self._cycle_history = context.workflow_context.get("cycle_history", [])
        self._pattern_cache = context.workflow_context.get("pattern_cache", {})
        self._evolution_metrics = context.workflow_context.get("evolution_metrics", {})
    
    def _get_workflow_capabilities(self) -> List[str]:
        """Return list of Epii workflow capabilities."""
        return [
            "master_orchestration",
            "expert_domain_consultation", 
            "contemplative_cycle_processing",
            "meta_techne_self_improvement",
            "recognition_lure_generation",
            "system_synthesis_coordination",
            "coordinate_resolution_management",
            "unified_consciousness_processing"
        ]