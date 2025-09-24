"""
Chat Runner API

SSE streaming endpoint that uses AgentRunner to stream responses and persist
turns to MongoDB via ConversationManager. Aligns with the established
agent-runner architecture (not the AG-UI handler) so thread history works.
"""

from typing import AsyncIterator, Optional
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
import json
import logging

from agentic.agents.agent_runner import AgentRunner
from agentic.agents.orchestrator.session.session import OrchestratorSession
from agentic.agents.orchestrator.tools.http_clients_factory import create_enhanced_orchestrator_deps

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/chat", tags=["chat-runner"])


async def _sse_wrap(iterator: AsyncIterator[str]) -> AsyncIterator[str]:
    """Wrap text chunks into SSE TEXT_MESSAGE_CONTENT events."""
    try:
        async for chunk in iterator:
            data = {"type": "TEXT_MESSAGE_CONTENT", "delta": chunk}
            yield f"data: {json.dumps(data)}\n\n"
    except Exception as e:
        err = {"type": "RUN_ERROR", "message": str(e)}
        yield f"data: {json.dumps(err)}\n\n"


@router.post("/stream")
async def stream_chat(request: Request):
    """
    Stream a chat turn using the AgentRunner with SSE events.

    Body JSON:
      - message: str (required)
      - persona: str (optional, default 'system')
      - model: str (optional)
      - thread_id: str (required; used as session_id for persistence)
      - user_id: str (optional; header 'X-User-Id' also accepted)
    """
    try:
        body = await request.json()
        message: str = body.get("message", "").strip()
        persona: str = (body.get("persona") or "system").lower()
        model: Optional[str] = body.get("model") or None
        thread_id: str = body.get("thread_id") or ""

        # Prefer header for user identity, fallback to body, then default
        user_id = request.headers.get("x-user-id") or body.get("user_id") or "web-user"

        if not message:
            raise HTTPException(status_code=400, detail="message is required")
        if not thread_id:
            raise HTTPException(status_code=400, detail="thread_id is required")

        # Initialize orchestrator dependencies (HTTP clients + redis/mongo)
        deps = await create_enhanced_orchestrator_deps(
            session_id=thread_id,
            user_id=user_id,
            current_persona=persona,
            model_config=model or ""
        )
        if not deps.redis_client or not deps.mongodb_client:
            raise HTTPException(status_code=503, detail="Required services unavailable")

        # Build in-memory session using thread_id for persistence alignment
        session = OrchestratorSession(
            session_id=thread_id,
            user_id=user_id,
            created_at="",  # Not used by runner
            updated_at="",
            active_persona=persona,
            model_name=model,
            system_instructions=None,
            metadata={}
        )

        runner = AgentRunner()
        iterator = runner.run_streaming(
            message=message,
            session=session,
            session_manager=deps.redis_client,
            conversation_manager=deps.mongodb_client,
            bimba_client=deps.bimba_client,
            lightrag_client=deps.lightrag_client,
            graphiti_client=deps.graphiti_client,
            context_package=None,
            message_history=None,
            model_name=model,
        )

        return StreamingResponse(_sse_wrap(iterator), media_type="text/event-stream")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat stream error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

