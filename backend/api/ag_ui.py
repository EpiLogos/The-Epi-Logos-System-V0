"""
Real AG-UI Protocol API Routes

This module provides FastAPI routes for ACTUAL AG-UI protocol integration
using the official ag-ui-protocol package.
"""
from typing import Optional
import logging
import uuid
from fastapi import APIRouter, Request, WebSocket, HTTPException
from fastapi.responses import StreamingResponse
from ag_ui.core import RunAgentInput, Context, UserMessage, Message
from ..epi_logos_system.services.ag_ui_service import ag_ui_service

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/v1/ag-ui", tags=["ag-ui-protocol"])


@router.post("/run")
async def run_agent(run_input: RunAgentInput):
    """
    Process AG-UI RunAgentInput and return streaming events.
    
    This is the core AG-UI protocol endpoint that accepts RunAgentInput
    and returns a stream of AG-UI events.
    """
    try:
        events = []
        async for event in ag_ui_service.handle_run_input(run_input):
            events.append({
                "type": event.type if hasattr(event, 'type') else "unknown",
                "data": event.model_dump() if hasattr(event, 'model_dump') else str(event)
            })
        
        return {"events": events, "status": "completed"}
        
    except Exception as e:
        logger.error(f"Error processing AG-UI run: {e}")
        raise HTTPException(status_code=500, detail=f"AG-UI processing error: {e}")


@router.get("/events/stream")
async def stream_events(
    request: Request,
    persona: Optional[str] = None
):
    """
    Stream AG-UI events using Server-Sent Events.
    
    Args:
        persona: Optional persona filter (nara, epii, anuttara, etc.)
    """
    return await ag_ui_service.stream_events_sse(request, persona)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time AG-UI communication"""
    await ag_ui_service.handle_websocket(websocket)


@router.post("/test")
async def test_ag_ui():
    """Test endpoint to verify AG-UI integration"""
    try:
        # Create test RunAgentInput with proper UserMessage ID
        test_input = RunAgentInput(
            messages=[UserMessage(id=str(uuid.uuid4()), content="Test message for Nara persona")],
            context=Context(persona="nara"),
            state={}
        )
        
        # Process through AG-UI service
        events = []
        async for event in ag_ui_service.handle_run_input(test_input):
            events.append({
                "type": event.type if hasattr(event, 'type') else "unknown",
                "data": event.model_dump() if hasattr(event, 'model_dump') else str(event)
            })
        
        return {
            "status": "success",
            "message": "AG-UI Protocol integration working correctly",
            "events_generated": len(events),
            "events": events[:3]  # Show first 3 events as sample
        }
        
    except Exception as e:
        logger.error(f"AG-UI test failed: {e}")
        raise HTTPException(status_code=500, detail=f"AG-UI test error: {e}")


@router.get("/status")
async def get_status():
    """Get AG-UI service status"""
    return {
        "service": "AG-UI Protocol Service",
        "status": "operational",
        "personas": list(ag_ui_service.personas.keys()),
        "sdk_version": "ag-ui-protocol==0.1.8",
        "implementation": "REAL (not mock)"
    }