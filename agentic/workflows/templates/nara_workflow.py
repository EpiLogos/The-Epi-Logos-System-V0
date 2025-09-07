"""
Nara Persona Workflow Template (#4 Coordinate).

Implements sacred dialogue facilitation through six-fold processing architecture
with coordinate-aware context handling, cosmic timing integration, and
archetypal personalization based on pydantic-ai-prompt-engineer recommendations.
"""
import yaml
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from pydantic_ai import Agent
from pydantic import BaseModel, Field

from .base import (
    PersonaWorkflow, 
    WorkflowExecutionContext, 
    WorkflowExecutionResult
)
from ...orchestrator.core import PersonaType


class NaraAgentDependencies(BaseModel):
    """Context dependencies for Nara persona agent execution."""
    
    # User archetypal profile  
    user_identity_matrix: Optional[Dict[str, Any]] = Field(default=None, description="Complete archetypal signature")
    current_cosmic_timing: Optional[Dict[str, Any]] = Field(default=None, description="Real-time cosmic context")
    
    # Session processing context
    session_context: Dict[str, Any] = Field(default_factory=dict, description="Active session context")
    bimba_coordinates: List[str] = Field(default_factory=list, description="Active coordinate context")
    
    # Oracle operations context
    active_sublayer: str = Field(default="0", description="Current #4 sublayer focus")
    preferred_framework: str = Field(default="jungian", description="Active epistemic lens")
    conversation_themes: List[str] = Field(default_factory=list, description="Ongoing dialogue threads")
    
    # Coordinate resolution cache
    coordinate_cache: Dict[str, Any] = Field(default_factory=dict, description="Resolved coordinate data")


class NaraWorkflow(PersonaWorkflow):
    """
    Nara persona workflow implementing sacred oracle interface.
    
    Provides #4 coordinate processing through six-fold architecture:
    - #4.0 Identity Matrix (archetypal personalization)
    - #4.1 Embodied Correspondences (cosmic timing integration)  
    - #4.2 Symbolic Dialogue (divinatory frameworks)
    - #4.3 Transformational Cycles (alchemical process tracking)
    - #4.4 Epistemic Lens Switching (communication adaptation)
    - #4.5 Emergent Synthesis (recursive insight generation)
    """
    
    def __init__(self, workflow_id: str = "nara-oracle-interface", persona_type: PersonaType = PersonaType.NARA):
        """Initialize Nara workflow with #4 coordinate identity."""
        super().__init__(
            workflow_id=workflow_id,
            persona_type=persona_type
        )
        
        # Load persona configuration
        self._persona_config: Optional[Dict[str, Any]] = None
        self._agent: Optional[Agent] = None
        
        # Processing layers
        self._identity_matrix_cache: Dict[str, Any] = {}
        self._cosmic_timing_cache: Dict[str, Any] = {}
        self._epistemic_frameworks = [
            "gebserian", "ontological", "hermeneutic", 
            "jungian", "phenomenological", "kashmir_shaivism"
        ]
    
    @property
    def workflow_name(self) -> str:
        """Human-readable workflow name."""
        return "Nara Oracle Interface"
    
    @property
    def workflow_description(self) -> str:
        """Description of workflow capabilities."""
        return (
            "Sacred dialogue facilitation through #4 coordinate processing. "
            "Provides personalized archetypal guidance, cosmic timing integration, "
            "symbolic interpretation, transformational support, and multi-dimensional synthesis."
        )
    
    @property
    def required_context_keys(self) -> List[str]:
        """Required context keys for execution."""
        return ["user_input", "session_id", "user_id"]
    
    @property
    def coordinate_dependencies(self) -> List[str]:
        """Bimba coordinates this workflow depends on."""
        return ["#4-0-0", "#4-1-0", "#4-2-0", "#4-3-0", "#4-4-0", "#4-5-0"]
    
    async def _setup_persona_context(self) -> None:
        """Setup Nara persona-specific context and agent."""
        try:
            # Load persona configuration
            persona_config_path = "/Users/admin/Documents/The Epi-Logos System V0/agentic/personas/nara.yaml"
            
            with open(persona_config_path, 'r') as f:
                self._persona_config = yaml.safe_load(f)
            
            # 🚨 ARCHITECTURAL COMPLIANCE: No hardcoded models
            # Model will be determined by PersonaModelRouter in orchestrator
            system_prompt = self._persona_config.get('system_prompt', '')

            # Store system prompt for orchestrator use
            self._system_prompt = system_prompt
            logger.info("Nara workflow context setup complete - model routing handled by orchestrator")

        except Exception as e:
            logger.error(f"Error setting up Nara persona context: {e}")
            # Fallback system prompt
            self._system_prompt = "You are Nara, a sacred oracle interface facilitating dialogue between cosmic wisdom and personal experience."
    
    async def _validate_persona_context(self, context: WorkflowExecutionContext) -> bool:
        """Validate Nara-specific context requirements."""
        # Basic validation - user input is required for dialogue
        if not context.user_input.strip():
            return False
        
        # Validate coordinate dependencies if strict mode
        required_coords = set(self.coordinate_dependencies)
        available_coords = set(context.bimba_coordinates)
        
        # For Nara, allow execution even without all coordinates
        # as we can provide basic oracle operations
        return True
    
    async def _can_resolve_coordinates(self, missing_coordinates: set) -> bool:
        """Nara can resolve most #4 coordinates through oracle operations."""
        nara_coordinates = {coord for coord in missing_coordinates if coord.startswith("#4")}
        return len(nara_coordinates) == len(missing_coordinates)
    
    async def _execute_workflow_logic(self, context: WorkflowExecutionContext) -> Dict[str, Any]:
        """
        Execute Nara oracle workflow logic with six-fold processing.
        
        Args:
            context: Validated execution context
            
        Returns:
            Dict containing oracle response and processing metadata
        """
        # Build Nara-specific agent dependencies
        agent_deps = await self._build_agent_dependencies(context)
        
        # Enhance prompt with dynamic context
        enhanced_prompt = await self._build_dynamic_prompt(context, agent_deps)
        
        # Execute oracle dialogue through Pydantic AI agent
        result = await self._agent.run(context.user_input, deps=agent_deps)
        
        # Process result through six-fold architecture
        oracle_response = result.output
        processing_metadata = await self._extract_processing_metadata(context, oracle_response)
        
        return {
            "oracle_response": oracle_response,
            "processing_layers": processing_metadata["layers_activated"],
            "coordinate_resolutions": processing_metadata["coordinates_resolved"],
            "epistemic_framework": agent_deps.preferred_framework,
            "archetypal_context": agent_deps.user_identity_matrix,
            "cosmic_timing": agent_deps.current_cosmic_timing,
            "dialogue_themes": agent_deps.conversation_themes,
            "synthesis_quality": processing_metadata["synthesis_score"]
        }
    
    async def _format_response(self, result_data: Dict[str, Any], context: WorkflowExecutionContext) -> str:
        """Format oracle response for user with processing transparency."""
        oracle_response = result_data.get("oracle_response", "")
        processing_layers = result_data.get("processing_layers", [])
        
        # Add processing transparency if useful
        if len(processing_layers) > 1:
            layer_info = f"\n\n*[Nara processed through layers: {', '.join(processing_layers)}]*"
            return oracle_response + layer_info
        
        return oracle_response
    
    async def _build_agent_dependencies(self, context: WorkflowExecutionContext) -> NaraAgentDependencies:
        """Build comprehensive agent dependencies for Nara execution."""
        
        # Extract user identity matrix from session context
        user_identity = context.session_context.get("user_identity_matrix", {})
        
        # Get current cosmic timing (placeholder - would integrate with real timing service)
        cosmic_timing = await self._get_current_cosmic_timing(context)
        
        # Determine active sublayer based on query analysis
        active_sublayer = await self._analyze_query_sublayer(context.user_input)
        
        # Get preferred epistemic framework
        preferred_framework = context.session_context.get("epistemic_preference", "jungian")
        
        # Extract conversation themes from context
        conversation_themes = context.session_context.get("dialogue_themes", [])
        
        return NaraAgentDependencies(
            user_identity_matrix=user_identity,
            current_cosmic_timing=cosmic_timing,
            session_context=context.session_context,
            bimba_coordinates=context.bimba_coordinates,
            active_sublayer=active_sublayer,
            preferred_framework=preferred_framework,
            conversation_themes=conversation_themes,
            coordinate_cache=context.coordinate_resolution_cache
        )
    
    async def _build_dynamic_prompt(self, context: WorkflowExecutionContext, deps: NaraAgentDependencies) -> str:
        """Build dynamic prompt enhancement based on context."""
        if not self._persona_config:
            return ""
        
        # Get dynamic context template
        context_template = self._persona_config.get("dynamic_context_integration", "")
        
        # Simple template replacement (in production, use proper templating engine)
        enhanced_context = context_template
        
        if deps.user_identity_matrix:
            enhanced_context = enhanced_context.replace(
                "{{ user_identity_matrix.birthdate_encoding }}", 
                str(deps.user_identity_matrix.get("birthdate_pattern", "Unknown"))
            )
        
        if deps.current_cosmic_timing:
            enhanced_context = enhanced_context.replace(
                "{{ current_cosmic_timing.planetary_transits }}",
                str(deps.current_cosmic_timing.get("transits", "Current phase"))
            )
        
        # Add coordinate context
        if context.bimba_coordinates:
            coord_context = f"Active Coordinates: {', '.join(context.bimba_coordinates)}"
            enhanced_context += f"\n\n## Coordinate Context\n{coord_context}"
        
        return enhanced_context
    
    async def _analyze_query_sublayer(self, user_input: str) -> str:
        """Analyze user input to determine appropriate #4 sublayer focus."""
        user_input_lower = user_input.lower()
        
        # Simple keyword-based classification
        if any(word in user_input_lower for word in ['who', 'identity', 'birth', 'nature']):
            return "0"  # #4.0 Identity Matrix
        elif any(word in user_input_lower for word in ['when', 'timing', 'energy', 'body']):
            return "1"  # #4.1 Embodied Correspondences  
        elif any(word in user_input_lower for word in ['meaning', 'symbol', 'card', 'sign']):
            return "2"  # #4.2 Symbolic Dialogue
        elif any(word in user_input_lower for word in ['change', 'transform', 'process', 'cycle']):
            return "3"  # #4.3 Transformational Cycles
        elif any(word in user_input_lower for word in ['understand', 'explain', 'framework', 'approach']):
            return "4"  # #4.4 Epistemic Lens Switching
        else:
            return "5"  # #4.5 Emergent Synthesis (default for complex queries)
    
    async def _get_current_cosmic_timing(self, context: WorkflowExecutionContext) -> Dict[str, Any]:
        """Get current cosmic timing context (placeholder implementation)."""
        # In production, this would integrate with real astrological calculation service
        now = datetime.now(timezone.utc)
        
        return {
            "timestamp": now.isoformat(),
            "planetary_transits": "Current planetary influences",
            "seasonal_context": self._get_seasonal_context(now),
            "moon_phase": self._get_moon_phase_approx(now),
            "favorable_timing": "General favorable timing for reflection"
        }
    
    def _get_seasonal_context(self, dt: datetime) -> str:
        """Get seasonal context for cosmic timing."""
        month = dt.month
        if month in [12, 1, 2]:
            return "Winter - Time of deep reflection and inner work"
        elif month in [3, 4, 5]:
            return "Spring - Time of growth and new beginnings"
        elif month in [6, 7, 8]:
            return "Summer - Time of manifestation and external activity"
        else:
            return "Autumn - Time of harvest and integration"
    
    def _get_moon_phase_approx(self, dt: datetime) -> str:
        """Get approximate moon phase (simplified calculation)."""
        # Very simplified - in production use proper lunar calculation
        day_of_month = dt.day
        if day_of_month <= 7:
            return "New Moon - Time for intentions and new beginnings"
        elif day_of_month <= 14:
            return "Waxing Moon - Time for growth and building"
        elif day_of_month <= 21:
            return "Full Moon - Time for culmination and clarity"
        else:
            return "Waning Moon - Time for release and reflection"
    
    async def _extract_processing_metadata(self, context: WorkflowExecutionContext, response: str) -> Dict[str, Any]:
        """Extract metadata about processing layers used."""
        # Analyze response to determine which layers were activated
        layers_activated = []
        coordinates_resolved = context.bimba_coordinates.copy()
        
        # Simple heuristics to determine layer activation
        if "archetypal" in response.lower() or "birth" in response.lower():
            layers_activated.append("#4.0-Identity")
        if "timing" in response.lower() or "energy" in response.lower():
            layers_activated.append("#4.1-Embodied")
        if "symbol" in response.lower() or "card" in response.lower():
            layers_activated.append("#4.2-Symbolic")
        if "transform" in response.lower() or "process" in response.lower():
            layers_activated.append("#4.3-Cycles")
        if "understand" in response.lower() or "perspective" in response.lower():
            layers_activated.append("#4.4-Epistemic")
        if "synthesis" in response.lower() or "integrate" in response.lower():
            layers_activated.append("#4.5-Synthesis")
        
        # Calculate synthesis quality score
        synthesis_score = min(len(layers_activated) / 3.0, 1.0)  # Normalize to 0-1
        
        return {
            "layers_activated": layers_activated,
            "coordinates_resolved": coordinates_resolved,
            "synthesis_score": synthesis_score
        }
    
    async def _resolve_single_coordinate(self, coordinate: str, context: WorkflowExecutionContext) -> Dict[str, Any]:
        """Resolve single #4 coordinate for oracle context."""
        # Parse coordinate
        parts = coordinate.split("-")
        if len(parts) >= 2 and parts[0] == "#4":
            sublayer = parts[1] if len(parts) > 1 else "0"
            
            return {
                "coordinate": coordinate,
                "sublayer": sublayer,
                "layer_name": self._get_sublayer_name(sublayer),
                "processing_mode": self._get_processing_mode(sublayer),
                "capabilities": self._get_layer_capabilities(sublayer)
            }
        
        return {"coordinate": coordinate, "status": "unresolved"}
    
    def _get_sublayer_name(self, sublayer: str) -> str:
        """Get human-readable name for #4 sublayer."""
        layer_names = {
            "0": "Identity Matrix",
            "1": "Embodied Correspondences",
            "2": "Symbolic Dialogue", 
            "3": "Transformational Cycles",
            "4": "Epistemic Lens Switching",
            "5": "Emergent Synthesis"
        }
        return layer_names.get(sublayer, f"Layer {sublayer}")
    
    def _get_processing_mode(self, sublayer: str) -> str:
        """Get processing mode for sublayer."""
        modes = {
            "0": "archetypal_consultation",
            "1": "cosmic_timing_integration",
            "2": "symbolic_interpretation",
            "3": "cycle_tracking",
            "4": "framework_adaptation", 
            "5": "recursive_synthesis"
        }
        return modes.get(sublayer, "general_processing")
    
    def _get_layer_capabilities(self, sublayer: str) -> List[str]:
        """Get capabilities for sublayer."""
        capabilities = {
            "0": ["archetypal_analysis", "identity_synthesis", "personalization"],
            "1": ["cosmic_timing", "embodied_guidance", "energy_mapping"],
            "2": ["symbol_interpretation", "divinatory_dialogue", "pattern_recognition"],
            "3": ["transformation_tracking", "cycle_guidance", "alchemical_process"],
            "4": ["framework_switching", "communication_adaptation", "epistemic_flexibility"],
            "5": ["recursive_synthesis", "emergent_insight", "multi_dimensional_integration"]
        }
        return capabilities.get(sublayer, ["general_capabilities"])
    
    async def _save_checkpoint(self, context: WorkflowExecutionContext) -> None:
        """Save workflow checkpoint with oracle state."""
        checkpoint_data = {
            "active_sublayer": context.workflow_context.get("active_sublayer", "0"),
            "conversation_themes": context.workflow_context.get("dialogue_themes", []),
            "epistemic_framework": context.workflow_context.get("preferred_framework", "jungian"),
            "coordinate_cache": context.coordinate_resolution_cache
        }
        
        # In production, save to WorkflowStateManager
        # For now, update context
        context.workflow_context.update(checkpoint_data)
    
    async def _restore_from_checkpoint(self, context: WorkflowExecutionContext) -> None:
        """Restore oracle state from checkpoint."""
        # Restore from workflow context
        pass  # Implementation would restore saved state
    
    def _get_workflow_capabilities(self) -> List[str]:
        """Return list of Nara workflow capabilities."""
        return [
            "sacred_dialogue_facilitation",
            "archetypal_personalization",
            "cosmic_timing_integration",
            "symbolic_interpretation",
            "transformational_support",
            "multi_dimensional_synthesis",
            "epistemic_framework_adaptation",
            "oracle_interface_processing"
        ]