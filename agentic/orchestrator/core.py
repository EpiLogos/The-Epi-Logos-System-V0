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
from typing import Optional, Dict, Any, List, AsyncIterator
from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext

# AG-UI Protocol imports
try:
    from ag_ui.core import (
        RunAgentInput, UserMessage, Context, State,
        TextMessageStartEvent, TextMessageContentEvent, TextMessageEndEvent,
        RunStartedEvent, RunFinishedEvent, RunErrorEvent
    )
    from pydantic_ai.ag_ui import run_ag_ui, SSE_CONTENT_TYPE
    AG_UI_AVAILABLE = True
except ImportError:
    AG_UI_AVAILABLE = False
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
        accept: str = SSE_CONTENT_TYPE
    ) -> AsyncIterator[str]:
        """
        Process request using AG-UI Protocol for streaming responses.

        This method converts the OrchestratorRequest to AG-UI format and streams
        AG-UI protocol events for real-time communication with clients.

        Now properly mirrors the non-streaming path for model resolution and
        system prompt composition.

        Args:
            request: The orchestrator request to process
            accept: Content type for streaming (default: SSE)

        Yields:
            AG-UI protocol event strings formatted for the specified accept type
        """
        if not AG_UI_AVAILABLE:
            # Fallback to non-streaming response
            response = await self.process_request(request)
            yield f"data: {json.dumps({'type': 'text_message_content', 'content': response.response})}\n\n"
            return

        try:
            # Get or create session for context
            session = await self._get_or_create_session(
                user_id=request.user_id,
                session_id=request.session_id
            )

            # Determine persona and build context
            target_persona = await self._determine_persona(request, session)

            # Resolve effective model (mirrors non-streaming path)
            effective_model = await self._resolve_effective_model(session, request)

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

            # Compose final system prompt (persona + system_override)
            persona_prompt = self.persona_manager.get_persona_prompt(target_persona.value)
            sys_override = (session.metadata or {}).get("system_override")
            if sys_override:
                final_system_prompt = persona_prompt.rstrip() + "\n\n" + str(sys_override).strip()
            else:
                final_system_prompt = persona_prompt

            # Create per-request agent with effective model and final prompt (mirrors non-streaming)
            streaming_agent = Agent(
                effective_model,
                deps_type=Dict[str, Any],
                system_prompt=final_system_prompt
            )

            # Prepare agent dependencies
            agent_deps = self._build_agent_deps_for_streaming(
                persona=target_persona,
                context_package=context_package,
                session=session,
                final_system_prompt=final_system_prompt
            )

            # Convert OrchestratorRequest to AG-UI RunAgentInput using canonical builder
            from agentic.cli.agui_payload import build_run_agent_input

            ag_ui_input = build_run_agent_input(
                thread_id=request.session_id or str(uuid.uuid4()),
                user_text=request.message,
                persona=target_persona.value,
                system_override=sys_override,
                tools=[],  # Empty for now, could be enhanced
                state={},
                forwarded_props={"thread_id": session.session_id, "model": effective_model}
            )

            # Stream AG-UI events using per-request agent
            async for event_str in run_ag_ui(
                streaming_agent,  # ✅ Use per-request agent with correct model/prompt
                ag_ui_input,
                accept=accept,
                deps=agent_deps
            ):
                yield event_str

            # Update session state after streaming completes
            await self._update_session_state_from_ag_ui(
                session=session,
                persona=target_persona,
                request=request,
                ag_ui_input=ag_ui_input
            )

        except Exception as e:
            logger.error(f"Error in AG-UI streaming: {e}")
            # Send error event
            error_event = {
                "type": "run_error",
                "message": str(e),
                "code": "ORCHESTRATOR_ERROR"
            }
            yield f"data: {json.dumps(error_event)}\n\n"

    # Removed _convert_to_ag_ui_input - now using canonical builder from agui_payload.py

    def _build_agent_deps(
        self,
        persona: PersonaType,
        context_package: Optional['ContextPackage'],
        session: 'OrchestratorSession'
    ) -> Dict[str, Any]:
        """Build agent dependencies for AG-UI execution (legacy method)."""
        return {
            'active_persona': persona.value,
            'persona_prompt': self.persona_manager.get_persona_prompt(persona.value),
            'context_package': context_package.model_dump() if context_package else None,
            'session_id': session.session_id,
            'user_id': session.user_id,
            'session_context': session.context
        }

    def _build_agent_deps_for_streaming(
        self,
        persona: PersonaType,
        context_package: Optional['ContextPackage'],
        session: 'OrchestratorSession',
        final_system_prompt: str
    ) -> Dict[str, Any]:
        """Build agent dependencies for streaming AG-UI execution with composed system prompt."""
        return {
            'active_persona': persona.value,
            'persona_prompt': final_system_prompt,  # ✅ Use composed prompt with system_override
            'context_package': context_package.model_dump() if context_package else None,
            'session_id': session.session_id,
            'user_id': session.user_id,
            'session_context': session.context
        }

    async def _update_session_state_from_ag_ui(
        self,
        session: 'OrchestratorSession',
        persona: PersonaType,
        request: OrchestratorRequest,
        ag_ui_input: 'RunAgentInput'
    ):
        """Update session state after AG-UI streaming completes."""
        # Update active persona
        session.active_persona = persona.value
        session.last_activity = datetime.now(timezone.utc)

        # Save session state
        await self.session_manager.update_session(session)

        # Note: We don't have the final response here since it's streamed
        # The conversation history will be updated by the client or through
        # a separate mechanism that captures the streamed content
        logger.info(f"Session {session.session_id} updated after AG-UI streaming")

    async def process_ag_ui_input_stream(
        self,
        ag_ui_input: 'RunAgentInput',
        accept: str = SSE_CONTENT_TYPE
    ) -> AsyncIterator[str]:
        """
        Process AG-UI RunAgentInput directly for streaming responses.

        This method accepts AG-UI input directly and streams AG-UI protocol events.
        Useful for WebSocket endpoints and direct AG-UI protocol integration.

        Args:
            ag_ui_input: The AG-UI RunAgentInput to process
            accept: Content type for streaming (default: SSE)

        Yields:
            AG-UI protocol event strings formatted for the specified accept type
        """
        if not AG_UI_AVAILABLE:
            raise RuntimeError("AG-UI Protocol not available")

        try:
            # Extract session information from AG-UI input
            # Use thread_id as session_id; retrieve existing session to preserve model/persona
            session_id = ag_ui_input.thread_id
            session = await self.session_manager.get_session(session_id)
            if not session:
                # Create a new session when none exists; use session_id as user_id for simplicity
                session = await self.session_manager.create_session(user_id=session_id)

            # Determine persona from AG-UI context (supports list or single Context)
            persona_name = "system"
            try:
                ctx_obj = ag_ui_input.context
                ctx_list = ctx_obj if isinstance(ctx_obj, list) else ([ctx_obj] if ctx_obj else [])
                # Prefer entry explicitly labeled as persona
                for ctx in ctx_list:
                    desc = getattr(ctx, "description", "")
                    val = getattr(ctx, "value", None)
                    if desc == "persona" and isinstance(val, str) and val:
                        persona_name = val
                        break
                # Fallback to first string value
                if persona_name == "system":
                    for ctx in ctx_list:
                        val = getattr(ctx, "value", None)
                        if isinstance(val, str) and val:
                            persona_name = val
                            break
            except Exception:
                persona_name = "system"
            try:
                target_persona = PersonaType(persona_name)
            except ValueError:
                target_persona = PersonaType.SYSTEM

            # Build context package (simplified for AG-UI input)
            context_package = None  # Could be enhanced to extract from ag_ui_input.state

            # Build effective model and system prompt – align with non-streaming path
            # Resolve model from session/default
            model_name = None
            try:
                if session.model_name and self.capabilities.validate_model(session.model_name):
                    model_name = session.model_name
                else:
                    model_name = self.capabilities.get_default_model()
            except Exception:
                model_name = self.model_name

            # Compose final system prompt (persona + session override)
            persona_prompt = self.persona_manager.get_persona_prompt(target_persona.value)
            sys_override = (session.metadata or {}).get("system_override")
            final_system_prompt = persona_prompt.rstrip()
            if sys_override:
                final_system_prompt += "\n\n" + str(sys_override).strip()

            agent_deps = self._build_agent_deps(
                persona=target_persona,
                context_package=context_package,
                session=session
            )

            persona_agent = Agent(
                model_name,
                deps_type=Dict[str, Any],
                system_prompt=final_system_prompt
            )

            # Stream AG-UI events using Pydantic AI's support
            async for event_str in run_ag_ui(
                persona_agent,
                ag_ui_input,
                accept=accept,
                deps=agent_deps
            ):
                yield event_str

            # Update session state after streaming completes
            session.active_persona = target_persona.value
            session.last_activity = datetime.now(timezone.utc)
            await self.session_manager.update_session(session)

        except Exception as e:
            logger.error(f"Error processing AG-UI input: {e}")
            # Send error event
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
        """Execute request with persona masking applied"""
        
        # Get persona-specific system prompt
        persona_prompt = self.persona_manager.get_persona_prompt(persona.value)
        # Compose system override if present in session
        sys_override = (session.metadata or {}).get("system_override")
        if sys_override:
            final_system_prompt = persona_prompt.rstrip() + "\n\n" + str(sys_override).strip()
        else:
            final_system_prompt = persona_prompt
        
        # Prepare context for agent execution
        agent_context = {
            'active_persona': persona.value,
            'persona_prompt': final_system_prompt,
            'context_package': context_package.model_dump() if context_package else None,
            'session_id': session.session_id,
            'user_id': session.user_id
        }
        
        # Create temporary agent with persona-specific prompt
        persona_agent = Agent(
            model_name,
            deps_type=Dict[str, Any],
            system_prompt=final_system_prompt
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

    async def _resolve_effective_model(self, session: OrchestratorSession, request: OrchestratorRequest) -> str:
        """Determine the effective model for this request and persist it to the session.

        Precedence: requested_model -> session.model_name -> capabilities.get_default_model()
        Raises ValueError if the requested model is invalid/not-ready or no default available.
        """
        # Requested model takes precedence
        if request.requested_model:
            if not self.capabilities.validate_model(request.requested_model):
                raise ValueError(f"invalid or not-ready model: {request.requested_model}")
            if session.model_name != request.requested_model:
                session.model_name = request.requested_model
                await self.session_manager.update_session(session)
            return request.requested_model

        # Use session model if valid
        if session.model_name and self.capabilities.validate_model(session.model_name):
            return session.model_name

        # Otherwise, use default
        model = self.capabilities.get_default_model()
        if session.model_name != model:
            session.model_name = model
            await self.session_manager.update_session(session)
        return model
    
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
        return {
            "providers": self.capabilities.list_providers(),
            "models": models,
            "default_model": self.capabilities.get_default_model(),
        }
