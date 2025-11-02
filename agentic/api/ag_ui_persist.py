"""
AG-UI Streaming + Persistence Endpoint

Wraps Pydantic AI's run_ag_ui to:
- Stream AG-UI events to the client as SSE (data: ...\n\n)
- Accumulate assistant text and persist a turn to Mongo via ConversationManager

This preserves the dev pages' AG-UI behavior while adding durable history.
"""

from typing import AsyncIterator, Optional
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
import json
import logging

from ag_ui.core import RunAgentInput
from pydantic_ai.ag_ui import run_ag_ui

from agentic.agents.agent_router import AgentRouter
from agentic.agents.orchestrator.tools.http_clients_factory import create_enhanced_orchestrator_deps
import httpx

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ag-ui", tags=["ag-ui-protocol"])


async def _persist_turn(
    *,
    deps,
    thread_id: str,
    user_id: str,
    user_message: str,
    assistant_text: str,
    persona: Optional[str],
    timing_ms: Optional[int] = None,
    error: Optional[str] = None,
):
    try:
        if not deps or not getattr(deps, 'mongodb_client', None):
            logger.warning("Conversation persistence skipped: Mongo client not available")
            return
        payload = {
            "execution_time_ms": timing_ms or 0
        }
        if error:
            payload["error"] = error
        await deps.mongodb_client.add_interaction(
            session_id=thread_id,
            user_id=user_id,
            user_message=user_message,
            agent_response=assistant_text,
            persona=(persona or "system"),
            metadata=payload,
            pydantic_messages=None
        )
    except Exception as e:
        logger.error(f"Failed to persist conversation turn: {e}")


@router.post("/run-persist")
async def run_agent_with_persistence(request: Request):
    """
    AG-UI-compatible streaming endpoint with durable persistence.

    Accepts RunAgentInput JSON body (same as AG-UI) and streams SSE events.
    On completion, persists a single turn (user_message, assistant_text) to Mongo.
    """
    try:
        body = await request.json()
        run_input = RunAgentInput.model_validate(body)

        # Extract identity + config
        thread_id = run_input.thread_id or "default-thread"
        state = run_input.state or {}
        persona = (state.get('persona') or 'system').lower()
        model_config = state.get('model') or ''
        # Prefer header identity, then forwarded_props, then fallback
        user_id = request.headers.get('x-user-id') or run_input.forwarded_props.get('user_id') or 'web-user'

        # Derive user message (last user content in messages list)
        user_message = ''
        for m in reversed(run_input.messages or []):
            if getattr(m, 'role', None) == 'user':
                user_message = m.content or ''
                break

        # Prepare deps (ensures redis + mongo clients)
        deps = await create_enhanced_orchestrator_deps(
            session_id=thread_id,
            user_id=user_id,
            current_persona=persona,
            model_config=model_config or ''
        )

        # Create agent via factory pattern
        agent_router = AgentRouter(
            bimba_client=deps.bimba_client,
            redis_client=deps.redis_client,
            default_model=model_config or None
        )
        agent = await agent_router.get_orchestrator_agent(model_name=model_config or None)

        logger.info(f"🚀 Starting agent run: thread={thread_id}, persona={persona}, user_msg='{user_message[:100]}'")

        # Run AG-UI event stream (yields per-event strings)
        event_stream = run_ag_ui(agent, run_input, deps=deps)

        # Accumulate assistant response
        assistant_accum = []

        async def sse_wrapper() -> AsyncIterator[str]:
            import time
            start = time.time()
            event_count = 0
            try:
                async for event_str in event_stream:
                    event_count += 1
                    # Normalize and stream as proper SSE
                    # Some versions emit raw JSON, others may already include 'data: '
                    line = event_str.strip()
                    if line.startswith('data: '):
                        # Forward as-is (already SSE-formatted)
                        yield f"{line}\n\n"
                        json_str = line[6:]
                    else:
                        yield f"data: {line}\n\n"
                        json_str = line

                    # Try to parse JSON event for accumulation
                    try:
                        evt = json.loads(json_str)
                        if evt.get('type') == 'TEXT_MESSAGE_CONTENT' and evt.get('delta'):
                            assistant_accum.append(evt['delta'])
                    except Exception:
                        # Ignore non-JSON events
                        pass
                # Persist on success via Backend
                total_ms = int((time.time() - start) * 1000)
                logger.info(f"✅ Agent completed: {event_count} events, {len(assistant_accum)} text chunks, {total_ms}ms")

                # Get context from Redis metadata if available
                context = None
                try:
                    if deps.redis_client:
                        session_data = await deps.redis_client.get_session(thread_id)
                        if session_data:
                            context = session_data.get("metadata", {}).get("context")
                except Exception:
                    pass  # Context is optional

                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        payload = {
                            "user_id": user_id,
                            "thread_id": thread_id,
                            "persona": persona,
                            "model": model_config,
                            "user_message": user_message,
                            "assistant_text": ''.join(assistant_accum),
                            "timing_ms": total_ms
                        }
                        # Include context if available
                        if context:
                            payload["context"] = context

                        await client.post(
                            "http://localhost:8000/api/conversations/turn",
                            json=payload
                        )
                except Exception as pe:
                    logger.error(f"Backend persistence failed: {pe}")
            except Exception as e:
                # Log the actual error
                logger.error(f"🔥 Agent execution failed: {e}", exc_info=True)
                # Persist error turn via Backend
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        await client.post(
                            "http://localhost:8000/api/conversations/turn",
                            json={
                                "user_id": user_id,
                                "thread_id": thread_id,
                                "persona": persona,
                                "model": model_config,
                                "user_message": user_message,
                                "assistant_text": ''.join(assistant_accum),
                                "timing_ms": None
                            }
                        )
                except Exception as pe:
                    logger.error(f"Backend persistence (error) failed: {pe}")
                # Also emit error to client
                err = {"type": "RUN_ERROR", "message": str(e)}
                yield f"data: {json.dumps(err)}\n\n"

        headers = {
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
        return StreamingResponse(sse_wrapper(), media_type="text/event-stream", headers=headers)

    except Exception as e:
        logger.error(f"AG-UI persist endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
