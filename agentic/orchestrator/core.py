"""
UnifiedOrchestrator Core Implementation

The main orchestration engine that provides persona masking capability and routes
requests to appropriate persona workflows based on context and user intent.

Implements AC1: Single orchestrator that "puts on the mask" of different personas
Implements AC5: Clean slate persona re-instantiation protocols
"""

import logging
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext

from .persona_manager import PersonaManager
from .session import SessionManager, OrchestratorSession
from .context_package import ContextPackageBuilder, ContextPackage
from .bimba_client import BimbaGraphQLClient
from .conversation import ConversationManager

logger = logging.getLogger(__name__)


class PersonaType(str, Enum):
    """Available persona types"""
    NARA = "nara"
    EPII = "epii" 
    SYSTEM = "system"


class OrchestratorRequest(BaseModel):
    """Request model for orchestrator operations"""
    user_id: str
    session_id: Optional[str] = None
    message: str
    requested_persona: Optional[PersonaType] = None
    context_hint: Optional[str] = None


class OrchestratorResponse(BaseModel):
    """Response model from orchestrator operations"""
    success: bool
    session_id: str
    active_persona: PersonaType
    response: str
    error: Optional[str] = None
    context_used: Optional[List[str]] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UnifiedOrchestrator:
    """
    Main orchestration engine with persona masking capability.
    
    The UnifiedOrchestrator acts as a single agent that can "put on the mask" of 
    different personas (Nara, Epii) rather than managing separate agents. It uses
    clean slate re-instantiation protocols to maintain context isolation between
    persona switches.
    """
    
    def __init__(
        self,
        redis_url: str,
        mongodb_url: str,
        graphql_endpoint: str,
        model_name: str = "openai:gpt-4o"
    ):
        """Initialize the UnifiedOrchestrator with required dependencies"""
        self.model_name = model_name
        
        # Initialize core components
        self.persona_manager = PersonaManager()
        self.session_manager = SessionManager(redis_url)
        self.context_builder = ContextPackageBuilder()
        self.bimba_client = BimbaGraphQLClient(graphql_endpoint)
        # Get database name from environment or use default
        import os
        mongodb_db_name = os.getenv("MONGODB_DATABASE", "EpiiTest")
        self.conversation_manager = ConversationManager(mongodb_url, mongodb_db_name)
        
        # Initialize the underlying Pydantic AI agent
        self._agent = self._create_agent()
        
        logger.info(f"UnifiedOrchestrator initialized with model: {model_name}")
    
    def _create_agent(self) -> Agent:
        """Create the underlying Pydantic AI agent for orchestration"""
        return Agent(
            self.model_name,
            deps_type=Dict[str, Any],
            system_prompt=self._get_base_system_prompt()
        )
    
    def _get_base_system_prompt(self) -> str:
        """Base system prompt for the orchestrator"""
        return """
        You are a Unified Orchestrator for the Epi-Logos System, capable of adopting 
        different personas to assist users. You can embody:
        
        - Nara: Personal reflection and journaling companion
        - Epii: Knowledge synthesis and wisdom insights specialist  
        - System: General assistance and coordination
        
        When a specific persona is requested, fully embody that role and respond 
        accordingly. Maintain consistency with the chosen persona throughout the 
        conversation unless explicitly asked to switch.
        
        If no specific persona is requested, analyze the user's intent and either:
        1. Ask which persona they would prefer, or
        2. Select the most appropriate persona based on context
        """
    
    async def process_request(self, request: OrchestratorRequest) -> OrchestratorResponse:
        """
        Main entry point for processing user requests with persona masking.
        
        Implements the core orchestration logic:
        1. Get or create session
        2. Determine appropriate persona  
        3. Build context package
        4. Execute with persona mask
        5. Update session state
        """
        try:
            # Get or create session
            session = await self._get_or_create_session(
                user_id=request.user_id,
                session_id=request.session_id
            )
            
            # Determine persona to use
            target_persona = await self._determine_persona(request, session)
            
            # Build context package for the persona
            context_package = await self._build_context_package(
                persona=target_persona,
                session=session,
                request=request
            )
            
            # Execute with persona masking
            response_text = await self._execute_with_persona(
                persona=target_persona,
                context_package=context_package,
                message=request.message,
                session=session
            )
            
            # Update session with interaction
            await self._update_session_state(
                session=session,
                persona=target_persona,
                user_message=request.message,
                agent_response=response_text
            )
            
            return OrchestratorResponse(
                success=True,
                session_id=session.session_id,
                active_persona=target_persona,
                response=response_text,
                context_used=context_package.file_list if context_package else None
            )
            
        except Exception as e:
            logger.error(f"Error processing orchestrator request: {e}")
            
            # Return error response with basic fallback
            return OrchestratorResponse(
                success=False,
                session_id=request.session_id or str(uuid.uuid4()),
                active_persona=PersonaType.SYSTEM,
                response="I apologize, but I encountered an error processing your request. Please try again.",
                error=str(e)
            )
    
    async def _get_or_create_session(
        self, 
        user_id: str, 
        session_id: Optional[str]
    ) -> OrchestratorSession:
        """Get existing session or create new one"""
        if session_id:
            session = await self.session_manager.get_session(session_id)
            if session and session.user_id == user_id:
                return session
        
        # Create new session
        return await self.session_manager.create_session(user_id)
    
    async def _determine_persona(
        self, 
        request: OrchestratorRequest, 
        session: OrchestratorSession
    ) -> PersonaType:
        """Determine which persona to use based on request and session context"""
        
        # Use explicitly requested persona
        if request.requested_persona:
            return request.requested_persona
        
        # Use session's active persona if available
        if session.active_persona:
            return PersonaType(session.active_persona)
        
        # Simple keyword-based intent classification for foundation implementation
        message_lower = request.message.lower()
        
        if any(keyword in message_lower for keyword in [
            'journal', 'reflection', 'personal', 'diary', 'thoughts', 'feelings'
        ]):
            return PersonaType.NARA
        
        if any(keyword in message_lower for keyword in [
            'wisdom', 'insight', 'knowledge', 'synthesis', 'analysis', 'meaning'
        ]):
            return PersonaType.EPII
            
        # Default to system persona for general queries
        return PersonaType.SYSTEM
    
    async def _build_context_package(
        self,
        persona: PersonaType,
        session: OrchestratorSession, 
        request: OrchestratorRequest
    ) -> Optional[ContextPackage]:
        """Build ACT Protocol context package for persona execution"""
        
        try:
            # Build context package using ACT Protocol foundation
            package = await self.context_builder.build_package(
                persona=persona.value,
                session_context=session.context,
                user_request=request.message,
                bimba_context=session.bimba_context
            )
            
            return package
            
        except Exception as e:
            logger.warning(f"Failed to build context package: {e}")
            return None
    
    async def _execute_with_persona(
        self,
        persona: PersonaType,
        context_package: Optional[ContextPackage],
        message: str,
        session: OrchestratorSession
    ) -> str:
        """Execute request with persona masking applied"""
        
        # Get persona-specific system prompt
        persona_prompt = self.persona_manager.get_persona_prompt(persona.value)
        
        # Prepare context for agent execution
        agent_context = {
            'active_persona': persona.value,
            'persona_prompt': persona_prompt,
            'context_package': context_package.model_dump() if context_package else None,
            'session_id': session.session_id,
            'user_id': session.user_id
        }
        
        # Create temporary agent with persona-specific prompt
        persona_agent = Agent(
            self.model_name,
            deps_type=Dict[str, Any],
            system_prompt=persona_prompt
        )
        
        try:
            # Execute with clean slate for persona
            result = await persona_agent.run(message, deps=agent_context)
            return result.output
            
        except Exception as e:
            logger.error(f"Error executing with persona {persona}: {e}")
            return f"I apologize, but I encountered an error while processing your request as {persona.value}. Please try again."
    
    async def _update_session_state(
        self,
        session: OrchestratorSession,
        persona: PersonaType,
        user_message: str,
        agent_response: str
    ):
        """Update session state with new interaction"""
        
        # Update active persona
        session.active_persona = persona.value
        session.last_activity = datetime.now(timezone.utc)
        
        # Save session state
        await self.session_manager.update_session(session)
        
        # Save conversation history
        await self.conversation_manager.add_interaction(
            session_id=session.session_id,
            user_message=user_message,
            agent_response=agent_response,
            persona=persona.value
        )
    
    async def switch_persona(
        self, 
        session_id: str, 
        new_persona: PersonaType,
        preserve_context: bool = True
    ) -> bool:
        """
        Explicitly switch persona for a session with clean slate re-instantiation.
        
        Implements AC5: Clean slate persona re-instantiation protocols
        """
        try:
            session = await self.session_manager.get_session(session_id)
            if not session:
                return False
            
            # Implement clean slate protocol
            if preserve_context:
                # Store current context before switch
                context_snapshot = {
                    'previous_persona': session.active_persona,
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'context': session.context.copy() if session.context else {}
                }
                
                # Add to persona history stack
                if not hasattr(session, 'persona_history'):
                    session.persona_history = []
                session.persona_history.append(context_snapshot)
            else:
                # Clear context for true clean slate
                session.context = {}
                session.bimba_context = []
            
            # Switch persona
            old_persona = session.active_persona
            session.active_persona = new_persona.value
            session.last_activity = datetime.now(timezone.utc)
            
            # Update session
            await self.session_manager.update_session(session)
            
            logger.info(f"Persona switch: {old_persona} -> {new_persona.value} for session {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error switching persona for session {session_id}: {e}")
            return False
    
    async def get_session_status(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get current session status and persona information"""
        session = await self.session_manager.get_session(session_id)
        if not session:
            return None
        
        return {
            'session_id': session.session_id,
            'user_id': session.user_id,
            'active_persona': session.active_persona,
            'last_activity': session.last_activity.isoformat(),
            'context_keys': list(session.context.keys()) if session.context else [],
            'bimba_coordinates': len(session.bimba_context)
        }
    
    async def cleanup_session(self, session_id: str) -> bool:
        """Clean up session resources"""
        try:
            await self.session_manager.cleanup_session(session_id)
            return True
        except Exception as e:
            logger.error(f"Error cleaning up session {session_id}: {e}")
            return False