"""
Agent Router Service

Routes requests to appropriate agents in the multi-agent constellation.
Replaces persona-based switching with true multi-agent delegation.

Based on AgentFactory + DelegationManager pattern.
"""

import logging
import os
from typing import Optional, Dict, Any, List
from enum import Enum

from agentic.agents.factory import AgentFactory
from agentic.agents.delegation_manager import DelegationManager
from agentic.agents.orchestrator.orchestrator_agent import OrchestratorDeps
from agentic.clients.bimba_graphql_client import BimbaGraphQLClient
from shared.database.redis_client import RedisClient

logger = logging.getLogger(__name__)


def get_default_model() -> str:
    """Get the default model from environment variables in correct Pydantic AI format"""
    if os.getenv('GROQ_API_KEY') and os.getenv('GROQ_MODEL'):
        return f"groq:{os.getenv('GROQ_MODEL')}"
    elif os.getenv('GOOGLE_API_KEY') and os.getenv('GOOGLE_MODEL'):
        return os.getenv('GOOGLE_MODEL')  # Gemini models work without prefix
    elif os.getenv('ANTHROPIC_API_KEY') and os.getenv('ANTHROPIC_MODEL'):
        return f"anthropic:{os.getenv('ANTHROPIC_MODEL')}"
    elif os.getenv('DEEPSEEK_API_KEY') and os.getenv('DATABASE_MODEL'):
        return f"deepseek:{os.getenv('DATABASE_MODEL')}"
    else:
        logger.warning("No API keys found for LLM models, using test model")
        return 'test'


class SubsystemRouter:
    """Maps persona/context to subsystem numbers for agent routing"""

    # Persona to subsystem mapping (backward compatibility)
    PERSONA_TO_SUBSYSTEM = {
        "system": 5,      # Epii - master orchestrator
        "epii": 5,        # Epii - synthesis/orchestration
        "nara": 4,        # Nara - dialogical interface
        "anuttara": 0,    # Anuttara - proto-logical void
        "paramasiva": 1,  # Paramasiva - QL engine
        "parashakti": 2,  # Parashakti - vibrational processing
        "mahamaya": 3     # Mahamaya - symbolic transcription
    }

    @classmethod
    def persona_to_subsystem(cls, persona: str) -> int:
        """Convert persona string to subsystem number"""
        persona_lower = persona.lower()
        return cls.PERSONA_TO_SUBSYSTEM.get(persona_lower, 5)  # Default to Epii

    @classmethod
    def infer_subsystem_from_context(cls, message: str, context: Optional[Dict[str, Any]] = None) -> int:
        """
        Infer which subsystem should handle a request based on message content.

        Future enhancement: Use semantic analysis or LLM-based routing.
        For now, uses simple keyword matching.
        """
        message_lower = message.lower()

        # Keyword-based routing hints
        if any(word in message_lower for word in ["etymology", "vibration", "cosmic", "energetic"]):
            return 2  # Parashakti
        elif any(word in message_lower for word in ["symbol", "transcribe", "language", "meaning"]):
            return 3  # Mahamaya
        elif any(word in message_lower for word in ["personal", "identity", "i feel", "my experience"]):
            return 4  # Nara
        elif any(word in message_lower for word in ["logic", "quaternal", "architecture", "structure"]):
            return 1  # Paramasiva
        elif any(word in message_lower for word in ["void", "emptiness", "proto", "foundational"]):
            return 0  # Anuttara
        else:
            return 5  # Default to Epii for orchestration

    @classmethod
    def coordinate_to_subsystem(cls, coordinate: str) -> Optional[int]:
        """Extract subsystem from Bimba coordinate (e.g., '#2-1' -> 2)"""
        if not coordinate or not coordinate.startswith('#'):
            return None

        parts = coordinate[1:].split('-')
        if not parts or not parts[0]:
            return None

        try:
            return int(parts[0][0])  # First digit of first segment
        except (ValueError, IndexError):
            return None


class AgentRouter:
    """
    Routes requests to appropriate agents in the constellation.

    Replaces persona-based orchestrator with true multi-agent delegation.
    """

    def __init__(
        self,
        bimba_client: Optional[BimbaGraphQLClient] = None,
        redis_client: Optional[RedisClient] = None,
        default_model: Optional[str] = None
    ):
        """
        Initialize agent router with factory and delegation manager.

        Args:
            bimba_client: BimbaGraphQLClient for Neo4j access
            redis_client: RedisClient for caching
            default_model: Optional model override (defaults to env-based selection)
        """
        self.bimba_client = bimba_client or BimbaGraphQLClient()
        self.redis_client = redis_client or RedisClient()
        self.default_model = default_model or get_default_model()

        # Initialize factory and delegation manager
        self.factory = AgentFactory()
        self.delegation_manager = DelegationManager(self.factory)

        logger.info(f"AgentRouter initialized with model: {self.default_model}")

    async def route_request(
        self,
        message: str,
        deps: OrchestratorDeps,
        persona: Optional[str] = None,
        subsystem: Optional[int] = None,
        model_name: Optional[str] = None,
        use_orchestrator: bool = True,
        message_history: Optional[List] = None
    ) -> Any:
        """
        Route a request to the appropriate agent.

        Default behavior (use_orchestrator=True): Route to orchestrator agent which handles delegation.
        Legacy behavior (use_orchestrator=False): Direct subsystem routing via context inference.

        Priority when NOT using orchestrator:
        1. Explicit subsystem number (if provided)
        2. Persona mapping (if provided)
        3. Context inference from message content

        Args:
            message: User message
            deps: OrchestratorDeps for agent execution
            persona: Optional persona hint (backward compatibility)
            subsystem: Optional explicit subsystem number
            model_name: Optional model override
            use_orchestrator: If True (default), route to orchestrator agent
            message_history: Optional Pydantic AI message history

        Returns:
            Agent result from delegation
        """
        # Use provided model or default
        effective_model = model_name or self.default_model

        # Default: Route to orchestrator (None = orchestrator in factory)
        if use_orchestrator and subsystem is None and persona is None:
            logger.info(f"🎯 ROUTING TO ORCHESTRATOR (#5-4) - model={effective_model}")

            # Get or create orchestrator agent
            orchestrator = await self.get_orchestrator_agent(model_name=effective_model)

            # Run orchestrator (it will handle delegation internally) WITH message history
            from pydantic_ai import RunContext
            result = await orchestrator.run(
                message,
                deps=deps,
                message_history=message_history or []
            )
            return result

        # Legacy path: Direct subsystem routing
        target_subsystem = subsystem

        if target_subsystem is None and persona:
            target_subsystem = SubsystemRouter.persona_to_subsystem(persona)
            logger.info(f"Routing via persona '{persona}' -> subsystem {target_subsystem}")

        if target_subsystem is None:
            target_subsystem = SubsystemRouter.infer_subsystem_from_context(message, deps.context_package)
            logger.info(f"Routing via context inference -> subsystem {target_subsystem}")

        logger.info(
            f"🎯 DIRECT SUBSYSTEM ROUTING: subsystem={target_subsystem}, "
            f"persona={persona}, model={effective_model}"
        )

        # Delegate to appropriate agent WITH message history
        result = await self.delegation_manager.delegate(
            message=message,
            ctx=None,  # We'll handle deps differently for now
            target_subsystem=target_subsystem,
            model_name=effective_model,
            deps=deps,  # Pass deps directly
            message_history=message_history  # Pass message history through
        )

        return result

    async def get_orchestrator_agent(
        self,
        model_name: Optional[str] = None
    ):
        """
        Get or create the root orchestrator agent (#5-4).

        Args:
            model_name: Optional model override

        Returns:
            Pydantic AI Agent instance for orchestrator
        """
        effective_model = model_name or self.default_model

        # Check if orchestrator already exists in registry
        existing_agent = self.factory.registry.get("orchestrator")
        if existing_agent:
            logger.info("Using cached orchestrator agent")
            return existing_agent

        # Create new orchestrator agent
        logger.info(f"Creating orchestrator agent (#5-4) with model {effective_model}")
        agent = await self.factory.create_agent(
            subsystem=None,  # None = orchestrator
            model_name=effective_model,
            bimba_client=self.bimba_client,
            redis_client=self.redis_client
        )

        return agent

    async def get_agent_for_subsystem(
        self,
        subsystem: int,
        model_name: Optional[str] = None
    ):
        """
        Get or create an agent for a specific subsystem.

        Args:
            subsystem: Subsystem number (0-5)
            model_name: Optional model override

        Returns:
            Pydantic AI Agent instance
        """
        effective_model = model_name or self.default_model

        # Check if agent already exists in registry
        existing_agent = self.factory.registry.get(subsystem)
        if existing_agent:
            logger.info(f"Using cached agent for subsystem {subsystem}")
            return existing_agent

        # Create new agent
        logger.info(f"Creating new agent for subsystem {subsystem} with model {effective_model}")
        agent = await self.factory.create_agent(
            subsystem=subsystem,
            model_name=effective_model,
            bimba_client=self.bimba_client,
            redis_client=self.redis_client
        )

        return agent

    def get_subsystem_info(self, subsystem: int) -> Dict[str, Any]:
        """Get metadata about a subsystem"""
        subsystem_names = {
            0: "Anuttara",
            1: "Paramasiva",
            2: "Parashakti",
            3: "Mahamaya",
            4: "Nara",
            5: "Epii"
        }

        subsystem_coords = {
            0: "#0",
            1: "#1",
            2: "#2",
            3: "#3",
            4: "#4",
            5: "#5"
        }

        return {
            "subsystem": subsystem,
            "name": subsystem_names.get(subsystem, "Unknown"),
            "coordinate": subsystem_coords.get(subsystem, f"#{subsystem}"),
            "agent_coordinate": f"#{subsystem}-4.{subsystem}"
        }
