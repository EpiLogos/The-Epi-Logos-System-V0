"""
Agent Runner Service

This service provides a clean interface for running the Pydantic AI agent
with proper streaming, error handling, and integration with the existing
UnifiedOrchestrator infrastructure.
"""

import asyncio
import json
import logging
from typing import Optional, List, Dict, Any, AsyncIterator, Callable
from datetime import datetime, timezone

from .orchestrator_agent import (
    orchestrator_agent, 
    OrchestratorDeps, 
    OrchestratorResponse,
    is_agent_available,
    create_orchestrator_agent
)

# Import existing infrastructure
from ..orchestrator.types import PersonaType
from ..orchestrator.session import OrchestratorSession

logger = logging.getLogger(__name__)


class AgentRunner:
    """Service to run the Pydantic AI agent with proper streaming and integration"""
    
    def __init__(self):
        """Initialize the agent runner"""
        if not is_agent_available():
            raise RuntimeError("Pydantic AI agent is not available")
        
        self.agent = orchestrator_agent
        logger.info("AgentRunner initialized with Pydantic AI agent")
    
    def _prepare_dependencies(
        self, 
        session: OrchestratorSession,
        session_manager: Any,
        conversation_manager: Any,
        bimba_client: Any,
        lightrag_client: Optional[Any] = None,
        graphiti_client: Optional[Any] = None,
        context_package: Optional[Dict[str, Any]] = None
    ) -> OrchestratorDeps:
        """Prepare the dependencies container for the agent"""
        
        return OrchestratorDeps(
            session_id=session.session_id,
            user_id=session.user_id,
            redis_client=session_manager,
            mongodb_client=conversation_manager,
            bimba_client=bimba_client,
            lightrag_client=lightrag_client,
            graphiti_client=graphiti_client,
            current_persona=session.active_persona or "system",
            context_package=context_package
        )
    
    async def run_streaming(
        self, 
        message: str, 
        session: OrchestratorSession,
        session_manager: Any,
        conversation_manager: Any,
        bimba_client: Any,
        lightrag_client: Optional[Any] = None,
        graphiti_client: Optional[Any] = None,
        context_package: Optional[Dict[str, Any]] = None,
        message_history: Optional[List] = None,
        model_name: Optional[str] = None
    ) -> AsyncIterator[str]:
        """
        Run agent with streaming output compatible with existing infrastructure
        
        Yields text chunks as they're generated, then handles final result processing
        """
        try:
            # Prepare dependencies
            deps = self._prepare_dependencies(
                session=session,
                session_manager=session_manager,
                conversation_manager=conversation_manager,
                bimba_client=bimba_client,
                lightrag_client=lightrag_client,
                graphiti_client=graphiti_client,
                context_package=context_package
            )
            
            # Use specified model or default agent
            current_agent = self.agent
            if model_name:
                try:
                    # Create a new agent instance with the specified model
                    current_agent = create_orchestrator_agent(model_name)
                    logger.info(f"Created agent instance with model: {model_name}")
                except Exception as e:
                    logger.warning(f"Failed to create agent with model {model_name}, using default: {e}")
                    current_agent = self.agent
            
            # Track the complete response for final processing
            full_response = ""
            
            logger.info(f"Starting streaming run for session {session.session_id} with persona {deps.current_persona}")
            
            # Run the agent with streaming
            # Auto-hydrate message history from conversation store if not provided
            effective_history = message_history
            if effective_history is None and conversation_manager is not None:
                try:
                    effective_history = await conversation_manager.get_pydantic_message_history(session.session_id)
                except Exception:
                    effective_history = []

            async with current_agent.run_stream(
                message,
                deps=deps,
                message_history=effective_history or []
            ) as response:
                # Stream text as it's generated
                async for text_chunk in response.stream_text():
                    full_response += text_chunk
                    yield text_chunk
                
                # Get the final structured result
                try:
                    result = await response.get_result()
                    structured_output = result.output
                    
                    logger.info(f"Agent run completed successfully. Tools used: {structured_output.tools_used}")
                    
                    # Store interaction in conversation history with actual Pydantic AI messages
                    await conversation_manager.add_interaction(
                        session_id=session.session_id,
                        user_message=message,
                        agent_response=full_response,
                        persona=structured_output.persona_used,
                        context_used={
                            "tools_used": structured_output.tools_used,
                            "coordinates_accessed": structured_output.coordinates_accessed,
                            "confidence": structured_output.confidence,
                            "metadata": structured_output.metadata
                        },
                        pydantic_messages=result.new_messages()  # Store the actual Pydantic AI messages!
                    )
                    
                except Exception as e:
                    logger.error(f"Error getting structured result: {e}")
                    # Still store the basic interaction
                    await conversation_manager.add_interaction(
                        session_id=session.session_id,
                        user_message=message,
                        agent_response=full_response,
                        persona=deps.current_persona
                    )
                    
        except Exception as e:
            logger.error(f"Error in streaming agent run: {e}")
            error_message = f"I apologize, but I encountered an error while processing your request: {str(e)}"
            yield error_message
            
            # Store error in conversation
            try:
                await conversation_manager.add_interaction(
                    session_id=session.session_id,
                    user_message=message,
                    agent_response=error_message,
                    persona=session.active_persona or "system",
                    metadata={"error_details": str(e)}
                )
            except Exception as store_error:
                logger.error(f"Error storing conversation after agent error: {store_error}")
    
    async def run_with_structured_output(
        self,
        message: str,
        session: OrchestratorSession,
        session_manager: Any,
        conversation_manager: Any,
        bimba_client: Any,
        lightrag_client: Optional[Any] = None,
        graphiti_client: Optional[Any] = None,
        context_package: Optional[Dict[str, Any]] = None,
        message_history: Optional[List] = None,
        model_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Run agent and return structured output with metadata
        
        This is useful for API endpoints that need structured responses
        """
        try:
            # Prepare dependencies
            deps = self._prepare_dependencies(
                session=session,
                session_manager=session_manager,
                conversation_manager=conversation_manager,
                bimba_client=bimba_client,
                lightrag_client=lightrag_client,
                graphiti_client=graphiti_client,
                context_package=context_package
            )
            
            # Use specified model or default agent
            current_agent = self.agent
            if model_name:
                try:
                    current_agent = create_orchestrator_agent(model_name)
                    logger.info(f"Created agent instance with model: {model_name}")
                except Exception as e:
                    logger.warning(f"Failed to create agent with model {model_name}, using default: {e}")
                    current_agent = self.agent
            
            logger.info(f"Starting structured run for session {session.session_id}")
            
            # Run the agent
            # Auto-hydrate message history from conversation store if not provided
            effective_history = message_history
            if effective_history is None and conversation_manager is not None:
                try:
                    effective_history = await conversation_manager.get_pydantic_message_history(session.session_id)
                except Exception:
                    effective_history = []

            result = await current_agent.run(
                message,
                deps=deps,
                message_history=effective_history or []
            )
            
            structured_output = result.output
            
            # Store interaction in conversation history with actual Pydantic AI messages
            await conversation_manager.add_interaction(
                session_id=session.session_id,
                user_message=message,
                agent_response=structured_output.response,
                persona=structured_output.persona_used,
                context_used={
                    "tools_used": structured_output.tools_used,
                    "coordinates_accessed": structured_output.coordinates_accessed,
                    "confidence": structured_output.confidence,
                    "metadata": structured_output.metadata.model_dump() if structured_output.metadata else {}
                },
                pydantic_messages=result.new_messages()  # Store the actual Pydantic AI messages!
            )
            
            return {
                "success": True,
                "response": structured_output.response,
                "structured_output": structured_output.model_dump(mode="json"),
                "usage": result.usage() if hasattr(result, 'usage') else None
            }
            
        except Exception as e:
            logger.error(f"Error in structured agent run: {e}")
            
            error_response = f"I apologize, but I encountered an error: {str(e)}"
            
            # Store error in conversation
            try:
                await conversation_manager.add_interaction(
                    session_id=session.session_id,
                    user_message=message,
                    agent_response=error_response,
                    persona=session.active_persona or "system",
                    metadata={"error_details": str(e)}
                )
            except Exception as store_error:
                logger.error(f"Error storing conversation after agent error: {store_error}")
            
            return {
                "success": False,
                "response": error_response,
                "error": str(e)
            }
    
    async def run_with_events(
        self,
        message: str,
        session: OrchestratorSession,
        session_manager: Any,
        conversation_manager: Any,
        bimba_client: Any,
        event_handler: Optional[Callable] = None,
        lightrag_client: Optional[Any] = None,
        graphiti_client: Optional[Any] = None,
        context_package: Optional[Dict[str, Any]] = None,
        message_history: Optional[List] = None
    ) -> Dict[str, Any]:
        """
        Run agent with full event streaming for debugging and monitoring
        
        This provides detailed insight into what the agent is doing
        """
        try:
            # Prepare dependencies
            deps = self._prepare_dependencies(
                session=session,
                session_manager=session_manager,
                conversation_manager=conversation_manager,
                bimba_client=bimba_client,
                lightrag_client=lightrag_client,
                graphiti_client=graphiti_client,
                context_package=context_package
            )
            
            # Use specified model or default agent
            current_agent = self.agent
            if model_name:
                try:
                    current_agent = create_orchestrator_agent(model_name)
                    logger.info(f"Created agent instance with model: {model_name}")
                except Exception as e:
                    logger.warning(f"Failed to create agent with model {model_name}, using default: {e}")
                    current_agent = self.agent
            
            events = []
            
            async def handle_events(ctx, event_stream):
                """Internal event handler that captures all events"""
                async for event in event_stream:
                    event_data = {
                        "type": type(event).__name__,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "data": str(event)
                    }
                    events.append(event_data)
                    
                    # Call external event handler if provided
                    if event_handler:
                        try:
                            await event_handler(event)
                        except Exception as e:
                            logger.error(f"Error in external event handler: {e}")
            
            logger.info(f"Starting event-streaming run for session {session.session_id}")
            
            # Run with event streaming
            # Auto-hydrate message history from conversation store if not provided
            effective_history = message_history
            if effective_history is None and conversation_manager is not None:
                try:
                    effective_history = await conversation_manager.get_pydantic_message_history(session.session_id)
                except Exception:
                    effective_history = []

            result = await current_agent.run(
                message,
                deps=deps,
                event_stream_handler=handle_events,
                message_history=effective_history or []
            )
            
            structured_output = result.output
            
            # Store interaction
            await conversation_manager.add_interaction(
                session_id=session.session_id,
                user_message=message,
                agent_response=structured_output.response,
                persona=structured_output.persona_used,
                context_used={
                    "tools_used": structured_output.tools_used,
                    "coordinates_accessed": structured_output.coordinates_accessed,
                    "confidence": structured_output.confidence,
                    "metadata": structured_output.metadata,
                    "events_count": len(events)
                }
            )
            
            return {
                "success": True,
                "response": structured_output.response,
                "structured_output": structured_output.model_dump(mode="json"),
                "events": events,
                "usage": result.usage() if hasattr(result, 'usage') else None
            }
            
        except Exception as e:
            logger.error(f"Error in event-streaming agent run: {e}")
            
            return {
                "success": False,
                "response": f"Error: {str(e)}",
                "error": str(e),
                "events": events
            }
    
    def get_agent_status(self) -> Dict[str, Any]:
        """Get status information about the agent"""
        try:
            if not is_agent_available():
                return {
                    "available": False,
                    "error": "Pydantic AI agent not available"
                }
            
            return {
                "available": True,
                "agent_type": "Pydantic AI Agent",
                "current_model": getattr(self.agent, 'model', 'unknown'),
                "supports_streaming": True,
                "supports_structured_output": True,
                "supports_events": True,
                "tools_available": [
                    "resolve_coordinate",
                    "search_knowledge", 
                    "store_memory",
                    "get_session_context"
                ],
                "personas_supported": ["system", "nara", "epii"]
            }
            
        except Exception as e:
            return {
                "available": False,
                "error": str(e)
            }


# Utility function for backward compatibility
async def run_agent_streaming(
    message: str,
    session: OrchestratorSession,
    infrastructure_deps: Dict[str, Any],
    model_name: Optional[str] = None,
    context_package: Optional[Dict[str, Any]] = None
) -> AsyncIterator[str]:
    """
    Convenience function for running the agent with streaming
    
    This provides a simplified interface for the existing UnifiedOrchestrator
    """
    if not is_agent_available():
        yield "Error: Pydantic AI agent is not available"
        return
    
    runner = AgentRunner()
    
    async for chunk in runner.run_streaming(
        message=message,
        session=session,
        session_manager=infrastructure_deps.get('session_manager'),
        conversation_manager=infrastructure_deps.get('conversation_manager'),
        bimba_client=infrastructure_deps.get('bimba_client'),
        lightrag_client=infrastructure_deps.get('lightrag_client'),
        graphiti_client=infrastructure_deps.get('graphiti_client'),
        context_package=context_package,
        model_name=model_name
    ):
        yield chunk
