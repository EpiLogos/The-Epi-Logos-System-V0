"""
🎭 PERSONA-SPECIFIC MODEL ROUTING 🎭

This module implements the CORE FEATURE of persona-specific model routing.
Different personas use different models based on their capabilities:

- Nara (Contemplative): Anthropic Claude (nuanced, thoughtful)
- Epii (Analytical): OpenAI GPT (synthesis, analysis) 
- System (General): Gemini (fast, efficient)

This is the CORE PURPOSE of the unified orchestrator - enabling 
persona-specific AI capabilities through intelligent model selection.
"""

from typing import Dict, Optional
from .core import PersonaType
import logging

logger = logging.getLogger(__name__)


class PersonaModelRouter:
    """🎯 CORE FEATURE: Route personas to appropriate models based on configuration"""
    
    # 🎭 DEFAULT PERSONA MODEL ASSIGNMENTS
    DEFAULT_PERSONA_MODELS = {
        PersonaType.NARA: "anthropic:claude-3-5-haiku-20241022",  # Contemplative, nuanced
        PersonaType.EPII: "openai:gpt-5",                         # Analytical, synthesis
        PersonaType.SYSTEM: "gemini:gemini-2.5-flash",           # Fast, general purpose
    }
    
    def __init__(self, capabilities):
        """Initialize with capabilities system for model validation"""
        self.capabilities = capabilities
        self._persona_models = self.DEFAULT_PERSONA_MODELS.copy()
        
        logger.info("PersonaModelRouter initialized with default assignments:")
        for persona, model in self._persona_models.items():
            logger.info(f"  {persona.value} → {model}")
    
    def get_model_for_persona(self, persona: PersonaType, fallback_model: Optional[str] = None) -> str:
        """🎯 Get the appropriate model for a persona
        
        This is the CORE FUNCTIONALITY that enables different personas
        to use different models based on their specific capabilities.
        
        Args:
            persona: The persona requesting a model
            fallback_model: Optional fallback if persona model unavailable
            
        Returns:
            Model string in provider:model format
        """
        
        # Try persona-specific model first
        preferred_model = self._persona_models.get(persona)
        if preferred_model and self.capabilities.validate_model(preferred_model):
            logger.debug(f"Using persona-specific model for {persona.value}: {preferred_model}")
            return preferred_model
        
        # Try fallback model
        if fallback_model and self.capabilities.validate_model(fallback_model):
            logger.warning(f"Persona model unavailable for {persona.value}, using fallback: {fallback_model}")
            return fallback_model
        
        # Use system default
        default_model = self.capabilities.get_default_model()
        logger.warning(f"No persona/fallback model available for {persona.value}, using default: {default_model}")
        return default_model
    
    def set_persona_model(self, persona: PersonaType, model: str) -> bool:
        """🔧 Set model for a specific persona
        
        Allows dynamic reconfiguration of persona-model assignments.
        
        Args:
            persona: The persona to configure
            model: The model to assign (provider:model format)
            
        Returns:
            True if successful, False if model invalid
        """
        if not self.capabilities.validate_model(model):
            logger.error(f"Cannot set invalid model {model} for persona {persona.value}")
            return False
        
        old_model = self._persona_models.get(persona, "none")
        self._persona_models[persona] = model
        
        logger.info(f"Persona model updated: {persona.value} {old_model} → {model}")
        return True
    
    def get_all_persona_models(self) -> Dict[PersonaType, str]:
        """📋 Get current model assignments for all personas
        
        Returns:
            Dictionary mapping personas to their assigned models
        """
        return self._persona_models.copy()
    
    def validate_all_persona_models(self) -> Dict[PersonaType, bool]:
        """✅ Validate all persona model assignments
        
        Returns:
            Dictionary mapping personas to their model validity status
        """
        validation_results = {}
        
        for persona, model in self._persona_models.items():
            is_valid = self.capabilities.validate_model(model)
            validation_results[persona] = is_valid
            
            if not is_valid:
                logger.warning(f"Invalid model assignment: {persona.value} → {model}")
        
        return validation_results
    
    def get_persona_for_model_preference(self, preferred_model: str) -> Optional[PersonaType]:
        """🔍 Find which persona is best suited for a specific model
        
        Useful for model-driven persona selection.
        
        Args:
            preferred_model: The model to find a persona for
            
        Returns:
            PersonaType that uses this model, or None if no match
        """
        for persona, model in self._persona_models.items():
            if model == preferred_model:
                return persona
        
        return None
    
    def reset_to_defaults(self):
        """🔄 Reset all persona models to default assignments"""
        old_assignments = self._persona_models.copy()
        self._persona_models = self.DEFAULT_PERSONA_MODELS.copy()
        
        logger.info("Persona models reset to defaults:")
        for persona, model in self._persona_models.items():
            old_model = old_assignments.get(persona, "none")
            if old_model != model:
                logger.info(f"  {persona.value}: {old_model} → {model}")
    
    def get_routing_summary(self) -> Dict[str, any]:
        """📊 Get comprehensive routing summary for diagnostics
        
        Returns:
            Dictionary with routing configuration and validation status
        """
        validation_results = self.validate_all_persona_models()
        
        return {
            "persona_models": {persona.value: model for persona, model in self._persona_models.items()},
            "validation_status": {persona.value: valid for persona, valid in validation_results.items()},
            "default_model": self.capabilities.get_default_model(),
            "available_providers": self.capabilities.list_providers(),
            "total_personas": len(self._persona_models),
            "valid_assignments": sum(validation_results.values()),
            "invalid_assignments": len(validation_results) - sum(validation_results.values())
        }
