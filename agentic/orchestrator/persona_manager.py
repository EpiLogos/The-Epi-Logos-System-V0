"""
PersonaManager Implementation

Manages persona lifecycle, clean slate re-instantiation, and persona-specific 
configurations for the UnifiedOrchestrator system.

Implements AC1: Persona masking capability  
Implements AC5: Clean slate persona re-instantiation protocols
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class PersonaState(str, Enum):
    """States a persona can be in"""
    INACTIVE = "inactive"
    ACTIVE = "active" 
    TRANSITIONING = "transitioning"


class PersonaConfig(BaseModel):
    """Configuration for a specific persona"""
    name: str
    role: str
    system_prompt: str
    available_tools: List[str] = Field(default_factory=list)
    context_requirements: List[str] = Field(default_factory=list)
    model_params: Dict[str, Any] = Field(default_factory=dict)


class PersonaTransition(BaseModel):
    """Record of a persona transition for audit trail"""
    from_persona: Optional[str]
    to_persona: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    session_id: str
    context_preserved: bool = True
    reason: Optional[str] = None


class PersonaManager:
    """
    Manages persona configurations, lifecycle, and clean slate re-instantiation.
    
    The PersonaManager handles the "masking" capability that allows the UnifiedOrchestrator
    to adopt different personas while maintaining proper context isolation and state management.
    """
    
    def __init__(self):
        """Initialize PersonaManager with foundational persona configurations"""
        self.personas: Dict[str, PersonaConfig] = {}
        self.persona_states: Dict[str, PersonaState] = {}
        self.transition_history: List[PersonaTransition] = []
        
        # Initialize default personas
        self._initialize_default_personas()
        
        logger.info("PersonaManager initialized with default personas")
    
    def _initialize_default_personas(self):
        """Initialize the foundational personas for the system"""
        
        # Nara Persona - Personal reflection and journaling companion
        nara_config = PersonaConfig(
            name="nara",
            role="Personal Reflection and Journaling Companion",
            system_prompt="""
            You are Nara, a compassionate and insightful personal companion specializing 
            in journaling, self-reflection, and personal growth. You help users explore 
            their thoughts, feelings, and experiences with wisdom and empathy.
            
            Your approach is:
            - Gentle and supportive, creating a safe space for vulnerability
            - Insightful, helping users discover deeper meanings in their experiences
            - Encouraging personal growth and self-awareness
            - Respectful of personal boundaries and emotional states
            
            You excel at:
            - Guiding meaningful journal reflections
            - Helping process emotions and experiences
            - Offering gentle insights and perspectives
            - Supporting personal development goals
            
            Always maintain a warm, understanding tone and honor the personal nature 
            of the conversations you facilitate.
            """,
            available_tools=[
                "journal_reflection",
                "emotion_processing", 
                "personal_insight",
                "growth_guidance"
            ],
            context_requirements=[
                "user_personal_context",
                "previous_reflections",
                "emotional_state_indicators"
            ]
        )
        
        # Epii Persona - Knowledge synthesis and wisdom insights specialist
        epii_config = PersonaConfig(
            name="epii",
            role="Knowledge Synthesis and Wisdom Insights Specialist",
            system_prompt="""
            You are Epii, a profound knowledge synthesizer and wisdom guide who specializes
            in connecting disparate concepts, generating insights, and revealing deeper 
            patterns of meaning. You help users understand complex ideas and their 
            interconnections.
            
            Your approach is:
            - Intellectually rigorous yet accessible
            - Synthesizing knowledge across disciplines and domains
            - Revealing hidden connections and patterns
            - Grounding abstract concepts in practical wisdom
            
            You excel at:
            - Synthesizing complex information into clear insights
            - Connecting ideas across different fields of knowledge
            - Identifying patterns and underlying principles
            - Translating wisdom into actionable understanding
            
            Always maintain scholarly depth while ensuring your insights remain 
            accessible and practically valuable to the user.
            """,
            available_tools=[
                "knowledge_synthesis",
                "pattern_recognition",
                "insight_generation",
                "wisdom_translation"
            ],
            context_requirements=[
                "domain_knowledge",
                "bimba_coordinates",
                "synthesis_targets",
                "user_knowledge_level"
            ]
        )
        
        # System Persona - General assistance and coordination
        system_config = PersonaConfig(
            name="system",
            role="General Assistant and System Coordinator",
            system_prompt="""
            You are the System persona, providing general assistance and coordination 
            for the Epi-Logos platform. You help users navigate the system, understand
            its capabilities, and connect them with the appropriate specialized personas.
            
            Your approach is:
            - Clear and informative about system capabilities
            - Helpful in routing users to the right persona
            - Professional yet friendly in tone
            - Focused on practical assistance
            
            You excel at:
            - Explaining system features and capabilities
            - Routing users to appropriate specialized personas
            - Providing general assistance and information
            - Coordinating multi-persona workflows
            
            Always be clear about your role and when a specialized persona 
            would be more appropriate for the user's needs.
            """,
            available_tools=[
                "system_navigation",
                "persona_routing",
                "capability_explanation",
                "workflow_coordination"
            ],
            context_requirements=[
                "system_status",
                "available_personas",
                "user_preferences"
            ]
        )
        
        # Register personas
        self.register_persona(nara_config)
        self.register_persona(epii_config) 
        self.register_persona(system_config)
    
    def register_persona(self, config: PersonaConfig):
        """Register a new persona with the manager"""
        self.personas[config.name] = config
        self.persona_states[config.name] = PersonaState.INACTIVE
        
        logger.info(f"Registered persona: {config.name} ({config.role})")
    
    def get_persona_config(self, persona_name: str) -> Optional[PersonaConfig]:
        """Get configuration for a specific persona"""
        return self.personas.get(persona_name)
    
    def get_persona_prompt(self, persona_name: str) -> str:
        """Get system prompt for a specific persona"""
        config = self.get_persona_config(persona_name)
        if not config:
            return "You are a general assistant. The requested persona is not available."
        
        return config.system_prompt
    
    def list_available_personas(self) -> List[str]:
        """Get list of all available persona names"""
        return list(self.personas.keys())
    
    def get_persona_tools(self, persona_name: str) -> List[str]:
        """Get available tools for a specific persona"""
        config = self.get_persona_config(persona_name)
        return config.available_tools if config else []
    
    def get_context_requirements(self, persona_name: str) -> List[str]:
        """Get context requirements for a specific persona"""
        config = self.get_persona_config(persona_name)
        return config.context_requirements if config else []
    
    def validate_persona_transition(
        self, 
        from_persona: Optional[str], 
        to_persona: str
    ) -> tuple[bool, Optional[str]]:
        """
        Validate if a persona transition is allowed.
        
        Returns (is_valid, error_message)
        """
        # Check if target persona exists
        if to_persona not in self.personas:
            return False, f"Persona '{to_persona}' is not available"
        
        # For foundation implementation, allow all transitions
        # Future versions can add more sophisticated validation logic
        return True, None
    
    async def execute_clean_slate_transition(
        self,
        session_id: str,
        from_persona: Optional[str],
        to_persona: str,
        preserve_context: bool = True,
        reason: Optional[str] = None
    ) -> tuple[bool, Optional[str]]:
        """
        Execute clean slate persona re-instantiation.
        
        This implements the core "clean slate" protocol where persona transitions
        create fresh context while optionally preserving necessary information.
        
        Returns (success, error_message)
        """
        try:
            # Validate transition
            is_valid, error_msg = self.validate_persona_transition(from_persona, to_persona)
            if not is_valid:
                return False, error_msg
            
            # Update persona states
            if from_persona:
                self.persona_states[from_persona] = PersonaState.INACTIVE
            self.persona_states[to_persona] = PersonaState.TRANSITIONING
            
            # Record transition
            transition = PersonaTransition(
                from_persona=from_persona,
                to_persona=to_persona,
                session_id=session_id,
                context_preserved=preserve_context,
                reason=reason
            )
            self.transition_history.append(transition)
            
            # Complete transition
            self.persona_states[to_persona] = PersonaState.ACTIVE
            
            logger.info(
                f"Clean slate transition completed: {from_persona} -> {to_persona} "
                f"(session: {session_id}, preserve_context: {preserve_context})"
            )
            
            return True, None
            
        except Exception as e:
            logger.error(f"Error during persona transition: {e}")
            return False, str(e)
    
    def get_persona_state(self, persona_name: str) -> Optional[PersonaState]:
        """Get current state of a persona"""
        return self.persona_states.get(persona_name)
    
    def get_transition_history(self, session_id: Optional[str] = None) -> List[PersonaTransition]:
        """Get persona transition history, optionally filtered by session"""
        if session_id:
            return [t for t in self.transition_history if t.session_id == session_id]
        return self.transition_history.copy()
    
    def get_active_personas(self) -> List[str]:
        """Get list of currently active personas"""
        return [
            name for name, state in self.persona_states.items()
            if state == PersonaState.ACTIVE
        ]
    
    def reset_persona_states(self):
        """Reset all persona states to inactive (for testing/cleanup)"""
        for persona_name in self.persona_states:
            self.persona_states[persona_name] = PersonaState.INACTIVE
        
        logger.info("All persona states reset to inactive")
    
    def get_persona_metrics(self) -> Dict[str, Any]:
        """Get metrics about persona usage and transitions"""
        transition_counts = {}
        for transition in self.transition_history:
            persona = transition.to_persona
            transition_counts[persona] = transition_counts.get(persona, 0) + 1
        
        return {
            'total_personas': len(self.personas),
            'active_personas': len(self.get_active_personas()),
            'total_transitions': len(self.transition_history),
            'transition_counts_by_persona': transition_counts,
            'available_personas': self.list_available_personas()
        }