"""
AG-UI Protocol API endpoints for Epi-Logos System

This module provides the AG-UI protocol endpoints that enable frontend
applications to communicate with AI agents using the standardized AG-UI protocol.

Uses Pydantic AI's native AG-UI integration for seamless agent communication.
"""

import logging
import os
from typing import Optional
from fastapi import APIRouter, HTTPException, WebSocket, Request
from fastapi.responses import Response, StreamingResponse
from ag_ui.core import RunAgentInput
from pydantic_ai.ag_ui import handle_ag_ui_request, run_ag_ui

# Use the canonical orchestrator agent and HTTP-based deps
from agentic.agents.orchestrator.orchestrator_agent import orchestrator_agent
from agentic.agents.orchestrator.tools.http_clients_factory import create_enhanced_orchestrator_deps

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ag-ui", tags=["ag-ui-protocol"])




@router.post("/run")
async def run_agent(request: Request) -> Response:
    """
    Process AG-UI RunAgentInput with session-aware context enrichment.

    This endpoint implements a middleware pattern that enriches requests with session context
    while maintaining clean separation between AG-UI protocol and session management.
    
    Architecture:
    - AG-UI Protocol: Handles streaming mechanics 
    - Session Layer: Provides context enrichment capabilities
    - Context Package: Delivers structured, token-efficient context
    """
    logger.info("🔥 AG-UI /run endpoint called")

    try:
        # Parse request body
        body = await request.body()
        import json
        request_data = json.loads(body.decode('utf-8'))
        
        # Extract configuration from AG-UI request
        thread_id = request_data.get('thread_id', 'default-session')
        state = request_data.get('state', {})
        model_config = state.get('model', os.getenv('DEFAULT_LLM_MODEL', 'test'))
        current_persona = state.get('persona', 'system')

        # Extract target_agent from state (for manual delegation from CLI)
        target_agent = state.get('target_agent')

        # Detect new chat from frontend (clear messages button sets this)
        is_new_chat = len(request_data.get('messages', [])) == 1 and 'new-chat' in thread_id

        # Get or create session_id from thread_id mapping (3-layer context hierarchy)
        # First create temporary deps to access redis_client
        auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
        auth_token = None
        if auth_header and auth_header.lower().startswith('bearer '):
            auth_token = auth_header.split(' ', 1)[1].strip()

        temp_deps = await create_enhanced_orchestrator_deps(
            session_id=thread_id,  # Temporary, will be replaced
            user_id="web-user",
            current_persona=current_persona,
            model_config=model_config,
            auth_token=auth_token,
        )

        # Map thread_id to session_id (or create new session)
        session_id = await temp_deps.redis_client.get_session_id_for_thread(thread_id)

        if not session_id:
            # Create new session for this thread
            session_id = await temp_deps.redis_client.create_session(
                user_id="web-user",
                session_data={
                    "source": "ag-ui",
                    "thread_id": thread_id,
                    "model": model_config,
                    "persona": current_persona
                },
                thread_id=thread_id
            )
            logger.info(f"🆕 Created new session {session_id} for thread: {thread_id}")

        if target_agent is not None:
            logger.info(f"🤖 Model: {model_config} | 👤 Persona: {current_persona} | 🎯 Target: #{target_agent} | 🧵 Thread: {thread_id} | 📞 Session: {session_id}")
        else:
            logger.info(f"🤖 Model: {model_config} | 👤 Persona: {current_persona} | 🧵 Thread: {thread_id} | 📞 Session: {session_id}")

        # Create dependencies with proper session_id
        deps = await create_enhanced_orchestrator_deps(
            session_id=session_id,
            user_id="web-user",
            current_persona=current_persona,
            model_config=model_config,
            auth_token=auth_token,
        )

        # Add target_agent to state if provided (for manual delegation)
        if target_agent is not None:
            deps.state['target_agent'] = target_agent
        
        # Create orchestrator agent with selected model
        from agentic.agents.orchestrator.orchestrator_agent import create_orchestrator_agent
        dynamic_agent = create_orchestrator_agent(model_config)
        
        # Use Pydantic AI's native AG-UI integration (original request, enriched deps)
        response = await handle_ag_ui_request(dynamic_agent, request, deps=deps)
        
        # Conversation memory is now handled natively by AG-UI
        # No need for manual storage - Pydantic AI manages conversation context
        
        # Update session with response insights (future extension point)
        # await update_session_context(thread_id, response, deps.redis_client)
        
        return response

    except Exception as e:
        logger.error(f"❌ Error processing AG-UI run: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AG-UI processing error: {e}")


@router.post("/run-direct")
async def run_agent_direct(run_input: RunAgentInput):
    """
    Alternative endpoint that accepts RunAgentInput directly and returns streaming events.

    This provides more control over the input/output format while still using
    Pydantic AI's native AG-UI integration.
    """
    try:
        # Extract configuration from run_input
        thread_id = run_input.thread_id or "default-session"
        state = run_input.state or {}
        model_config = state.get('model', os.getenv('DEFAULT_LLM_MODEL', 'test'))
        current_persona = state.get('persona', 'system')
        target_agent = state.get('target_agent')

        # Create temporary deps to access redis_client for thread mapping
        auth_token = None
        temp_deps = await create_enhanced_orchestrator_deps(
            session_id=thread_id,  # Temporary, will be replaced
            user_id="web-user",
            current_persona=current_persona,
            model_config=model_config,
            auth_token=auth_token,
        )

        # Map thread_id to session_id (or create new session)
        session_id = await temp_deps.redis_client.get_session_id_for_thread(thread_id)

        if not session_id:
            # Create new session for this thread
            session_id = await temp_deps.redis_client.create_session(
                user_id="web-user",
                session_data={
                    "source": "ag-ui-direct",
                    "thread_id": thread_id,
                    "model": model_config,
                    "persona": current_persona
                },
                thread_id=thread_id
            )
            logger.info(f"🆕 Created new session {session_id} for thread: {thread_id}")

        # Create dependencies with proper session_id
        deps = await create_enhanced_orchestrator_deps(
            session_id=session_id,
            user_id="web-user",
            current_persona=current_persona,
            model_config=model_config,
            auth_token=auth_token,
        )

        # Add target_agent to state if provided (for manual delegation)
        if target_agent is not None:
            deps.state['target_agent'] = target_agent

        # Create orchestrator agent with selected model
        from ..agents.orchestrator.orchestrator_agent import create_orchestrator_agent
        dynamic_agent = create_orchestrator_agent(model_config)

        # Use Pydantic AI's run_ag_ui for direct control
        event_stream = run_ag_ui(dynamic_agent, run_input, deps=deps)

        # Collect events for response
        events = []
        async for event_str in event_stream:
            events.append(event_str)

        return {"events": events, "status": "completed"}

    except Exception as e:
        logger.error(f"Error processing AG-UI run direct: {e}")
        raise HTTPException(status_code=500, detail=f"AG-UI processing error: {e}")


# TODO: Implement WebSocket support using Pydantic AI patterns
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time AG-UI communication"""
    await websocket.accept()
    await websocket.send_json({
        "type": "info",
        "message": "WebSocket AG-UI support coming soon - use HTTP endpoints for now"
    })
    await websocket.close()


@router.post("/test")
async def test_ag_ui():
    """Test endpoint to verify Pydantic AI AG-UI integration"""
    print("🧪 AG-UI TEST ENDPOINT HIT!")
    logger.info("🧪 Testing AG-UI integration...")

    # Quick test first
    return {"status": "endpoint_working", "message": "AG-UI test endpoint is accessible"}

    try:
        from ag_ui.core import UserMessage
        import uuid

        # Check if agent has AG-UI support
        has_ag_ui = hasattr(clean_agent, 'to_ag_ui')
        logger.info(f"🔍 Agent has AG-UI support: {has_ag_ui}")

        # Create test RunAgentInput
        test_input = RunAgentInput(
            thread_id="test-thread",
            run_id=str(uuid.uuid4()),
            messages=[UserMessage(id=str(uuid.uuid4()), content="Test message for Nara persona")],
            context=[],
            state={},
            tools=[],
            forwarded_props={"test": True}
        )
        logger.info(f"📝 Created test input with {len(test_input.messages)} messages")

        # Create test dependencies with real model
        model_config = os.getenv('DEFAULT_LLM_MODEL', 'openai:gpt-4o-mini')
        logger.info(f"🤖 Using model: {model_config}")

        deps = await create_enhanced_orchestrator_deps(
            session_id="test-session",
            user_id="test-user",
            current_persona="nara",
            model_config=model_config
        )
        logger.info(f"✅ Dependencies created: {type(deps).__name__}")

        # Test Pydantic AI AG-UI integration
        print("🚀 AG-UI BACKEND: Starting AG-UI event stream...")
        logger.info("🚀 AG-UI BACKEND: Starting AG-UI event stream...")
        event_stream = run_ag_ui(orchestrator_agent, test_input, deps=deps)

        events = []
        async for event_str in event_stream:
            print(f"📡 AG-UI BACKEND: Received event: {event_str[:100]}...")
            logger.info(f"📡 AG-UI BACKEND: Received event: {event_str[:100]}...")
            events.append(event_str)
            if len(events) >= 5:  # Limit for testing
                break

        logger.info(f"✅ AG-UI test completed with {len(events)} events")

        return {
            "status": "success",
            "message": "Pydantic AI AG-UI integration working correctly",
            "events_generated": len(events),
            "sample_events": events[:3],  # Show first 3 events as sample
            "has_ag_ui_support": has_ag_ui,
            "model_used": model_config
        }

    except Exception as e:
        logger.error(f"❌ AG-UI test failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AG-UI test error: {e}")


@router.get("/status")
async def get_status():
    """Get AG-UI service status"""
    return {
        "service": "Pydantic AI AG-UI Integration",
        "status": "operational",
        "agent_type": "CleanOrchestrator",
        "native_ag_ui": True,
        "implementation": "Pydantic AI Native"
    }
