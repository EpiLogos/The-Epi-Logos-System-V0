"""
Real AG-UI Protocol Service for Epi-Logos System

This module provides ACTUAL AG-UI protocol integration using the official
ag-ui-protocol package, replacing the invalid mock implementation.
"""
from typing import Dict, Any, Optional, AsyncIterator
from datetime import datetime, timezone
import logging
import asyncio

from ag_ui.core import (
    RunAgentInput, BaseEvent, EventType, Message, Context, State,
    TextMessageStartEvent, TextMessageContentEvent, TextMessageEndEvent,
    RunStartedEvent, RunFinishedEvent, UserMessage
)
import uuid
from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)


class EpiLogosContext(Context):
    """Extended AG-UI Context for Epi-Logos System"""
    def __init__(
        self,
        persona: str = "nara",
        coordinate: Optional[str] = None,
        session_id: Optional[str] = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.persona = persona
        self.coordinate = coordinate
        self.session_id = session_id


class AGUIProtocolService:
    """Real AG-UI Protocol service using official SDK"""
    
    def __init__(self):
        self.active_runs: Dict[str, Dict[str, Any]] = {}
        self.event_queue = asyncio.Queue()
        self.personas = {
            "nara": "Dialogical-Identity Processing (#4)",
            "epii": "Synthesis & Orchestration Processing (#5)", 
            "anuttara": "Absolute Ground & Proto-Logical Processing (#0)",
            "paramasiva": "Foundational Architect of Quaternal Logic (#1)",
            "parashakti": "Cosmic Imagination & Vibrational Matrix (#2)",
            "mahamaya": "Universal Transcription Engine (#3)"
        }
    
    async def handle_run_input(self, run_input: RunAgentInput) -> AsyncIterator[BaseEvent]:
        """Process RunAgentInput and yield AG-UI events"""
        run_id = f"run_{datetime.now(timezone.utc).isoformat()}"
        
        # Extract persona from context if available
        context = run_input.context or Context()
        persona = getattr(context, 'persona', 'nara')
        
        # Start run event
        yield RunStartedEvent(run_id=run_id)
        
        try:
            # Process messages for the specified persona
            for message in run_input.messages:
                if isinstance(message, UserMessage):
                    # Start text message
                    message_id = f"msg_{datetime.now(timezone.utc).isoformat()}"
                    yield TextMessageStartEvent(messageId=message_id)
                    
                    # Process message content based on persona
                    response_text = await self._process_with_persona(message.content, persona)
                    
                    # Stream response content
                    words = response_text.split()
                    for i, word in enumerate(words):
                        chunk = word + (" " if i < len(words) - 1 else "")
                        yield TextMessageContentEvent(
                            messageId=message_id,
                            content=chunk
                        )
                        # Small delay for realistic streaming
                        await asyncio.sleep(0.05)
                    
                    # End text message
                    yield TextMessageEndEvent(messageId=message_id)
        
        except Exception as e:
            logger.error(f"Error processing AG-UI run: {e}")
        finally:
            # Finish run
            yield RunFinishedEvent(run_id=run_id)
    
    async def _process_with_persona(self, content: str, persona: str) -> str:
        """Process content with specified Epi-Logos persona"""
        persona_desc = self.personas.get(persona, "Unknown persona")
        
        # Basic processing based on persona type
        if persona == "nara":
            return f"[NARA] Processing your request through dialogical-identity framework: {content}"
        elif persona == "epii":
            return f"[EPII] Orchestrating synthesis response: {content}"
        elif persona == "anuttara":
            return f"[ANUTTARA] Proto-logical ground processing: {content}"
        elif persona == "paramasiva":
            return f"[PARAMASIVA] Quaternal logic analysis: {content}"
        elif persona == "parashakti":
            return f"[PARASHAKTI] Vibrational matrix interpretation: {content}"
        elif persona == "mahamaya":
            return f"[MAHAMAYA] Universal transcription: {content}"
        else:
            return f"[{persona.upper()}] Processing: {content}"
    
    async def stream_events_sse(
        self, 
        request: Request,
        persona: Optional[str] = None
    ) -> StreamingResponse:
        """Create Server-Sent Events stream for AG-UI events"""
        
        async def event_generator():
            try:
                while True:
                    # Check if client disconnected
                    if await request.is_disconnected():
                        break
                    
                    try:
                        # Get event with timeout
                        event = await asyncio.wait_for(self.event_queue.get(), timeout=30.0)
                        
                        # Filter by persona if specified
                        if persona:
                            event_persona = getattr(event, 'persona', None)
                            if event_persona and event_persona != persona:
                                continue
                        
                        # Format as SSE
                        event_data = {
                            "type": event.type if hasattr(event, 'type') else "unknown",
                            "data": event.model_dump() if hasattr(event, 'model_dump') else str(event),
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        }
                        
                        yield f"data: {event_data}\n\n"
                        
                    except asyncio.TimeoutError:
                        # Send heartbeat
                        yield f"data: {{'type': 'heartbeat', 'timestamp': '{datetime.now(timezone.utc).isoformat()}'}}\n\n"
                        
            except Exception as e:
                logger.error(f"Error in SSE event stream: {e}")
                yield f"data: {{'type': 'error', 'message': 'Stream error'}}\n\n"
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*"
            }
        )
    
    async def handle_websocket(self, websocket: WebSocket):
        """Handle WebSocket connections for AG-UI protocol"""
        await websocket.accept()
        
        try:
            while True:
                # Receive message from client
                data = await websocket.receive_json()
                
                # Process as RunAgentInput
                try:
                    run_input = RunAgentInput.model_validate(data)
                    
                    # Process and stream events back
                    async for event in self.handle_run_input(run_input):
                        await websocket.send_json({
                            "type": event.type if hasattr(event, 'type') else "unknown",
                            "data": event.model_dump() if hasattr(event, 'model_dump') else str(event)
                        })
                        
                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Invalid RunAgentInput: {e}"
                    })
                    
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
        finally:
            await websocket.close()
    
    def add_event(self, event: BaseEvent):
        """Add event to queue for streaming"""
        try:
            self.event_queue.put_nowait(event)
        except asyncio.QueueFull:
            logger.warning("Event queue full, dropping event")


# Global service instance
ag_ui_service = AGUIProtocolService()