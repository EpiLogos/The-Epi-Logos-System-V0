"""
UnifiedOrchestrator Core Implementation

The main orchestration engine that provides persona masking capability and routes
requests to appropriate persona workflows based on context and user intent.

Implements AC1: Single orchestrator that "puts on the mask" of different personas
Implements AC5: Clean slate persona re-instantiation protocols
"""

import logging
import uuid
import json
import asyncio
from typing import Optional, Dict, Any, List, AsyncIterator
from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field

# 🚨 ARCHITECTURAL COMPLIANCE: Import LLM service layer
from ..llm_services import llm_manager
from .persona_models import PersonaModelRouter

# AG-UI Protocol imports for event simulation
try:
    from ag_ui.core import (
        RunAgentInput, UserMessage, Context, State,
        TextMessageStartEvent, TextMessageContentEvent, TextMessageEndEvent,
        RunStartedEvent, RunFinishedEvent, RunErrorEvent
    )
    AG_UI_AVAILABLE = True
    SSE_CONTENT_TYPE = "text/event-stream"
except ImportError:
    AG_UI_AVAILABLE = False
    SSE_CONTENT_TYPE = "text/event-stream"
    logger = logging.getLogger(__name__)
    logger.warning("AG-UI Protocol not available. Install ag-ui-protocol package for streaming support.")

from .persona_manager import PersonaManager
from .session import SessionManager, OrchestratorSession
from .context_package import ContextPackageBuilder, ContextPackage
from .bimba_client import BimbaGraphQLClient
# Lazy import ConversationManager to avoid requiring MongoDB driver at import time
from .capabilities import Capabilities

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
    # Session-scoped model selection and system override
    requested_model: Optional[str] = None
    system_override: Optional[str] = None


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
        from .conversation import ConversationManager
        self.conversation_manager = ConversationManager(mongodb_url, mongodb_db_name)
        # Capabilities (single source of truth)
        self.capabilities = Capabilities()

        # 🎭 CORE FEATURE: Persona model router
        self.persona_router = PersonaModelRouter(self.capabilities)

        # 🚨 ARCHITECTURAL COMPLIANCE: Validate LLM services on startup
        self._validate_llm_services()

        logger.info(f"UnifiedOrchestrator initialized with model: {model_name}")
        logger.info("Persona routing enabled - different personas will use different models")

    def _validate_llm_services(self):
        """Ensure LLM services are properly initialized"""
        status = llm_manager.get_service_status()
        available = [k for k, v in status.items() if v]
        if not available:
            raise RuntimeError("No LLM services available")
        logger.info(f"LLM services available: {available}")
    
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
            
            # Resolve effective model with precedence: requested -> session -> default
            try:
                effective_model = await self._resolve_effective_model(session, request)
            except ValueError as e:
                return OrchestratorResponse(
                    success=False,
                    session_id=session.session_id,
                    active_persona=target_persona,
                    response=f"Model selection error: {e}",
                    error=str(e)
                )
            
            # Persist system override into session if provided
            if request.system_override is not None:
                session.metadata["system_override"] = request.system_override
                await self.session_manager.update_session(session)

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
                session=session,
                model_name=effective_model
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

    async def process_request_ag_ui_stream(
        self,
        request: OrchestratorRequest,
        accept: str = "text/event-stream"
    ) -> AsyncIterator[str]:
        """🚨 ARCHITECTURAL COMPLIANCE: Process request using LLM service with AG-UI event simulation"""

        try:
            # Standard processing through LLM service
            response = await self.process_request(request)

            # Simulate AG-UI events for compatibility
            async for event_str in self._simulate_ag_ui_events(response.response):
                yield event_str

        except Exception as e:
            logger.error(f"Error in AG-UI streaming: {e}")
            error_event = {
                "type": "run_error",
                "message": str(e),
                "code": "ORCHESTRATOR_ERROR"
            }
            yield f"data: {json.dumps(error_event)}\n\n"

    async def _simulate_ag_ui_events(self, response_text: str) -> AsyncIterator[str]:
        """Simulate AG-UI events for compatibility with existing clients"""

        # Start event
        yield f"data: {json.dumps({'type': 'run_started'})}\n\n"
        yield f"data: {json.dumps({'type': 'text_message_start'})}\n\n"

        # Stream content in chunks
        words = response_text.split()
        chunk_size = 3

        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i:i + chunk_size])
            if i + chunk_size < len(words):
                chunk += " "

            event = {"type": "text_message_content", "content": chunk}
            yield f"data: {json.dumps(event)}\n\n"

            # Small delay for realistic streaming
            await asyncio.sleep(0.05)

        # End events
        yield f"data: {json.dumps({'type': 'text_message_end'})}\n\n"
        yield f"data: {json.dumps({'type': 'run_finished'})}\n\n"

    # 🚨 ARCHITECTURAL COMPLIANCE: Removed deprecated AG-UI helper methods
    # All functionality now routes through LLM service layer

    async def process_ag_ui_input_stream(
        self,
        ag_ui_input: 'RunAgentInput',
        accept: str = "text/event-stream"
    ) -> AsyncIterator[str]:
        """🚨 ARCHITECTURAL COMPLIANCE: Process AG-UI input through LLM service layer"""

        try:
            # Extract session information from AG-UI input
            session_id = ag_ui_input.thread_id
            session = await self.session_manager.get_session(session_id)
            if not session:
                session = await self.session_manager.create_session(user_id=session_id)

            # Determine persona from AG-UI context
            persona_name = "system"
            try:
                ctx_obj = ag_ui_input.context
                ctx_list = ctx_obj if isinstance(ctx_obj, list) else ([ctx_obj] if ctx_obj else [])
                for ctx in ctx_list:
                    desc = getattr(ctx, "description", "")
                    val = getattr(ctx, "value", None)
                    if desc == "persona" and isinstance(val, str) and val:
                        persona_name = val
                        break
            except Exception:
                persona_name = "system"

            try:
                target_persona = PersonaType(persona_name)
            except ValueError:
                target_persona = PersonaType.SYSTEM

            # Extract user message
            user_message = ""
            if ag_ui_input.messages:
                user_message = ag_ui_input.messages[0].content

            # Create orchestrator request and process through LLM service
            request = OrchestratorRequest(
                user_id=session.user_id,
                session_id=session_id,
                message=user_message,
                requested_persona=target_persona
            )

            # 🚀 REAL STREAMING through LLM service layer

            # Start event
            yield f"data: {json.dumps({'type': 'run_started'})}\n\n"

            # Get session and resolve model through persona routing
            session = await self._get_or_create_session(request.user_id, request.session_id)
            effective_model = await self._resolve_effective_model(session, request)
            provider, model_name = self._parse_model_name(effective_model)

            # Build messages for LLM service
            messages = self._build_llm_messages(request, session)

            # Real streaming through LLM service layer
            yield f"data: {json.dumps({'type': 'text_message_start'})}\n\n"

            async for chunk in llm_manager.chat_completion_stream(
                messages=messages,
                provider=provider,
                model=model_name
            ):
                # Convert LLM chunks to AG-UI events
                event = {
                    "type": "text_message_content",
                    "content": chunk
                }
                yield f"data: {json.dumps(event)}\n\n"

            # End events
            yield f"data: {json.dumps({'type': 'text_message_end'})}\n\n"
            yield f"data: {json.dumps({'type': 'run_finished'})}\n\n"

        except Exception as e:
            logger.error(f"Error processing AG-UI input: {e}")
            error_event = {
                "type": "run_error",
                "message": str(e),
                "code": "AG_UI_PROCESSING_ERROR"
            }
            yield f"data: {json.dumps(error_event)}\n\n"

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
        session: OrchestratorSession,
        model_name: str
    ) -> str:
        """🚨 ARCHITECTURAL COMPLIANCE: Execute request through LLM service layer"""

        # Parse provider and model from model_name
        provider, model = self._parse_model_name(model_name)

        # Build messages for LLM service
        messages = self._build_llm_messages(
            persona=persona,
            context_package=context_package,
            message=message,
            session=session
        )

        try:
            # 🎯 ROUTE THROUGH LLM SERVICE LAYER
            response = await llm_manager.chat_completion(
                messages=messages,
                provider=provider,
                model=model
            )

            if not response:
                raise Exception(f"No response from {provider}:{model}")

            return response

        except Exception as e:
            logger.error(f"LLM service error for {persona}: {e}")
            return f"I apologize, but I encountered an error while processing your request as {persona.value}. Please try again."

    def _parse_model_name(self, model_name: str) -> tuple[str, str]:
        """Parse provider:model format"""
        if ":" in model_name:
            provider, model = model_name.split(":", 1)
            return provider.strip(), model.strip()
        return "openai", model_name  # Default to OpenAI

    def _build_llm_messages(
        self,
        persona: PersonaType,
        context_package: Optional[ContextPackage],
        message: str,
        session: OrchestratorSession
    ) -> List[Dict[str, str]]:
        """Build messages array for LLM service"""

        # Get persona system prompt
        persona_prompt = self.persona_manager.get_persona_prompt(persona.value)

        # Add system override if present
        sys_override = (session.metadata or {}).get("system_override")
        if sys_override:
            final_system_prompt = persona_prompt.rstrip() + "\n\n" + str(sys_override).strip()
        else:
            final_system_prompt = persona_prompt

        # Add context package if available
        if context_package:
            context_text = f"\n\nContext Package:\n{context_package.model_dump_json(indent=2)}"
            final_system_prompt += context_text

        return [
            {"role": "system", "content": final_system_prompt},
            {"role": "user", "content": message}
        ]

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

    async def _resolve_effective_model(self, session: OrchestratorSession, request: OrchestratorRequest) -> str:
        """🎭 ENHANCED: Determine effective model with persona-specific routing

        Precedence:
        1. requested_model (explicit override)
        2. session.model_name (session preference)
        3. persona-specific model (CORE FEATURE)
        4. capabilities.get_default_model() (fallback)
        """
        # Explicit request takes precedence
        if request.requested_model:
            if not self.capabilities.validate_model(request.requested_model):
                raise ValueError(f"invalid or not-ready model: {request.requested_model}")
            if session.model_name != request.requested_model:
                session.model_name = request.requested_model
                await self.session_manager.update_session(session)
            return request.requested_model

        # Session model if set and valid
        if session.model_name and self.capabilities.validate_model(session.model_name):
            return session.model_name

        # 🎭 PERSONA-SPECIFIC MODEL ROUTING (CORE FEATURE)
        persona = await self._determine_persona(request, session)
        persona_model = self.persona_router.get_model_for_persona(
            persona,
            fallback_model=session.model_name
        )

        # Update session with persona model
        if session.model_name != persona_model:
            session.model_name = persona_model
            await self.session_manager.update_session(session)
            logger.info(f"Session {session.session_id} assigned persona model: {persona.value} → {persona_model}")

        return persona_model
    
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
        
        # Redacted hash of any session system override to verify routing changes without leaking
        import hashlib
        so = (session.metadata or {}).get("system_override")
        so_hash = hashlib.sha256(so.encode("utf-8")).hexdigest() if isinstance(so, str) and so else None

        return {
            'session_id': session.session_id,
            'user_id': session.user_id,
            'active_persona': session.active_persona,
            'model_name': session.model_name,
            'system_hash': so_hash,
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

    async def update_session_model(self, session_id: str, model_name: str) -> bool:
        """Validate and set the session's model.

        Returns True if updated, False if invalid/not-ready or no session found.
        """
        try:
            if not self.capabilities.validate_model(model_name):
                return False
            session = await self.session_manager.get_session(session_id)
            if not session:
                return False
            session.model_name = model_name
            await self.session_manager.update_session(session)
            return True
        except Exception as e:
            logger.error(f"Error updating session model for {session_id}: {e}")
            return False

    async def update_session_instructions(self, session_id: str, text: Optional[str]) -> bool:
        """Set or clear a session-level system override instruction."""
        try:
            session = await self.session_manager.get_session(session_id)
            if not session:
                return False
            if text is None or text == "":
                session.metadata.pop("system_override", None)
            else:
                session.metadata["system_override"] = str(text)
            await self.session_manager.update_session(session)
            return True
        except Exception as e:
            logger.error(f"Error updating session instructions for {session_id}: {e}")
            return False

    def get_capabilities(self) -> Dict[str, Any]:
        """Expose orchestrator capabilities: providers, models, and default model."""
        models = [
            {
                "name": m.name,
                "provider": m.provider,
                "ready": m.ready,
                "default": m.default,
            }
            for m in self.capabilities.list_models()
        ]

        # 🎭 Include persona routing information
        persona_routing = self.persona_router.get_routing_summary()

        return {
            "providers": self.capabilities.list_providers(),
            "models": models,
            "default_model": self.capabilities.get_default_model(),
            "persona_routing": persona_routing,
        }

    def set_persona_model(self, persona: PersonaType, model: str) -> bool:
        """🎭 Set model for a specific persona"""
        return self.persona_router.set_persona_model(persona, model)

    def get_persona_models(self) -> Dict[PersonaType, str]:
        """🎭 Get current model assignments for all personas"""
        return self.persona_router.get_all_persona_models()

    def validate_persona_models(self) -> Dict[PersonaType, bool]:
        """🎭 Validate all persona model assignments"""
        return self.persona_router.validate_all_persona_models()
